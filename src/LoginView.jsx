
import { useState } from 'react';
import './Login.css';

export default function LoginView({
  email,
  password,
  setEmail,
  setPassword,
  onSubmit,
  onBack,
  error,
  loading = false
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="login-page">
      <section className="login-card">

        <div className="login-brand">
          <div className="login-logo">🎓</div>
          <div>
            <h2>
              AulaSmart<span>Cloud</span>
            </h2>
            <p>EDUCATION PLATFORM</p>
          </div>
        </div>

        <h1 className="login-title">
          ¡Bienvenido de nuevo!
        </h1>

        <p className="login-subtitle">
          Inicia sesión para administrar tu institución
          educativa de forma fácil y segura.
        </p>

        <form className="login-form" onSubmit={onSubmit}>
          <div className="login-field">
            <label htmlFor="login-email">
              Correo electrónico
            </label>

            <div className="login-input-wrap">
              <span>✉</span>
              <input
                id="login-email"
                type="email"
                placeholder="nombre@institucion.edu"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="login-password">
              Contraseña
            </label>

            <div className="login-input-wrap">
              <span>🔒</span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Introduce tu contraseña"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                className="login-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'
                }
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión →'}
          </button>
        </form>

        {onBack && (
          <button
            type="button"
            className="login-back"
            onClick={onBack}
          >
            ← Volver al inicio
          </button>
        )}

        <p className="login-footer">
          🔒 Acceso seguro · AulaSmart Cloud © 2026
        </p>
      </section>
    </main>
  );
}
