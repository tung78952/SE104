import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/store';
import { setMockUser } from '@/mocks/handlers';
import ClassDetailPage from './page';
import type { TaiKhoan } from '@/types/models';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/classes/CS01',
  useParams: () => ({ maLop: 'CS01' }),
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

describe('ClassDetailPage', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAuth('mock-admin-token', ADMIN_USER);
    setMockUser('admin');
  });
  afterEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('shows class header and student list', async () => {
    renderWithQuery(<ClassDetailPage />);
    await waitFor(() => screen.getByText('CSDL - CTT2022'));
    expect(screen.getByText('22520001')).toBeInTheDocument();
    expect(screen.getByText('22520002')).toBeInTheDocument();
  });

  it('admin can add a student', async () => {
    renderWithQuery(<ClassDetailPage />);
    await waitFor(() => screen.getByText('CSDL - CTT2022'));
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /thêm sv vào lớp/i }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/mã sinh viên/i), '22599999');
    await user.type(within(dialog).getByLabelText(/họ tên/i), 'SV mới');
    await user.click(within(dialog).getByRole('button', { name: /^lưu$/i }));
    await waitFor(() => {
      expect(screen.getByText('22599999')).toBeInTheDocument();
    });
  });

  it('admin can remove a student', async () => {
    renderWithQuery(<ClassDetailPage />);
    await waitFor(() => screen.getByText('22520001'));
    const user = userEvent.setup();
    const deleteButtons = screen.getAllByRole('button', { name: 'Xoá' });
    await user.click(deleteButtons[0]);
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /^xoá$/i }));
    await waitFor(() => {
      expect(screen.queryByText('22520001')).toBeNull();
    });
  });

  it('giaovien sees students but no add/remove buttons', async () => {
    useAuthStore.getState().setAuth('mock-gv-token', GV_USER);
    setMockUser('giaovien');
    renderWithQuery(<ClassDetailPage />);
    await waitFor(() => screen.getByText('22520001'));
    expect(screen.queryByRole('button', { name: /thêm sv vào lớp/i })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Xoá' })).toBeNull();
  });
});
