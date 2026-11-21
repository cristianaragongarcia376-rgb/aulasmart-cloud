import { useState } from 'react';
import { login } from './api.js';

export default function Login({ onSuccess, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email.trim(), password);
      if (!result?.token) {
        throw new Error('El servidor no devolvió un token');
      }
      onSuccess(result);
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: 24,
      background: '#f1f5ff'
    }}>
      <form onSubmit={handleSubmit} style={{
        width: '100%',
        maxWidth: 420,
        padding: 32,
        background: '#fff',
        borderRadius: 18,
        boxShadow: '0 15px 40px #14245a18'
      }}>
        <h1 style={{ color: '#172554' }}>
          AulaSmart Cloud
        </h1>

        <p>Inicia sesión para acceder a tu institución.</p>

        <label htmlFor="login-email">Correo electrónico</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="username"
        />

        <label htmlFor="login-password">Contraseña</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        {error && <p role="alert" style={{ color: '#dc2626' }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Ingresando...' : 'Iniciar sesión'}
        </button>

        <button type="button" onClick={onBack}>
          Volver
        </button>
      </form>
    </main>
  );
}