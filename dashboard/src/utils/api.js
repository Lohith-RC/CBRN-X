const CSRF_COOKIE = 'CBRSX-XSRF';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function getCookie(name) {
  const prefix = `${name}=`;
  const match = document.cookie.split('; ').find((row) => row.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

export async function ensureCsrfToken() {
  let token = getCookie(CSRF_COOKIE);
  if (!token) {
    await fetch('/api/auth/csrf', { credentials: 'same-origin' });
    token = getCookie(CSRF_COOKIE);
  }
  return token;
}

export async function apiFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...(options.headers || {}) };

  if (MUTATING_METHODS.has(method)) {
    const token = await ensureCsrfToken();
    if (token) headers['X-XSRF-TOKEN'] = token;
  }

  return fetch(url, { ...options, headers, credentials: 'same-origin' });
}
