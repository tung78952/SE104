import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/store';
import { setMockUser } from '@/mocks/handlers';
import ExamsPage from './page';
import NewExamPage from './new/page';
import type { TaiKhoan } from '@/types/models';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: pushMock }),
  usePathname: () => '/exams',
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

function renderNode(node: React.ReactElement): void {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={qc}>{node}</QueryClientProvider>);
}

describe('ExamsPage', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAuth('mock-gv-token', GV);
    setMockUser('giaovien');
    pushMock.mockReset();
  });
  afterEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('renders the seeded exam in the list for GV', async () => {
    renderNode(<ExamsPage />);
    await waitFor(() => {
      expect(screen.getByText(/DT-58/)).toBeInTheDocument();
    });
  });

  it('GV can fill form, pick questions, and submit successfully', async () => {
    renderNode(<NewExamPage />);
    await waitFor(() => screen.getByLabelText(/môn học \*/i));

    const user = userEvent.setup();
    const combos = screen.getAllByRole('combobox');
    // [0] = subject, [1] = hocKy
    await user.click(combos[0]);
    const csdlOption = await screen.findByRole('option', { name: /CSDL — Cơ sở dữ liệu/ });
    await user.click(csdlOption);

    const namHocInput = screen.getByLabelText(/năm học \*/i) as HTMLInputElement;
    await user.clear(namHocInput);
    await user.type(namHocInput, '2024-2025');

    // Wait for the question bank to load
    await waitFor(() => expect(screen.getByText(/3NF/)).toBeInTheDocument());
    const boxes = within(screen.getByTestId('question-bank-list')).getAllByRole('checkbox');
    await user.click(boxes[0]);
    await user.click(boxes[1]);

    const submitBtn = screen.getByRole('button', { name: /lưu đề/i });
    await waitFor(() => expect(submitBtn).not.toBeDisabled());
    await user.click(submitBtn);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalled();
    });
    expect(pushMock.mock.calls[0][0]).toMatch(/^\/exams\/\d+$/);
  }, 15000);
});
