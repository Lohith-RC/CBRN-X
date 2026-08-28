import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Login from '../components/Login';
import * as AuthContextModule from '../context/AuthContext';

describe('Login Component', () => {
  it('renders login form correctly', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      loading: false,
      submitting: false,
      error: null,
      login: vi.fn().mockResolvedValue(true),
    });

    render(<Login />);

    expect(screen.getByRole('heading', { name: /CBRS-X Command Access/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Authenticate/i })).toBeInTheDocument();
  });

  it('submits credentials when form is filled and submitted', async () => {
    const loginMock = vi.fn().mockResolvedValue(true);
    const onSuccessMock = vi.fn();

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      loading: false,
      submitting: false,
      error: null,
      login: loginMock,
    });

    render(<Login onSuccess={onSuccessMock} />);

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'ndrf-admin-123' } });
    fireEvent.click(screen.getByRole('button', { name: /^Authenticate$/i }));

    expect(loginMock).toHaveBeenCalledWith('admin', 'ndrf-admin-123');
  });

  it('displays alert error message when error state exists', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      loading: false,
      submitting: false,
      error: 'Invalid username or password',
      login: vi.fn(),
    });

    render(<Login />);

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid username or password');
  });
});
