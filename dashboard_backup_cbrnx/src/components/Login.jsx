import React, { useState } from 'react';
import { ShieldCheck, Lock, User as UserIcon, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, error, submitting } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    await login(username, password);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        padding: '24px',
      }}
    >
      <div className="glass-card-deep" style={{ width: '100%', maxWidth: '420px', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '1px solid rgba(245, 130, 32, 0.4)',
              boxShadow: '0 0 24px rgba(245, 130, 32, 0.2)',
              marginBottom: '16px',
            }}
          >
            <ShieldCheck size={30} color="var(--accent-ndrf-orange)" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff', letterSpacing: '0.02em' }}>
            CBRS-X Command Access
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            National Disaster Response Force — Instructor Authentication
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="login-username" style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Username
          </label>
          <div style={{ position: 'relative', marginBottom: '18px' }}>
            <UserIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '11px 14px 11px 38px',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <label htmlFor="login-password" style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Password
          </label>
          <div style={{ position: 'relative', marginBottom: '18px' }}>
            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '11px 14px 11px 38px',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '0.82rem',
                color: '#fca5a5',
                marginBottom: '18px',
              }}
            >
              <AlertTriangle size={15} />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || !username.trim() || !password}
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
          >
            {submitting ? 'Authenticating…' : 'Authenticate'}
          </button>
        </form>

        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '22px', lineHeight: 1.5 }}>
          Authorized personnel only. All access attempts are logged and audited.
        </p>
      </div>
    </div>
  );
}
