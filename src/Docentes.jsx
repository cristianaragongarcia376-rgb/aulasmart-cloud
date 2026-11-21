
import { useEffect, useState } from 'react';
import {
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} from './api.js';

const initialForm = {
  name: '',
  email: '',
  subject: '',
  status: 'Activo',
};

export default function Docentes({ token }) {
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ ...initialForm });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function loadTeachers() {
      try {
        const data = await getTeachers(token);
        if (active) setTeachers(data);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTeachers();

    return () => {
      active = false;
    };
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (editingId !== null) {
        await updateTeacher(editingId, form, token);
        setMessage('Docente actualizado correctamente.');
      } else {
        await createTeacher(form, token);
        setMessage('Docente registrado correctamente.');
      }

      const updated = await getTeachers(token);
      setTeachers(updated);
      setForm({ ...initialForm });
      setEditingId(null);
    } catch (err) {
      setError(err.message || 'No se pudo guardar el docente.');
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(teacher) {
    setEditingId(teacher.id);
    setForm({
      name: teacher.name,
      email: teacher.email,
      subject: teacher.subject,
      status: teacher.status,
    });
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(teacher) {
    if (!window.confirm(
      `¿Eliminar al docente ${teacher.name}? Esta acción no se puede deshacer.`
    )) return;

    setError('');
    setMessage('');

    try {
      await deleteTeacher(teacher.id, token);
      const updated = await getTeachers(token);
      setTeachers(updated);
      if (editingId === teacher.id) {
        setEditingId(null);
        setForm({ ...initialForm });
      }
      setMessage('Docente eliminado correctamente.');
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el docente.');
    }
  }

  return (
    <>
      <section>
        <h2>{editingId !== null ? 'Editar docente' : 'Registrar nuevo docente'}</h2>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="teacher-name">Nombre completo</label>
            <input
              id="teacher-name"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="teacher-email">Correo electrónico</label>
            <input
              id="teacher-email"
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="teacher-subject">Asignatura</label>
            <input
              id="teacher-subject"
              required
              placeholder="Ejemplo: Matemáticas"
              value={form.subject}
              onChange={e => setForm({ ...form, subject: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="teacher-status">Estado</label>
            <select
              id="teacher-status"
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
            >
              <option value="Activo">Activo</option>
              <option value="Pendiente">Pendiente</option>
            </select>
          </div>

          <button type="submit" disabled={saving}>
            {saving
              ? 'Guardando...'
              : editingId !== null
                ? 'Actualizar docente'
                : 'Registrar docente'}
          </button>

          {editingId !== null && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ ...initialForm });
              }}
            >
              Cancelar edición
            </button>
          )}
        </form>
      </section>

      {error && <p role="alert" style={{ color: '#dc2626' }}>{error}</p>}
      {message && <p role="status" style={{ color: '#15803d' }}>{message}</p>}

      <section>
        <h2>Docentes registrados en PostgreSQL</h2>

        {loading ? (
          <p>Cargando docentes...</p>
        ) : teachers.length === 0 ? (
          <p>No hay docentes registrados todavía.</p>
        ) : (
          <ul>
            {teachers.map(teacher => (
              <li key={teacher.id}>
                <strong>{teacher.name}</strong> — {teacher.email}
                <p>{teacher.subject} · {teacher.status}</p>

                <button type="button" onClick={() => handleEdit(teacher)}>
                  Editar
                </button>
                {' '}
                <button type="button" onClick={() => handleDelete(teacher)}>
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
