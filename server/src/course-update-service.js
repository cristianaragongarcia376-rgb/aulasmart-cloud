
export function registerCourseUpdateRoutes(
  app,
  pool,
  auth,
  admin,
  audit
) {
  app.put('/api/courses/:id', auth, admin, async (req, res, next) => {
    const { name, code, teacher, grade, capacity, status } = req.body || {};

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof code !== 'string' ||
      !code.trim() ||
      typeof teacher !== 'string' ||
      !teacher.trim() ||
      typeof grade !== 'string' ||
      !grade.trim() ||
      !Number.isInteger(capacity) ||
      capacity <= 0 ||
      !['Activo', 'Pendiente'].includes(status)
    ) {
      return res.status(400).json({
        error: 'Datos del curso inválidos'
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const institutionId = req.user.institutionId;

      const existing = await client.query(
        `SELECT *
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

      const current = existing.rows[0];

      // Evitar cambiar el nombre mientras existan matrículas
      const enrollments = await client.query(
        `SELECT COUNT(*)::int AS total
         FROM enrollments
         WHERE institution_id = $1
           AND LOWER(TRIM(course)) = LOWER(TRIM($2))`,
        [institutionId, current.name]
      );

      if (
        Number(enrollments.rows[0].total) > 0 &&
        name.trim().toLowerCase() !== current.name.trim().toLowerCase()
      ) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: 'No se puede renombrar un curso con matrículas'
        });
      }

      if (capacity < current.students) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'La capacidad no puede ser menor a los inscritos'
        });
      }

      // No se permite modificar students desde el formulario
      const updated = await client.query(
        `UPDATE courses
         SET name = $1,
             code = $2,
             teacher = $3,
             grade = $4,
             capacity = $5,
             status = $6
         WHERE id = $7 AND institution_id = $8
         RETURNING *`,
        [
          name.trim(),
          code.trim(),
          teacher.trim(),
          grade.trim(),
          capacity,
          status,
          req.params.id,
          institutionId
        ]
      );

      await client.query(
        `INSERT INTO audit_logs
         (institution_id, user_id, action, entity, entity_id)
         VALUES ($1, $2, 'UPDATE', 'courses', $3)`,
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
}
