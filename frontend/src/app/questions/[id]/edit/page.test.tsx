import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { API_BASE_URL } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
import EditQuestionPage from './page';
import type { TaiKhoan } from '@/types/models';

const useParamsMock = vi.fn(() => ({ id: '101' }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useParams: () => useParamsMock(),
  usePathname: () => '/questions/101/edit',
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
      <EditQuestionPage />
    </QueryClientProvider>,
  );
}

describe('EditQuestionPage', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAuth('tok', GV);
  });
  afterEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('renders edit form when GV owns the question', async () => {
    server.use(
      http.get(`${API_BASE_URL}/questions/101`, () =>
        HttpResponse.json({
          maCauHoi: 101,
          maMon: 'CSDL',
          maDoKho: 1,
          maGV: 'GV01',
          noiDung: 'Câu hỏi mẫu nội dung đủ dài',
          ngayTao: new Date().toISOString(),
        }),
      ),
      http.get(`${API_BASE_URL}/subjects`, () =>
        HttpResponse.json({
          data: [{ maMon: 'CSDL', tenMon: 'CSDL', soTinChi: 4 }],
          total: 1,
          page: 1,
          limit: 500,
        }),
      ),
      http.get(`${API_BASE_URL}/difficulties`, () =>
        HttpResponse.json([{ maDoKho: 1, tenDoKho: 'Dễ' }]),
      ),
    );

    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /cập nhật/i })).toBeInTheDocument(),
    );
  });

  it('shows "not the owner" message when GV does not own the question', async () => {
    server.use(
      http.get(`${API_BASE_URL}/questions/101`, () =>
        HttpResponse.json({
          maCauHoi: 101,
          maMon: 'CSDL',
          maDoKho: 1,
          maGV: 'GV02',
          noiDung: 'Câu hỏi của GV khác',
          ngayTao: new Date().toISOString(),
        }),
      ),
    );

    renderPage();
    await waitFor(() => expect(screen.getByText(/chỉ giảng viên đã soạn/i)).toBeInTheDocument());
  });

  it('shows "not found" message when question does not exist', async () => {
    server.use(
      http.get(`${API_BASE_URL}/questions/101`, () =>
        HttpResponse.json({ statusCode: 404, message: 'Not found' }, { status: 404 }),
      ),
    );

    renderPage();
    await waitFor(() => expect(screen.getByText(/không tìm thấy/i)).toBeInTheDocument());
  });
});
