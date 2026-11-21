
export function registerCourseCreateDeleteRoutes(app, pool, auth, admin) {

  // CREAR CURSO CON CONTADOR INICIAL EN CERO
  app.post('/api/courses', auth, admin, async (req, res, next) => {
    const { name, code, teacher, grade, capacity, status } = req.body || {};

    if (
      typeof name !== 'string' || !name.trim() ||
      typeof code !== 'string' || !code.trim() ||
      typeof teacher !== 'string' || !teacher.trim() ||
      typeof grade !== 'string' || !grade.trim() ||
      !Number.isInteger(capacity) || capacity <= 0 ||
      !['Activo', 'Pendiente'].includes(status)
    ) {
      return res.status(400).json({
        error: 'Datos del curso inválidos'
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO courses
         (institution_id, name, code, teacher, grade,
          capacity, students, status)
         VALUES ($1, $2, $3, $4, $5, $6, 0, $7)
         RETURNING *`,
        [
          req.user.institutionId,
          name.trim(),
          code.trim(),
          teacher.trim(),
          grade.trim(),
          capacity,
          status
        ]
      );

      await client.query(
        `INSERT INTO audit_logs
         (institution_id, user_id, action, entity, entity_id)
         VALUES ($1, $2, 'CREATE', 'courses', $3)`,
        [
          req.user.institutionId,
          req.user.sub,
          result.rows[0].id
        ]
      );

      await client.query('COMMIT');
      return res.status(201).json(result.rows[0]);

    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback:', rollbackError);
      }

      if (err.code === '23505') {
        return res.status(409).json({
          error: 'Ya existe un curso con ese código'
        });
      }

      next(err);
    } finally {
      client.release();
    }
  });

  // ELIMINAR CURSO SOLO SI NO TIENE MATRÍCULAS
  app.delete('/api/courses/:id', auth, admin, async (req, res, next) => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const institutionId = req.user.institutionId;

      const existing = await client.query(
        `SELECT id, name, students
         FROM courses
         WHERE id = $1 AND institution_id = $2
         FOR UPDATE`,
        [req.params.id, institutionId]
      );

      if (!existing.rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          error: 'Curso no encontrado'
        });
      }

      const course = existing.rows[0];

      const enrollmentCount = await client.query(
        `SELECT COUNT(*)::int AS total
         FROM enrollments
         WHERE institution_id = $1
           AND LOWER(TRIM(course)) = LOWER(TRIM($2))`,
        [institutionId, course.name]
      );

      if (
        enrollmentCount.rows[0].total > 0 ||
        course.students > 0
      ) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: 'El curso tiene inscritos o matrículas asociadas'
        });
      }

      await client.query(
        `DELETE FROM courses
         WHERE id = $1 AND institution_id = $2`,
        [req.params.id, institutionId]
      );

      await client.query(
        `INSERT INTO audit_logs
         (institution_id, user_id, action, entity, entity_id)
         VALUES ($1, $2, 'DELETE', 'courses', $3)`,
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
