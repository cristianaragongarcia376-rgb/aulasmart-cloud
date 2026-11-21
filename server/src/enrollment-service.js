
export function registerEnrollmentRoutes(app, pool, auth, admin) {
  app.post('/api/enrollments', auth, admin, async (req, res, next) => {
    const { student, course, date, status } = req.body || {};

    if (
      typeof student !== 'string' ||
      typeof course !== 'string' ||
      typeof date !== 'string' ||
      !['Pendiente', 'Confirmada'].includes(status)
    ) {
      return res.status(400).json({
        error: 'Datos de matrícula inválidos'
      });
    }

    const studentName = student.trim();
    const courseName = course.trim();

    const validDate =
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      !Number.isNaN(Date.parse(date)) &&
      new Date(date).toISOString().slice(0, 10) === date;

    if (
      !studentName ||
      !courseName ||
      studentName.length > 160 ||
      courseName.length > 160 ||
      !validDate
    ) {
      return res.status(400).json({
        error: 'Completa correctamente los campos'
      });
    }

    const client = await pool.connect();
    let inTransaction = false;

    try {
      await client.query('BEGIN');
      inTransaction = true;

      const institutionId = req.user.institutionId;

      const students = await client.query(
        `SELECT id, name, status
         FROM students
         WHERE institution_id = $1
           AND LOWER(TRIM(name)) = LOWER($2)
         LIMIT 2`,
        [institutionId, studentName.toLowerCase()]
      );

      if (students.rows.length !== 1) {
        await client.query('ROLLBACK');
        inTransaction = false;
        return res.status(400).json({
          error: students.rows.length === 0
            ? 'El estudiante no existe'
            : 'Hay varios estudiantes con ese nombre'
        });
      }

      const selectedStudent = students.rows[0];

      if (selectedStudent.status !== 'Activo') {
        await client.query('ROLLBACK');
        inTransaction = false;
        return res.status(400).json({
          error: 'El estudiante no está activo'
        });
      }

      // Bloquear el curso durante la operación
      const courses = await client.query(
        `SELECT id, name, capacity, students, status
         FROM courses
         WHERE institution_id = $1
           AND LOWER(TRIM(name)) = LOWER($2)
         ORDER BY id
         FOR UPDATE`,
        [institutionId, courseName.toLowerCase()]
      );

      if (courses.rows.length !== 1) {
        await client.query('ROLLBACK');
        inTransaction = false;
        return res.status(400).json({
          error: courses.rows.length === 0
            ? 'El curso no existe'
            : 'Hay varios cursos con ese nombre'
        });
      }

      const selectedCourse = courses.rows[0];

      if (status === 'Confirmada') {
        if (selectedCourse.status !== 'Activo') {
          await client.query('ROLLBACK');
          inTransaction = false;
          return res.status(400).json({
            error: 'El curso debe estar activo'
          });
        }

        if (selectedCourse.students >= selectedCourse.capacity) {
          await client.query('ROLLBACK');
          inTransaction = false;
          return res.status(400).json({
            error: 'No hay cupos disponibles'
          });
        }
      }

      const result = await client.query(
        `INSERT INTO enrollments
           (institution_id, student, course, date, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          institutionId,
          selectedStudent.name,
          selectedCourse.name,
          date,
          status
        ]
      );

      if (status === 'Confirmada') {
        await client.query(
          `UPDATE courses
           SET students = students + 1
           WHERE id = $1 AND institution_id = $2`,
          [selectedCourse.id, institutionId]
        );
      }

      await client.query(
        `INSERT INTO audit_logs
           (institution_id, user_id, action, entity, entity_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          institutionId,
          req.user.sub,
          'CREATE',
          'enrollments',
          result.rows[0].id
        ]
      );

      await client.query('COMMIT');
      inTransaction = false;

      return res.status(201).json(result.rows[0]);
    } catch (err) {
      if (inTransaction) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Error en rollback:', rollbackError);
        }
      }

      if (err.code === '23505') {
        return res.status(409).json({
          error: 'El estudiante ya está matriculado en este curso'
        });
      }

      next(err);
    } finally {
      client.release();
    }
  });
}

