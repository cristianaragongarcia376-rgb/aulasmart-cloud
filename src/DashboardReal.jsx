
import { useEffect, useState } from 'react';
import { getResources } from './api.js';

export default function DashboardReal({ token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const [
          students,
          teachers,
          courses,
          enrollments,
          payments,
        ] = await Promise.all([
          getResources('students', token),
          getResources('teachers', token),
          getResources('courses', token),
          getResources('enrollments', token),
          getResources('payments', token),
        ]);

        if (active) {
          setData({
            students,
            teachers,
            courses,
            enrollments,
            payments,
          });
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [token]);

  if (loading) {
    return <section><p>Cargando estadísticas...</p></section>;
  }

  if (error || !data) {
    return (
      <section role="alert">
        <h2>No se pudieron cargar las estadísticas</h2>
        <p>{error}</p>
      </section>
    );
  }

  const confirmed = data.enrollments.filter(
    item => item.status === 'Confirmada'
  ).length;

  const paid = data.payments.filter(
    item => item.status === 'Pagado'
  );

  const totalPaid = paid.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const money = amount =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 2,
    }).format(amount);

  const stats = [
    ['🎓', 'Estudiantes registrados', data.students.length],
    ['👩‍🏫', 'Docentes registrados', data.teachers.length],
    ['📚', 'Cursos registrados', data.courses.length],
    ['📋', 'Matrículas confirmadas', confirmed],
    ['💳', 'Pagos registrados', data.payments.length],
    ['💰', 'Ingresos marcados como pagados', money(totalPaid)],
  ];

  return (
    <>
      <section>
        <h1>Panel principal</h1>
        <p>
          Resumen académico y financiero de tu institución.
        </p>

        <div className="real-stats">
          {stats.map(([icon, label, value]) => (
            <div className="real-stat-card" key={label}>
              <h3>{icon} {label}</h3>
              <strong>{value}</strong>
              <p>Datos consultados desde PostgreSQL</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
