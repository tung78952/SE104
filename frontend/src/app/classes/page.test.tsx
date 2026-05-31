import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/store';
import { setMockUser } from '@/mocks/handlers';
import ClassesPage from './page';
import type { TaiKhoan } from '@/types/models';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/classes',
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

describe('ClassesPage', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAuth('mock-admin-token', ADMIN_USER);
    setMockUser('admin');
  });
  afterEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('lists classes for admin and shows Thêm button', async () => {
    renderWithQuery(<ClassesPage />);
    await waitFor(() => screen.getByText('CS01'));
    expect(screen.getByRole('button', { name: /thêm lớp/i })).toBeInTheDocument();
  });

  it('giaovien sees no Thêm/Sửa/Xoá', async () => {
    useAuthStore.getState().setAuth('mock-gv-token', GV_USER);
    setMockUser('giaovien');
    renderWithQuery(<ClassesPage />);
    await waitFor(() => screen.getByText('CS01'));
    expect(screen.queryByRole('button', { name: /thêm lớp/i })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Sửa' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Xoá' })).toBeNull();
  });

  it('admin can open Sửa modal pre-filled with class data', async () => {
    renderWithQuery(<ClassesPage />);
    await waitFor(() => screen.getByText('CS01'));
    const user = userEvent.setup();
    await user.click(screen.getAllByRole('button', { name: 'Sửa' })[0]);
    const dialog = await screen.findByRole('dialog');
    const tenLop = within(dialog).getByLabelText(/tên lớp/i) as HTMLInputElement;
    expect(tenLop.value.length).toBeGreaterThan(0);
  });

  it('admin can delete a class', async () => {
    renderWithQuery(<ClassesPage />);
    await waitFor(() => screen.getByText('CS01'));
    const user = userEvent.setup();
    await user.click(screen.getAllByRole('button', { name: 'Xoá' })[0]);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /^xoá$/i }));
    await waitFor(() => {
      expect(screen.queryByText('CS01')).toBeNull();
    });
  });
});
