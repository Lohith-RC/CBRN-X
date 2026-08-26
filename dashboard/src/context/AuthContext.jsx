import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch, ensureCsrfToken } from '../utils/api';

const AuthContext = createContext(null);

// Offline demo login is disabled by default. Set VITE_ENABLE_OFFLINE_LOGIN=true
// in .env (or shell) to allow signing in without a reachable backend.
const OFFLINE_LOGIN_ENABLED = String(import.meta.env.VITE_ENABLE_OFFLINE_LOGIN).toLowerCase() === 'true';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const offlineUser = (username) => ({
    username: username.trim() || 'admin',
    role: 'ROLE_ADMIN',
    displayName: `Offline Instructor (${username.trim() || 'admin'})`,
    offline: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setUser(data);
        }
      } catch {
        // Backend unreachable — stay logged out; dashboard surfaces the outage itself
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username, password) => {
    setSubmitting(true);
    setError(null);
    try {
      await ensureCsrfToken();
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (!OFFLINE_LOGIN_ENABLED) {
          setError(res.status === 401 ? 'Invalid username or password.' : `Login failed (backend status ${res.status}). Is the backend running?`);
          return false;
        }
        console.warn(`Backend login status ${res.status}, using offline instructor mode.`);
        setUser(offlineUser(username));
        return true;
      }
      setUser(body);
      return true;
    } catch (err) {
      if (!OFFLINE_LOGIN_ENABLED) {
        console.warn('Login failed:', err.message);
        setError('Cannot reach the CBRS-X backend. Start it with SOP-02 or enable VITE_ENABLE_OFFLINE_LOGIN for demo mode.');
        return false;
      }
      console.warn('Backend offline, defaulting to local instructor session:', err.message);
      setUser(offlineUser(username));
      return true;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Clear local state regardless
    }
    document.cookie = 'CBRSX-XSRF=; Max-Age=0; path=/';
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, booting, error, submitting, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
