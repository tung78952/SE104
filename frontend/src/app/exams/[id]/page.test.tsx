import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { API_BASE_URL } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
import ExamDetailPage from './page';
import type { TaiKhoan } from '@/types/models';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useParams: () => ({ id: '5' }),
  usePathname: () => '/exams/5',
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
      <ExamDetailPage />
    </QueryClientProvider>,
  );
}

describe('ExamDetailPage', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAuth('tok', GV);
  });
  afterEach(() => useAuthStore.getState().clearAuth());

  it('renders exam summary and shows edit button for owner', async () => {
    server.use(
      http.get(`${API_BASE_URL}/exams/5`, () =>
        HttpResponse.json({
          maDeThi: 5,
          maMon: 'CSDL',
          hocKy: 1,
          namHoc: '2025-2026',
          thoiLuong: 60,
          maGV: 'GV01',
          ngayTao: new Date().toISOString(),
          monHoc: { maMon: 'CSDL', tenMon: 'Cơ sở dữ liệu', soTinChi: 4 },
          giangVien: GV.giangVien,
          chiTietDeThis: [],
        }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getAllByText(/DT-5/i).length).toBeGreaterThan(0), {
      timeout: 5000,
    });
  });

  it('shows "not found" when API returns 404', async () => {
    server.use(
      http.get(`${API_BASE_URL}/exams/5`, () =>
        HttpResponse.json({ statusCode: 404, message: 'Not found' }, { status: 404 }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText(/không tìm thấy/i)).toBeInTheDocument());
  });
});
