import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { API_BASE_URL } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
import { ChangePasswordModal } from './ChangePasswordModal';

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => toastSuccess(msg),
    error: (msg: string) => toastError(msg),
  },
  Toaster: (): null => null,
}));

describe('ChangePasswordModal', () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    toastError.mockReset();
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAccessToken('mock-admin-token');
  });
  afterEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('rejects mismatched new + confirm passwords without calling the API', async () => {
    let apiCalled = false;
    server.use(
      http.patch(`${API_BASE_URL}/auth/change-password`, () => {
        apiCalled = true;
        return HttpResponse.json({ message: 'ok' });
      }),
    );

    render(<ChangePasswordModal open onOpenChange={vi.fn()} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/mật khẩu hiện tại/i), 'admin123');
    await user.type(screen.getByLabelText(/^mật khẩu mới/i), 'longEnough1');
    await user.type(screen.getByLabelText(/xác nhận mật khẩu mới/i), 'differentOne');
    await user.click(screen.getByRole('button', { name: /cập nhật/i }));

    expect(await screen.findByText(/không khớp/i)).toBeInTheDocument();
    expect(apiCalled).toBe(false);
  });

  it('rejects too-short new password before calling API', async () => {
    let apiCalled = false;
    server.use(
      http.patch(`${API_BASE_URL}/auth/change-password`, () => {
        apiCalled = true;
        return HttpResponse.json({ message: 'ok' });
      }),
    );

    render(<ChangePasswordModal open onOpenChange={vi.fn()} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/mật khẩu hiện tại/i), 'admin123');
    await user.type(screen.getByLabelText(/^mật khẩu mới/i), 'short');
    await user.type(screen.getByLabelText(/xác nhận mật khẩu mới/i), 'short');
    await user.click(screen.getByRole('button', { name: /cập nhật/i }));

    expect(await screen.findByText(/tối thiểu 8/i)).toBeInTheDocument();
    expect(apiCalled).toBe(false);
  });

  it('on success: shows toast and closes the modal', async () => {
    const onOpenChange = vi.fn();
    render(<ChangePasswordModal open onOpenChange={onOpenChange} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/mật khẩu hiện tại/i), 'admin123');
    await user.type(screen.getByLabelText(/^mật khẩu mới/i), 'newSecret9');
    await user.type(screen.getByLabelText(/xác nhận mật khẩu mới/i), 'newSecret9');
    await user.click(screen.getByRole('button', { name: /cập nhật/i }));

    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('on 400 (sai mật khẩu cũ): shows inline error under matKhauCu', async () => {
    server.use(
      http.patch(`${API_BASE_URL}/auth/change-password`, () =>
        HttpResponse.json(
          { statusCode: 400, message: 'Mật khẩu cũ không chính xác' },
          { status: 400 },
        ),
      ),
    );

    render(<ChangePasswordModal open onOpenChange={vi.fn()} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/mật khẩu hiện tại/i), 'wrongOldPw');
    await user.type(screen.getByLabelText(/^mật khẩu mới/i), 'newSecret9');
    await user.type(screen.getByLabelText(/xác nhận mật khẩu mới/i), 'newSecret9');
    await user.click(screen.getByRole('button', { name: /cập nhật/i }));

    expect(await screen.findByText(/mật khẩu cũ không chính xác/i)).toBeInTheDocument();
  });
});
