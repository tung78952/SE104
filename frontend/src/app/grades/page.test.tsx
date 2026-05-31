import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { API_BASE_URL } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
import GradesPage from './page';
import type { TaiKhoan } from '@/types/models';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/grades',
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
      <GradesPage />
    </QueryClientProvider>,
  );
}

describe('GradesPage', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAuth('tok', GV);
  });
  afterEach(() => useAuthStore.getState().clearAuth());

  it('renders the grades page heading', async () => {
    server.use(
      http.get(`${API_BASE_URL}/grades`, () =>
        HttpResponse.json({ data: [], total: 0, page: 1, limit: 10 }),
      ),
      http.get(`${API_BASE_URL}/classes`, () =>
        HttpResponse.json({ data: [], total: 0, page: 1, limit: 10 }),
      ),
      http.get(`${API_BASE_URL}/exams`, () =>
        HttpResponse.json({ data: [], total: 0, page: 1, limit: 10 }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getAllByText(/bảng điểm/i).length).toBeGreaterThan(0), {
      timeout: 5000,
    });
  });
});
