import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/store';
import { setMockUser } from '@/mocks/handlers';
import AdminUsersPage from './page';
import type { TaiKhoan } from '@/types/models';

const replaceMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  usePathname: () => '/admin/users',
  useParams: () => ({}),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  Toaster: () => null,
}));

const ADMIN_USER: TaiKhoan = {
  maTK: 1,
  tenDangNhap: 'admin',
  vaiTro: 'admin',
  trangThai: 1,
  maGV: null,
  giangVien: null,
};

const GV_USER: TaiKhoan = {
  maTK: 2,
  tenDangNhap: 'gv_thien',
  vaiTro: 'giaovien',
  trangThai: 1,
  maGV: 'GV01',
  giangVien: null,
};

function renderWithQuery(node: React.ReactElement): void {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={qc}>{node}</QueryClientProvider>);
}

describe('AdminUsersPage', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    useAuthStore.getState().clearAuth();
  });
  afterEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('admin sees user list and Thêm tài khoản', async () => {
    useAuthStore.getState().setAuth('mock-admin-token', ADMIN_USER);
    setMockUser('admin');
    renderWithQuery(<AdminUsersPage />);
    await waitFor(() => screen.getByText('gv_thien'));
    expect(screen.getByRole('button', { name: /thêm tài khoản/i })).toBeInTheDocument();
    expect(screen.getByText('gv_hoa')).toBeInTheDocument();
  });

  it('giaovien is redirected to /403 by RoleGuard', async () => {
    useAuthStore.getState().setAuth('mock-gv-token', GV_USER);
    setMockUser('giaovien');
    renderWithQuery(<AdminUsersPage />);
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/403');
    });
  });

  it('admin can open edit modal pre-filled', async () => {
    useAuthStore.getState().setAuth('mock-admin-token', ADMIN_USER);
    setMockUser('admin');
    renderWithQuery(<AdminUsersPage />);
    await waitFor(() => screen.getByText('gv_thien'));
    const user = userEvent.setup();
    const editButtons = screen.getAllByRole('button', { name: 'Sửa' });
    await user.click(editButtons[0]);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/sửa tài khoản/i)).toBeInTheDocument();
  });

  it('admin Khoá/Mở button toggles trangThai', async () => {
    useAuthStore.getState().setAuth('mock-admin-token', ADMIN_USER);
    setMockUser('admin');
    renderWithQuery(<AdminUsersPage />);
    await waitFor(() => screen.getByText('gv_thien'));
    const user = userEvent.setup();
    // gv_hoa user starts as locked (trangThai=0) → show "Mở" button
    const moButtons = screen.queryAllByRole('button', { name: /mở khoá tài khoản/i });
    expect(moButtons.length).toBeGreaterThan(0);
    await user.click(moButtons[0]);
    // After toggle, expect a "Khoá" button to appear somewhere on that user row
    await waitFor(() => {
      expect(screen.queryAllByRole('button', { name: /^khoá tài khoản$/i }).length).toBeGreaterThan(
        0,
      );
    });
  });
});
