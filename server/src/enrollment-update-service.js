
export function registerEnrollmentUpdateRoutes(app, pool, auth, admin) {

  // ACTUALIZAR MATRÍCULA
  app.put('/api/enrollments/:id', auth, admin, async (req, res, next) => {
    const { student, course, date, status } = req.body || {};

    if (
      typeof student !== 'string' ||
      typeof course !== 'string' ||
      typeof date !== 'string' ||
      !['Pendiente', 'Confirmada'].includes(status) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date
    ) {
      return res.status(400).json({
        error: 'Datos de matrícula inválidos'
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const institutionId = req.user.institutionId;

      const existing = await client.query(
        `SELECT *
         FROM enrollments
         WHERE id = $1 AND institution_id = $2
         FOR UPDATE`,
        [req.params.id, institutionId]
      );

      if (!existing.rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          error: 'Matrícula no encontrada'
        });
      }

      const old = existing.rows[0];

      // Por seguridad no cambiamos estudiante ni curso
      if (
        student.trim().toLowerCase() !== old.student.trim().toLowerCase() ||
        course.trim().toLowerCase() !== old.course.trim().toLowerCase()
      ) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'No se permite cambiar el estudiante o curso'
        });
      }

      const result = await client.query(
        `SELECT id, capacity, students, status
         FROM courses
         WHERE institution_id = $1
           AND LOWER(TRIM(name)) = LOWER(TRIM($2))
         FOR UPDATE`,
        [institutionId, old.course]
      );

      if (result.rows.length !== 1) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: 'No se encontró un curso único para esta matrícula'
        });
      }

      const selectedCourse = result.rows[0];

      if (old.status !== status) {
        if (status === 'Confirmada') {
          if (selectedCourse.status !== 'Activo') {
            await client.query('ROLLBACK');
            return res.status(400).json({
              error: 'El curso debe estar activo'
            });
          }

          if (selectedCourse.students >= selectedCourse.capacity) {
            await client.query('ROLLBACK');
            return res.status(400).json({
              error: 'No hay cupos disponibles'
            });
          }

          await client.query(
            `UPDATE courses
             SET students = students + 1
             WHERE id = $1`,
            [selectedCourse.id]
          );
        } else {
          if (selectedCourse.students <= 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({
              error: 'El contador de inscritos necesita revisión'
            });
          }

          await client.query(
            `UPDATE courses
             SET students = students - 1
             WHERE id = $1`,
            [selectedCourse.id]
          );
        }
      }

      const updated = await client.query(
        `UPDATE enrollments
         SET date = $1, status = $2
         WHERE id = $3 AND institution_id = $4
         RETURNING *`,
        [date, status, req.params.id, institutionId]
      );

      await client.query(
        `INSERT INTO audit_logs
         (institution_id, user_id, action, entity, entity_id)
         VALUES ($1, $2, 'UPDATE', 'enrollments', $3)`,
        [institutionId, req.user.sub, req.params.id]
      );

      await client.query('COMMIT');
      return res.json(updated.rows[0]);

    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback:', rollbackError);
      }
      next(err);
    } finally {
      client.release();
    }
  });

  // ELIMINAR MATRÍCULA
  app.delete('/api/enrollments/:id', auth, admin, async (req, res, next) => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const institutionId = req.user.institutionId;

      const existing = await client.query(
        `SELECT *
         FROM enrollments
         WHERE id = $1 AND institution_id = $2
         FOR UPDATE`,
        [req.params.id, institutionId]
      );

      if (!existing.rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          error: 'Matrícula no encontrada'
        });
      }

      const enrollment = existing.rows[0];

      if (enrollment.status === 'Confirmada') {
        const courses = await client.query(
          `SELECT id, students
           FROM courses
           WHERE institution_id = $1
             AND LOWER(TRIM(name)) = LOWER(TRIM($2))
           FOR UPDATE`,
          [institutionId, enrollment.course]
        );

        if (courses.rows.length !== 1 ||
            courses.rows[0].students <= 0) {
          await client.query('ROLLBACK');
          return res.status(409).json({
            error: 'No se puede liberar el cupo de forma segura'
          });
        }

        await client.query(
          `UPDATE courses
           SET students = students - 1
           WHERE id = $1`,
          [courses.rows[0].id]
        );
      }

      await client.query(
        `DELETE FROM enrollments
         WHERE id = $1 AND institution_id = $2`,
        [req.params.id, institutionId]
      );

      await client.query(
        `INSERT INTO audit_logs
         (institution_id, user_id, action, entity, entity_id)
         VALUES ($1, $2, 'DELETE', 'enrollments', $3)`,
        [institutionId, req.user.sub, req.params.id]
      );

      await client.query('COMMIT');
      return res.status(204).end();

    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback:', rollbackError);
      }
      next(err);
    } finally {
      client.release();
    }
  });
}
