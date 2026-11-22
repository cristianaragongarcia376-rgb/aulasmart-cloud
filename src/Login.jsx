
import { useState } from 'react';
import { login } from './api.js';
import LoginView from './LoginView.jsx';

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
    <LoginView
      email={email}
      password={password}
      setEmail={setEmail}
      setPassword={setPassword}
      onSubmit={handleSubmit}
      onBack={onBack}
      error={error}
      loading={loading}
    />
  );
}
