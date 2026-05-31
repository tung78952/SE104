import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/store';
import ProfilePage from './page';
import type { TaiKhoan } from '@/types/models';

vi.mock('next/navigation', () => ({
  useRouter: (): { replace: () => void; push: () => void } => ({
    replace: vi.fn(),
    push: vi.fn(),
  }),
  usePathname: (): string => '/profile',
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => toastSuccess(msg),
    error: (msg: string) => toastError(msg),
  },
  Toaster: (): null => null,
}));

function renderWithQuery(node: React.ReactElement): void {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={qc}>{node}</QueryClientProvider>);
}

const ADMIN_USER: TaiKhoan = {
  maTK: 1,
  tenDangNhap: 'admin',
  vaiTro: 'admin',
  trangThai: 1,
  maGV: null,
  giangVien: {
    maGV: 'AD01',
    hoTen: 'Nguyễn Minh Tuấn',
    email: 'tuan.nm@uit.edu.vn',
    khoaBoMon: 'Khoa Khoa học Máy tính',
  },
};

describe('ProfilePage', () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    toastError.mockReset();
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAuth('mock-admin-token', ADMIN_USER);
  });
  afterEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('loads /users/me and pre-fills the editable fields', async () => {
    renderWithQuery(<ProfilePage />);
    await waitFor(() => {
      const hoTenInput = screen.getByLabelText(/họ và tên/i) as HTMLInputElement;
      expect(hoTenInput.value).toBe('Nguyễn Minh Tuấn');
    });

    const emailInput = screen.getByLabelText(/^email/i) as HTMLInputElement;
    expect(emailInput.value).toBe('tuan.nm@uit.edu.vn');

    expect(screen.getByText(/admin/i)).toBeInTheDocument();
  });

  it('renders read-only mã tài khoản, tên đăng nhập, vai trò', async () => {
    renderWithQuery(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByTestId('profile-maTK')).toHaveTextContent('1');
    });
    expect(screen.getByTestId('profile-tenDangNhap')).toHaveTextContent('admin');
    expect(screen.getByTestId('profile-vaiTro')).toHaveTextContent(/quản trị viên/i);
  });

  it('submits PATCH /users/me on save and shows success toast', async () => {
    renderWithQuery(<ProfilePage />);
    const user = userEvent.setup();

    const hoTenInput = await screen.findByLabelText(/họ và tên/i);
    await user.clear(hoTenInput);
    await user.type(hoTenInput, 'Tên Mới');

    await user.click(screen.getByRole('button', { name: /lưu thay đổi/i }));

    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(useAuthStore.getState().user?.giangVien?.hoTen).toBe('Tên Mới');
  });
});
