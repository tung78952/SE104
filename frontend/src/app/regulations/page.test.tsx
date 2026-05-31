import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/store';
import { setMockUser } from '@/mocks/handlers';
import RegulationsPage from './page';
import type { TaiKhoan } from '@/types/models';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/regulations',
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

describe('RegulationsPage', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAuth('mock-admin-token', ADMIN_USER);
    setMockUser('admin');
  });
  afterEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('shows all 5 default regulations', async () => {
    renderWithQuery(<RegulationsPage />);
    await waitFor(() => screen.getByText('SoCauToiDa'));
    expect(screen.getByText('ThoiLuongMin')).toBeInTheDocument();
    expect(screen.getByText('ThoiLuongMax')).toBeInTheDocument();
    expect(screen.getByText('DiemMin')).toBeInTheDocument();
    expect(screen.getByText('DiemMax')).toBeInTheDocument();
  });

  it('admin can inline-edit a value and save', async () => {
    renderWithQuery(<RegulationsPage />);
    await waitFor(() => screen.getByText('SoCauToiDa'));
    const user = userEvent.setup();
    const input = screen.getByLabelText('Giá trị của SoCauToiDa') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, '8');
    const saveBtns = screen.getAllByRole('button', { name: /^lưu$/i });
    expect(saveBtns.length).toBeGreaterThan(0);
    await user.click(saveBtns[0]);
    // After save, the value should reflect the updated state
    await waitFor(() => {
      expect((screen.getByLabelText('Giá trị của SoCauToiDa') as HTMLInputElement).value).toBe('8');
    });
  });

  it('admin sees no Xoá button (KHÔNG có xoá theo §1.5.2)', async () => {
    renderWithQuery(<RegulationsPage />);
    await waitFor(() => screen.getByText('SoCauToiDa'));
    expect(screen.queryByRole('button', { name: /^xoá$/i })).toBeNull();
  });

  it('giaovien sees values as plain text, no Lưu/Thêm tham số', async () => {
    useAuthStore.getState().setAuth('mock-gv-token', GV_USER);
    setMockUser('giaovien');
    renderWithQuery(<RegulationsPage />);
    await waitFor(() => screen.getByText('SoCauToiDa'));
    expect(screen.queryByLabelText('Giá trị của SoCauToiDa')).toBeNull();
    expect(screen.queryByRole('button', { name: /thêm tham số/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^lưu$/i })).toBeNull();
  });
});
