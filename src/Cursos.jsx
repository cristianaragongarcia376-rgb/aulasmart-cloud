
import { useEffect, useState } from 'react';
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from './api.js';

const initialForm = {
  name: '',
  code: '',
  teacher: '',
  grade: '',
  capacity: 30,
  students: 0,
  status: 'Activo',
};

export default function Cursos({ token }) {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ ...initialForm });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;

    async function loadCourses() {
      setLoading(true);
      setError('');

      try {
        const data = await getCourses(token);
        if (active) {
          setCourses(data);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCourses();

    return () => {
      active = false;
    };
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    const course = {
      ...form,
      name: form.name.trim(),
      code: form.code.trim(),
      teacher: form.teacher.trim(),
      grade: form.grade.trim(),
      capacity: Number(form.capacity),
      students: Number(form.students),
    };

    if (
      !Number.isInteger(course.capacity) ||
      course.capacity <= 0 ||
      !Number.isInteger(course.students) ||
      course.students < 0 ||
      course.students > course.capacity
    ) {
      setError('La capacidad y los inscritos deben ser válidos.');
      return;
    }

    setSaving(true);

    try {
      if (editingId !== null) {
        await updateCourse(editingId, course, token);
      } else {
        await createCourse(course, token);
      }

      const updated = await getCourses(token);
      setCourses(updated);
      setForm({ ...initialForm });
      setEditingId(null);
      setMessage('Curso guardado correctamente.');
    } catch (err) {
      setError(err.message || 'No se pudo guardar el curso.');
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(course) {
    setEditingId(course.id);
    setForm({
      name: course.name,
      code: course.code,
      teacher: course.teacher,
      grade: course.grade,
      capacity: course.capacity,
      students: course.students,
      status: course.status,
    });
    setError('');
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(course) {
    const confirmed = window.confirm(
      `¿Eliminar el curso ${course.name}? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    setError('');
    setMessage('');
    setSaving(true);

    try {
      await deleteCourse(course.id, token);
      setCourses(await getCourses(token));

      if (editingId === course.id) {
        setEditingId(null);
        setForm({ ...initialForm });
      }

      setMessage('Curso eliminado correctamente.');
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el curso.');
    } finally {
      setSaving(false);
    }
  }

  const filteredCourses = courses.filter(course =>
    [course.name, course.code, course.teacher, course.grade]
      .some(value =>
        String(value ?? '')
          .toLowerCase()
          .includes(search.toLowerCase())
      )
  );

  return (
    <>
      <section>
        <h2>
          {editingId !== null
            ? 'Editar curso'
            : 'Registrar nuevo curso'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="course-name">Nombre del curso</label>
            <input
              id="course-name"
              required
              value={form.name}
              onChange={e =>
                setForm({ ...form, name: e.target.value })
              }
            />
          </div>

          <div>
            <label htmlFor="course-code">Código del curso</label>
            <input
              id="course-code"
              required
              placeholder="Ejemplo: MAT101"
              value={form.code}
              onChange={e =>
                setForm({ ...form, code: e.target.value })
              }
            />
          </div>

          <div>
            <label htmlFor="course-teacher">Docente</label>
            <input
              id="course-teacher"
              required
              value={form.teacher}
              onChange={e =>
                setForm({ ...form, teacher: e.target.value })
              }
            />
          </div>

          <div>
            <label htmlFor="course-grade">Grado</label>
            <input
              id="course-grade"
              required
              placeholder="Ejemplo: 10 A"
              value={form.grade}
              onChange={e =>
                setForm({ ...form, grade: e.target.value })
              }
            />
          </div>

          <div>
            <label htmlFor="course-capacity">
              Capacidad máxima
            </label>
            <input
              id="course-capacity"
              type="number"
              min="1"
              step="1"
              required
              value={form.capacity}
              onChange={e =>
                setForm({
                  ...form,
                  capacity: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label htmlFor="course-students">
              Estudiantes inscritos
            </label>
            <input
              id="course-students"
              type="number"
              min="0"
              max={form.capacity}
              step="1"
              required
              value={form.students}
              onChange={e =>
                setForm({
                  ...form,
                  students: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label htmlFor="course-status">Estado</label>
            <select
              id="course-status"
              value={form.status}
              onChange={e =>
                setForm({ ...form, status: e.target.value })
              }
            >
              <option value="Activo">Activo</option>
              <option value="Pendiente">Pendiente</option>
            </select>
          </div>

          <button type="submit" disabled={saving}>
            {saving
              ? 'Guardando...'
              : editingId !== null
                ? 'Actualizar curso'
                : 'Registrar curso'}
          </button>

          {editingId !== null && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ ...initialForm });
                setError('');
              }}
            >
              Cancelar edición
            </button>
          )}
        </form>
      </section>

      {error && (
        <p role="alert" style={{ color: '#dc2626' }}>
          {error}
        </p>
      )}

      {message && (
        <p role="status" style={{ color: '#15803d' }}>
          {message}
        </p>
      )}

      <section>
        <h2>Cursos registrados en PostgreSQL</h2>

        <input
          type="search"
          aria-label="Buscar cursos"
          placeholder="Buscar por nombre, código, docente o grado"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 20 }}
        />

        {loading ? (
          <p>Cargando cursos...</p>
        ) : filteredCourses.length === 0 ? (
          <p>No se encontraron cursos.</p>
        ) : (
          <ul>
            {filteredCourses.map(course => (
              <li key={course.id}>
                <strong>{course.name}</strong>
                <p>
                  Código: {course.code} ·
                  Docente: {course.teacher}
                </p>
                <p>
                  Grado: {course.grade} ·
                  Inscritos: {course.students}/{course.capacity}
                </p>
                <p>Estado: {course.status}</p>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleEdit(course)}
                >
                  Editar
                </button>
                {' '}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleDelete(course)}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
