import { useEffect, useState } from 'react';
import { getResources, createStudent  } from './api.js';

export default function PanelReal({ auth, onLogout }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
  name: '',
  email: '',
  grade: '',
  status: 'Activo',
});

const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadStudents() {
      try {
        const data = await getResources('students', auth.token);
        if (active) setStudents(data);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStudents();

    return () => {
      active = false;
    };
  }, [auth.token]);

    // Registrar un estudiante en PostgreSQL
  async function handleCreateStudent(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await createStudent(form, auth.token);

      const updatedStudents = await getResources(
        'students',
        auth.token
      );

      setStudents(updatedStudents);

      setForm({
        name: '',
        email: '',
        grade: '',
        status: 'Activo',
      });
    } catch (err) {
      setError(err.message || 'No se pudo registrar el estudiante');
    } finally {
      setSaving(false);
    }
  }
  
  return (
    <main style={{ padding: 32 }}>
      <h1>Panel académico — AulaSmart Cloud</h1>
      <p>
  Administrador: {auth.user?.name || auth.user?.email || 'Usuario autenticado'}
</p>

      <button type="button" onClick={onLogout}>
        Cerrar sesión
      </button>
<section style={{ marginTop: 30, marginBottom: 30 }}>
  <h2>Registrar nuevo estudiante</h2>

  <form onSubmit={handleCreateStudent}>
    <div>
      <label>Nombre completo</label>
      <input
        type="text"
        required
        value={form.name}
        onChange={(e) =>
          setForm({ ...form, name: e.target.value })
        }
      />
    </div>

    <div>
      <label>Correo electrónico</label>
      <input
        type="email"
        required
        value={form.email}
        onChange={(e) =>
          setForm({ ...form, email: e.target.value })
        }
      />
    </div>

    <div>
      <label>Grado</label>
      <input
        type="text"
        required
        placeholder="Ejemplo: 10° A"
        value={form.grade}
        onChange={(e) =>
          setForm({ ...form, grade: e.target.value })
        }
      />
    </div>

    <div>
      <label>Estado</label>
      <select
        value={form.status}
        onChange={(e) =>
          setForm({ ...form, status: e.target.value })
        }
      >
        <option value="Activo">Activo</option>
        <option value="Pendiente">Pendiente</option>
      </select>
    </div>

    <button type="submit" disabled={saving}>
      {saving ? 'Guardando...' : 'Registrar estudiante'}
    </button>
  </form>
</section>

      <h2>Estudiantes registrados en PostgreSQL</h2>

      {loading && <p>Cargando estudiantes...</p>}
      {error && <p role="alert">Error: {error}</p>}

      {!loading && !error && (
        students.length === 0
          ? <p>No hay estudiantes registrados todavía.</p>
          : (
            <ul>
              {students.map(student => (
                <li key={student.id}>
                  {student.name} — {student.email}
                </li>
              ))}
            </ul>
          )
      )}
    </main>
  );
}