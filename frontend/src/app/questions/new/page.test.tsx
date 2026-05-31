import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/store';
import NewQuestionPage from './page';
import type { TaiKhoan } from '@/types/models';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/questions/new',
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  Toaster: () => null,
}));

const GV: TaiKhoan = {
  maTK: 2,
  tenDangNhap: 'gv',
  vaiTro: 'giaovien',
  trangThai: 1,
  maGV: 'GV01',
  giangVien: { maGV: 'GV01', hoTen: 'GV Test', email: 'gv@uit.edu.vn', khoaBoMon: 'CNPM' },
};

const ADMIN: TaiKhoan = {
  maTK: 1,
  tenDangNhap: 'admin',
  vaiTro: 'admin',
  trangThai: 1,
  maGV: null,
  giangVien: null,
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <NewQuestionPage />
    </QueryClientProvider>,
  );
}

describe('NewQuestionPage', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });
  afterEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('renders the question form for a teacher', async () => {
    useAuthStore.getState().setAuth('tok', GV);
    renderPage();
    await waitFor(() => expect(screen.getByText(/soạn câu hỏi/i)).toBeInTheDocument());
    expect(screen.getByLabelText(/nội dung/i)).toBeInTheDocument();
  });

  it('blocks admin with permission message', async () => {
    useAuthStore.getState().setAuth('tok', ADMIN);
    renderPage();
    await waitFor(() => expect(screen.getByText(/chỉ giảng viên/i)).toBeInTheDocument());
  });
});
