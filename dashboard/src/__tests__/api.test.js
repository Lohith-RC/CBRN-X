import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCookie, ensureCsrfToken, apiFetch } from '../utils/api';

describe('API Utility Functions', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
    vi.restoreAllMocks();
  });

  it('getCookie parses cookies correctly', () => {
    document.cookie = 'CBRSX-XSRF=token-12345';
    expect(getCookie('CBRSX-XSRF')).toBe('token-12345');
    expect(getCookie('NON_EXISTENT')).toBeNull();
  });

  it('ensureCsrfToken fetches token if not set in cookie', async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      document.cookie = 'CBRSX-XSRF=fetched-csrf-token';
      return Promise.resolve({ ok: true });
    });

    const token = await ensureCsrfToken();
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/csrf', { credentials: 'same-origin' });
    expect(token).toBe('fetched-csrf-token');
  });

  it('apiFetch adds X-XSRF-TOKEN header for POST requests', async () => {
    document.cookie = 'CBRSX-XSRF=valid-csrf-token';
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });

    await apiFetch('/api/sessions', { method: 'POST', body: JSON.stringify({ name: 'Test' }) });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/sessions',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
        headers: expect.objectContaining({
          'X-XSRF-TOKEN': 'valid-csrf-token',
        }),
      })
    );
  });
});
