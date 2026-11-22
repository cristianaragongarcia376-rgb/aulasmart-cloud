
import { useEffect, useState } from 'react';
import {
  getPayments,
  createPayment,
  updatePayment,
  deletePayment
} from './api.js';

const emptyForm = () => ({
  student: '',
  concept: '',
  amount: '',
  date: new Date().toLocaleDateString('en-CA'),
  status: 'Pendiente'
});

export default function Pagos({ token }) {
  const [payments, setPayments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;

    async function loadPayments() {
      try {
        const data = await getPayments(token);
        if (active) setPayments(data);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPayments();

    return () => { active = false; };
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    const amount = Number(form.amount);

    if (
      form.amount.trim() === '' ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      !/^\d+(\.\d{1,2})?$/.test(form.amount.trim())
    ) {
      setError('Introduce un valor válido, con máximo dos decimales.');
      return;
    }

    const data = {
      student: form.student.trim(),
      concept: form.concept.trim(),
      amount,
      date: form.date,
      status: form.status
    };

    if (!data.student || !data.concept || !data.date) {
      setError('Completa todos los campos.');
      return;
    }

    setSaving(true);

    try {
      if (editingId !== null) {
        await updatePayment(editingId, data, token);
      } else {
        await createPayment(data, token);
      }

      setPayments(await getPayments(token));
      setForm(emptyForm());
      setEditingId(null);
      setMessage('Pago guardado correctamente.');
    } catch (err) {
      setError(err.message || 'No se pudo guardar el pago.');
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(payment) {
    setEditingId(payment.id);
    setForm({
      student: payment.student,
      concept: payment.concept,
      amount: String(payment.amount),
      date: String(payment.date).slice(0, 10),
      status: payment.status
    });
    setError('');
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(payment) {
    const confirmed = window.confirm(
      `¿Eliminar el registro de pago de ${payment.student}?`
    );

    if (!confirmed) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await deletePayment(payment.id, token);
      setPayments(await getPayments(token));

      if (editingId === payment.id) {
        setEditingId(null);
        setForm(emptyForm());
      }

      setMessage('Registro eliminado correctamente.');
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el pago.');
    } finally {
      setSaving(false);
    }
  }

  const filtered = payments.filter(payment =>
    [payment.student, payment.concept, payment.status]
      .some(value => String(value ?? '')
        .toLowerCase()
        .includes(search.toLowerCase()))
  );

  const totalPaid = payments
    .filter(p => p.status === 'Pagado')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const money = amount =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2
    }).format(amount);

  return (
    <>
      <section>
        <h2>
          {editingId !== null
            ? 'Editar registro de pago'
            : 'Registrar nuevo pago'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="payment-student">Estudiante</label>
            <input
              id="payment-student"
              required
              value={form.student}
              onChange={e => setForm({
                ...form, student: e.target.value
              })}
            />
          </div>

          <div>
            <label htmlFor="payment-concept">Concepto</label>
            <input
              id="payment-concept"
              required
              placeholder="Ejemplo: Mensualidad"
              value={form.concept}
              onChange={e => setForm({
                ...form, concept: e.target.value
              })}
            />
          </div>

          <div>
            <label htmlFor="payment-amount">Valor (COP)</label>
            <input
              id="payment-amount"
              type="number"
              min="0"
              step="0.01"
              required
              value={form.amount}
              onChange={e => setForm({
                ...form, amount: e.target.value
              })}
            />
          </div>

          <div>
            <label htmlFor="payment-date">Fecha</label>
            <input
              id="payment-date"
              type="date"
              required
              value={form.date}
              onChange={e => setForm({
                ...form, date: e.target.value
              })}
            />
          </div>

          <div>
            <label htmlFor="payment-status">Estado</label>
            <select
              id="payment-status"
              value={form.status}
              onChange={e => setForm({
                ...form, status: e.target.value
              })}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Pagado">Pagado</option>
            </select>
          </div>

          <button type="submit" disabled={saving}>
            {saving
              ? 'Guardando...'
              : editingId !== null
                ? 'Actualizar pago'
                : 'Registrar pago'}
          </button>

          {editingId !== null && (
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm());
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
        <h2>Resumen de pagos</h2>
        <div className="real-stats">
          <div className="real-stat-card">
            <h3>Ingresos registrados como pagados</h3>
            <strong style={{ fontSize: 26 }}>
              {money(totalPaid)}
            </strong>
          </div>

          <div className="real-stat-card">
            <h3>Pagos pendientes</h3>
            <strong>
              {payments.filter(
                p => p.status === 'Pendiente'
              ).length}
            </strong>
          </div>
        </div>
      </section>

      <section>
        <h2>Pagos registrados en PostgreSQL</h2>

        <input
          type="search"
          aria-label="Buscar pagos"
          placeholder="Buscar estudiante, concepto o estado"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 20 }}
        />

        {loading ? (
          <p>Cargando pagos...</p>
        ) : filtered.length === 0 ? (
          <p>No se encontraron pagos.</p>
        ) : (
          <ul>
            {filtered.map(payment => (
              <li key={payment.id}>
                <strong>{payment.student}</strong>
                <p>Concepto: {payment.concept}</p>
                <p>Valor: {money(Number(payment.amount))}</p>
                <p>
                  Fecha: {String(payment.date).slice(0, 10)}
                </p>
                <p>Estado: {payment.status}</p>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleEdit(payment)}
                >
                  Editar
                </button>
                {' '}
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleDelete(payment)}
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
