
import { useEffect, useState } from 'react';
import {
  getEnrollments,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
} from './api.js';

const emptyForm = () => ({
  student: '',
  course: '',
  date: new Date().toLocaleDateString('en-CA'),
  status: 'Pendiente',
});

export default function Matriculas({ token }) {
  const [enrollments, setEnrollments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const data = await getEnrollments(token);
        if (active) setEnrollments(data);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    const data = {
      student: form.student.trim(),
      course: form.course.trim(),
      date: form.date,
      status: form.status,
    };

    if (!data.student || !data.course || !data.date) {
      setError('Completa todos los campos.');
      return;
    }

    const duplicate = enrollments.some(item =>
      item.id !== editingId &&
      item.student.trim().toLowerCase() ===
        data.student.toLowerCase() &&
      item.course.trim().toLowerCase() ===
        data.course.toLowerCase()
    );

    if (duplicate) {
      setError('Este estudiante ya aparece matriculado en ese curso.');
      return;
    }

    setSaving(true);

    try {
      if (editingId !== null) {
        await updateEnrollment(editingId, data, token);
      } else {
        await createEnrollment(data, token);
      }

      setEnrollments(await getEnrollments(token));
      setEditingId(null);
      setForm(emptyForm());
      setMessage('Matrícula guardada correctamente.');
    } catch (err) {
      setError(err.message || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(item) {
    setEditingId(item.id);
    setForm({
      student: item.student,
      course: item.course,
      date: String(item.date).slice(0, 10),
      status: item.status,
    });
    setError('');
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `¿Eliminar la matrícula de ${item.student} en ${item.course}?`
    );

    if (!confirmed) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await deleteEnrollment(item.id, token);
      setEnrollments(await getEnrollments(token));

      if (editingId === item.id) {
        setEditingId(null);
        setForm(emptyForm());
      }

      setMessage('Matrícula eliminada correctamente.');
    } catch (err) {
      setError(err.message || 'No se pudo eliminar.');
    } finally {
      setSaving(false);
    }
  }

  const filtered = enrollments.filter(item =>
    [item.student, item.course, item.status].some(value =>
      String(value ?? '').toLowerCase().includes(
        search.toLowerCase()
      )
    )
  );

  return (
    <>
      <section>
        <h2>
          {editingId !== null
            ? 'Editar matrícula'
            : 'Registrar nueva matrícula'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="enrollment-student">
              Estudiante
            </label>
            <input
              id="enrollment-student"
              required
              placeholder="Nombre del estudiante"
              value={form.student}
              onChange={e => setForm({
                ...form,
                student: e.target.value
              })}
            />
          </div>

          <div>
            <label htmlFor="enrollment-course">
              Curso
            </label>
            <input
              id="enrollment-course"
              required
              placeholder="Nombre del curso"
              value={form.course}
              onChange={e => setForm({
                ...form,
                course: e.target.value
              })}
            />
          </div>

          <div>
            <label htmlFor="enrollment-date">
              Fecha de matrícula
            </label>
            <input
              id="enrollment-date"
              type="date"
              required
              value={form.date}
              onChange={e => setForm({
                ...form,
                date: e.target.value
              })}
            />
          </div>

          <div>
            <label htmlFor="enrollment-status">
              Estado
            </label>
            <select
              id="enrollment-status"
              value={form.status}
              onChange={e => setForm({
                ...form,
                status: e.target.value
              })}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Confirmada">Confirmada</option>
            </select>
          </div>

          <button type="submit" disabled={saving}>
            {saving
              ? 'Guardando...'
              : editingId !== null
                ? 'Actualizar matrícula'
                : 'Registrar matrícula'}
          </button>

          {editingId !== null && (
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm());
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
        <h2>Matrículas registradas en PostgreSQL</h2>

        <input
          type="search"
          aria-label="Buscar matrículas"
          placeholder="Buscar matrícula..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 20 }}
        />

        {loading ? (
          <p>Cargando matrículas...</p>
        ) : filtered.length === 0 ? (
          <p>No se encontraron matrículas.</p>
        ) : (
          <ul>
            {filtered.map(item => (
              <li key={item.id}>
                <strong>{item.student}</strong>
                <p>Curso: {item.course}</p>
                <p>Fecha: {String(item.date).slice(0, 10)}</p>
                <p>Estado: {item.status}</p>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleEdit(item)}
                >
                  Editar
                </button>
                {' '}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleDelete(item)}
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
