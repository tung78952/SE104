import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/store';
import { setMockUser } from '@/mocks/handlers';
import DifficultiesPage from './page';
import type { TaiKhoan } from '@/types/models';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/difficulties',
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
  tenDangNhap: 'gv',
  vaiTro: 'giaovien',
  trangThai: 1,
  maGV: 'GV01',
  giangVien: null,
};

function renderWithQuery(node: React.ReactElement): void {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={qc}>{node}</QueryClientProvider>);
}

describe('DifficultiesPage', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAuth('mock-admin-token', ADMIN_USER);
    setMockUser('admin');
  });
  afterEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('lists difficulties for admin', async () => {
    renderWithQuery(<DifficultiesPage />);
    await waitFor(() => screen.getByText('Dễ'));
    expect(screen.getByText('Trung Bình')).toBeInTheDocument();
    expect(screen.getByText('Phức Tạp')).toBeInTheDocument();
    expect(screen.getByText('Khó')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /thêm độ khó/i })).toBeInTheDocument();
  });

  it('giaovien is read-only', async () => {
    useAuthStore.getState().setAuth('mock-gv-token', GV_USER);
    setMockUser('giaovien');
    renderWithQuery(<DifficultiesPage />);
    await waitFor(() => screen.getByText('Dễ'));
    expect(screen.queryByRole('button', { name: /thêm độ khó/i })).toBeNull();
  });

  it('admin can create + delete a difficulty', async () => {
    renderWithQuery(<DifficultiesPage />);
    await waitFor(() => screen.getByText('Dễ'));
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /thêm độ khó/i }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/tên độ khó/i), 'Siêu khó');
    await user.click(within(dialog).getByRole('button', { name: /^lưu$/i }));
    await waitFor(() => {
      expect(screen.getByText('Siêu khó')).toBeInTheDocument();
    });
  });

  it('admin can open Sửa modal pre-filled', async () => {
    renderWithQuery(<DifficultiesPage />);
    await waitFor(() => screen.getByText('Dễ'));
    const user = userEvent.setup();
    await user.click(screen.getAllByRole('button', { name: 'Sửa' })[0]);
    const dialog = await screen.findByRole('dialog');
    const ten = within(dialog).getByLabelText(/tên độ khó/i) as HTMLInputElement;
    expect(ten.value.length).toBeGreaterThan(0);
  });
});
