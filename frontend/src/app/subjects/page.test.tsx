import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/store';
import { setMockUser } from '@/mocks/handlers';
import SubjectsPage from './page';
import type { TaiKhoan } from '@/types/models';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/subjects',
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
  giangVien: {
    maGV: 'GV01',
    hoTen: 'Thiện',
    email: 'thien@uit.edu.vn',
    khoaBoMon: 'CNPM',
  },
};

function renderWithQuery(node: React.ReactElement): void {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={qc}>{node}</QueryClientProvider>);
}

describe('SubjectsPage', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAuth('mock-admin-token', ADMIN_USER);
    setMockUser('admin');
  });
  afterEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('renders list of subjects from mock', async () => {
    renderWithQuery(<SubjectsPage />);
    await waitFor(() => {
      expect(screen.getByText('CSDL')).toBeInTheDocument();
    });
    expect(screen.getByText('Cơ sở dữ liệu')).toBeInTheDocument();
    expect(screen.getByText(/kết quả/i)).toBeInTheDocument();
  });

  it('admin sees the Thêm môn button', async () => {
    renderWithQuery(<SubjectsPage />);
    await waitFor(() => screen.getByText('CSDL'));
    expect(screen.getByRole('button', { name: /thêm môn/i })).toBeInTheDocument();
  });

  it('giaovien does NOT see Thêm/Sửa/Xoá buttons', async () => {
    useAuthStore.getState().setAuth('mock-gv-token', GV_USER);
    setMockUser('giaovien');
    renderWithQuery(<SubjectsPage />);
    await waitFor(() => screen.getByText('CSDL'));
    expect(screen.queryByRole('button', { name: /thêm môn/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^sửa$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^xoá$/i })).toBeNull();
  });

  it('admin can open create modal and submit a new subject', async () => {
    renderWithQuery(<SubjectsPage />);
    await waitFor(() => screen.getByText('CSDL'));
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /thêm môn/i }));

    const dialog = await screen.findByRole('dialog');
    const maMonInput = within(dialog).getByLabelText(/mã môn/i);
    const tenMonInput = within(dialog).getByLabelText(/tên môn/i);
    const soTcInput = within(dialog).getByLabelText(/số tín chỉ/i);

    await user.type(maMonInput, 'TEST101');
    await user.type(tenMonInput, 'Môn test');
    await user.clear(soTcInput);
    await user.type(soTcInput, '3');

    await user.click(within(dialog).getByRole('button', { name: /^lưu$/i }));

    await waitFor(() => {
      expect(screen.getByText('TEST101')).toBeInTheDocument();
    });
  });

  it('admin can open edit modal pre-filled', async () => {
    renderWithQuery(<SubjectsPage />);
    await waitFor(() => screen.getByText('CSDL'));
    const user = userEvent.setup();
    const editButtons = screen.getAllByRole('button', { name: 'Sửa' });
    await user.click(editButtons[0]);

    const dialog = await screen.findByRole('dialog');
    const tenMonInput = within(dialog).getByLabelText(/tên môn/i) as HTMLInputElement;
    expect(tenMonInput.value.length).toBeGreaterThan(0);
  });

  it('admin can delete a subject via confirm modal', async () => {
    renderWithQuery(<SubjectsPage />);
    await waitFor(() => screen.getByText('CSDL'));
    const user = userEvent.setup();
    const deleteButtons = screen.getAllByRole('button', { name: 'Xoá' });
    await user.click(deleteButtons[0]);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/xác nhận xoá/i)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /^xoá$/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});
