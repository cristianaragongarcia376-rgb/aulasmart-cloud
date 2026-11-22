
import { useEffect, useState } from 'react';
import { getResources } from './api.js';

const resources = [
  ['students', 'Estudiantes'],
  ['teachers', 'Docentes'],
  ['courses', 'Cursos'],
  ['enrollments', 'Matrículas'],
  ['payments', 'Pagos'],
];

const money = value =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
  }).format(value);

// Prepara los valores para un archivo CSV seguro
function csvCell(value) {
  let text = String(value ?? '');

  // Evitar que hojas de cálculo ejecuten fórmulas
  if (/^[\s]*[=+\-@]/.test(text)) {
    text = "'" + text;
  }

  return '"' + text.replace(/"/g, '""') + '"';
}

export default function Reportes({ token }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadReports() {
      setLoading(true);
      setErrors({});

      const results = await Promise.allSettled(
        resources.map(([resource]) =>
          getResources(resource, token)
        )
      );

      if (!active) return;

      const nextData = {};
      const nextErrors = {};

      results.forEach((result, index) => {
        const [resource] = resources[index];

        if (
          result.status === 'fulfilled' &&
          Array.isArray(result.value)
        ) {
          nextData[resource] = result.value;
        } else {
          nextErrors[resource] =
            result.status === 'rejected'
              ? result.reason?.message || 'Error de consulta'
              : 'La respuesta no es una lista';
        }
      });

      setData(nextData);
      setErrors(nextErrors);
      setLoading(false);
    }

    loadReports();

    return () => {
      active = false;
    };
  }, [token, refresh]);

  const students = data.students || [];
  const teachers = data.teachers || [];
  const courses = data.courses || [];
  const enrollments = data.enrollments || [];
  const payments = data.payments || [];

  const confirmed = enrollments.filter(
    item => item.status === 'Confirmada'
  ).length;

  const paid = payments.filter(
    item => item.status === 'Pagado'
  );

  const pending = payments.filter(
    item => item.status === 'Pendiente'
  );

  const paidAmount = paid.reduce(
    (total, item) => total + Number(item.amount || 0),
    0
  );

  const pendingAmount = pending.reduce(
    (total, item) => total + Number(item.amount || 0),
    0
  );

  const stats = [
    {
      label: 'Estudiantes registrados',
      resource: 'students',
      value: students.length,
      icon: '🎓'
    },
    {
      label: 'Docentes registrados',
      resource: 'teachers',
      value: teachers.length,
      icon: '👩‍🏫'
    },
    {
      label: 'Cursos registrados',
      resource: 'courses',
      value: courses.length,
      icon: '📚'
    },
    {
      label: 'Matrículas confirmadas',
      resource: 'enrollments',
      value: confirmed,
      icon: '📋'
    },
    {
      label: 'Ingresos marcados como pagados',
      resource: 'payments',
      value: money(paidAmount),
      icon: '💰'
    },
    {
      label: 'Pagos pendientes',
      resource: 'payments',
      value: pending.length,
      icon: '💳'
    },
  ];

  const csvFields = {
    students: ['name', 'email', 'grade', 'status'],
    teachers: ['name', 'email', 'subject', 'status'],
    courses: [
      'name', 'code', 'teacher', 'grade',
      'capacity', 'students', 'status'
    ],
    enrollments: ['student', 'course', 'date', 'status'],
    payments: [
      'student', 'concept', 'amount', 'date', 'status'
    ],
  };

  function downloadCSV(resource) {
    if (!Array.isArray(data[resource])) return;

    const fields = csvFields[resource];
    const rows = data[resource];

    const csv = [
      fields.map(csvCell).join(','),
      ...rows.map(item =>
        fields.map(field => csvCell(item[field])).join(',')
      ),
    ].join('\r\n');

    const blob = new Blob(
      ['\uFEFF' + csv],
      { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `aulasmart-${resource}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <section>
        <h2>📊 Reportes y estadísticas</h2>
        <p>
          Información académica y financiera registrada
          en PostgreSQL.
        </p>

        <button
          type="button"
          disabled={loading}
          onClick={() => setRefresh(value => value + 1)}
        >
          Actualizar estadísticas
        </button>
      </section>

      {loading && <p>Cargando estadísticas...</p>}

      {!loading && Object.keys(errors).length > 0 && (
        <section role="alert">
          <h3>Algunas consultas fallaron</h3>
          {Object.entries(errors).map(([key, value]) => (
            <p key={key}>
              {key}: {value}
            </p>
          ))}
        </section>
      )}

      {!loading && (
        <>
          <section>
            <h2>Resumen general</h2>

            <div className="real-stats">
              {stats.map(stat => (
                <div className="real-stat-card" key={stat.label}>
                  <h3>{stat.icon} {stat.label}</h3>
                  <strong style={{ fontSize: 26 }}>
                    {errors[stat.resource]
                      ? 'No disponible'
                      : stat.value}
                  </strong>
                  <p>Información del backend AWS</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2>Resumen financiero</h2>

            {errors.payments ? (
              <p>No se pudieron consultar los pagos.</p>
            ) : (
              <>
                <p>
                  <strong>Ingresos registrados como pagados:</strong>
                  {' '}{money(paidAmount)}
                </p>
                <p>
                  <strong>Valor pendiente:</strong>
                  {' '}{money(pendingAmount)}
                </p>
                <p>
                  <strong>Registros pagados:</strong>
                  {' '}{paid.length}
                </p>
              </>
            )}
          </section>

          <section>
            <h2>Descargar reportes CSV</h2>
            <p>
              Exporta los registros de cada módulo para
              analizarlos en Excel.
            </p>

            <div className="report-actions">
              {resources.map(([resource, label]) => (
                <button
                  type="button"
                  key={resource}
                  disabled={!Array.isArray(data[resource])}
                  onClick={() => downloadCSV(resource)}
                >
                  Descargar {label}
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
