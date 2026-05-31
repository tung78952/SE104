import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { API_BASE_URL } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
import EditExamPage from './page';
import type { TaiKhoan } from '@/types/models';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useParams: () => ({ id: '1' }),
  usePathname: () => '/exams/1/edit',
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

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <EditExamPage />
    </QueryClientProvider>,
  );
}

describe('EditExamPage', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAuth('tok', GV);
  });
  afterEach(() => useAuthStore.getState().clearAuth());

  it('shows non-owner message when GV does not own the exam', async () => {
    server.use(
      http.get(`${API_BASE_URL}/exams/1`, () =>
        HttpResponse.json({
          maDeThi: 1,
          maMon: 'CSDL',
          hocKy: 1,
          namHoc: '2025-2026',
          thoiLuong: 60,
          maGV: 'GV02',
          ngayTao: new Date().toISOString(),
          cauHois: [],
        }),
      ),
    );
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/chỉ giảng viên|không có quyền/i)).toBeInTheDocument(),
    );
  });
});
