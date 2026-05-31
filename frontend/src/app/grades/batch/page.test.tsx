import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/store';
import { setMockUser } from '@/mocks/handlers';
import BatchGradesPage from './page';
import type { TaiKhoan } from '@/types/models';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: pushMock }),
  usePathname: () => '/grades/batch',
  useParams: () => ({}),
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
  giangVien: { maGV: 'GV01', hoTen: 'Thiện', email: 'thien@uit.edu.vn', khoaBoMon: 'CNPM' },
};

function renderPage(): void {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <BatchGradesPage />
    </QueryClientProvider>,
  );
}

describe('BatchGradesPage', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAuth('mock-gv-token', GV);
    setMockUser('giaovien');
    pushMock.mockReset();
  });
  afterEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('shows empty state until a class is selected', async () => {
    renderPage();
    await waitFor(() => screen.getByLabelText(/lớp \*/i));
    expect(screen.getByText(/Chọn lớp để hiển thị/i)).toBeInTheDocument();
  });

  it('loads students after picking a class and updates summary as scores are entered', async () => {
    renderPage();
    await waitFor(() => screen.getByLabelText(/lớp \*/i));

    const user = userEvent.setup();
    await user.click(screen.getByLabelText(/lớp \*/i));
    const csOption = await screen.findByText(/CS01/);
    await user.click(csOption);

    // Wait for inline inputs (2 students in CS01 from seed)
    const aInput = await screen.findByLabelText(/Điểm 22520001/);
    await user.type(aInput, '8.5');
    const summary = screen.getByTestId('batch-summary');
    expect(summary.textContent).toMatch(/1\/2/);
    expect(summary.textContent).toMatch(/8\.5/);

    const bInput = screen.getByLabelText(/Điểm 22520002/);
    await user.type(bInput, '6');
    expect(screen.getByTestId('batch-summary').textContent).toMatch(/2\/2/);
    expect(screen.getByTestId('batch-summary').textContent).toMatch(/7\.25/);
  });

  it('highlights invalid score and reports invalid count in summary', async () => {
    renderPage();
    await waitFor(() => screen.getByLabelText(/lớp \*/i));
    const user = userEvent.setup();
    await user.click(screen.getByLabelText(/lớp \*/i));
    const opt = await screen.findByText(/CS01/);
    await user.click(opt);

    const aInput = await screen.findByLabelText(/Điểm 22520001/);
    await user.type(aInput, '15');
    expect(screen.getByTestId('batch-summary').textContent).toMatch(/1 dòng sai/);
    expect(aInput.className).toMatch(/border-destructive/);
  });
});
