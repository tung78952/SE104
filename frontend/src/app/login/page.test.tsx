import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { API_BASE_URL } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
import LoginPage from './page';

const replaceMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: (): { replace: (path: string) => void; push: (path: string) => void } => ({
    replace: replaceMock,
    push: replaceMock,
  }),
}));

const toastErrorMock = vi.fn();
const toastSuccessMock = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => toastSuccessMock(msg),
    error: (msg: string) => toastErrorMock(msg),
  },
  Toaster: (): null => null,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    toastErrorMock.mockReset();
    toastSuccessMock.mockReset();
    useAuthStore.getState().clearAuth();
  });
  afterEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('renders form fields and login button', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/tên đăng nhập/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /đăng nhập/i })).toBeInTheDocument();
  });

  it('shows validation errors when fields are empty', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.click(screen.getByRole('button', { name: /đăng nhập/i }));
    expect(await screen.findByText(/vui lòng nhập tên đăng nhập/i)).toBeInTheDocument();
    expect(await screen.findByText(/vui lòng nhập mật khẩu/i)).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('on success: saves token, hydrates user, and navigates to /dashboard', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/tên đăng nhập/i), 'admin');
    await user.type(screen.getByLabelText(/mật khẩu/i), 'admin123');
    await user.click(screen.getByRole('button', { name: /đăng nhập/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBe('mock-admin-token');
    });
    await waitFor(() => {
      expect(useAuthStore.getState().user?.tenDangNhap).toBe('admin');
    });
    expect(replaceMock).toHaveBeenCalledWith('/dashboard');
    expect(toastSuccessMock).toHaveBeenCalled();
  });

  it('on 401: shows error toast, does not navigate, clears auth', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/signin`, () =>
        HttpResponse.json({ statusCode: 401, message: 'Sai mật khẩu' }, { status: 401 }),
      ),
    );

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/tên đăng nhập/i), 'admin');
    await user.type(screen.getByLabelText(/mật khẩu/i), 'wrongpw');
    await user.click(screen.getByRole('button', { name: /đăng nhập/i }));

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalled());
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(replaceMock).not.toHaveBeenCalledWith('/dashboard');
  });

  it('redirects to /dashboard if already authenticated', async () => {
    useAuthStore.getState().setAccessToken('existing-token');
    render(<LoginPage />);
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/dashboard');
    });
  });
});
