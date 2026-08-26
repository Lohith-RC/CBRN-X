import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../Login.jsx';

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    login: vi.fn(),
    error: null,
    submitting: false,
  }),
}));

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    render(<Login />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /authenticate/i })).toBeInTheDocument();
  });

  it('displays title and subtitle', () => {
    render(<Login />);
    expect(screen.getByText('CBRS-X Command Access')).toBeInTheDocument();
    expect(screen.getByText(/National Disaster Response Force/i)).toBeInTheDocument();
  });

  it('submit button is disabled when fields are empty', () => {
    render(<Login />);
    const button = screen.getByRole('button', { name: /authenticate/i });
    expect(button).toBeDisabled();
  });

  it('does not show credentials in production mode', () => {
    vi.stubEnv('DEV', false);
    render(<Login />);
    expect(screen.queryByText(/ndrf-admin-123/)).not.toBeInTheDocument();
    vi.unstubAllEnvs();
  });

  it('allows typing in username and password fields', () => {
    render(<Login />);
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(usernameInput.value).toBe('admin');
    expect(passwordInput.value).toBe('password123');
  });

  it('displays authorized personnel notice', () => {
    render(<Login />);
    expect(screen.getByText(/Authorized personnel only/i)).toBeInTheDocument();
  });
});
