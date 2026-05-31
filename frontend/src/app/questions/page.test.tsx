import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/store';
import { setMockUser } from '@/mocks/handlers';
import QuestionsPage from './page';
import type { TaiKhoan } from '@/types/models';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: pushMock }),
  usePathname: () => '/questions',
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

const GV_OWNER: TaiKhoan = {
  maTK: 2,
  tenDangNhap: 'gv_thien',
  vaiTro: 'giaovien',
  trangThai: 1,
  maGV: 'GV01',
  giangVien: { maGV: 'GV01', hoTen: 'Thiện', email: 'thien@uit.edu.vn', khoaBoMon: 'CNPM' },
};

const GV_OTHER: TaiKhoan = {
  maTK: 3,
  tenDangNhap: 'gv_hoa',
  vaiTro: 'giaovien',
  trangThai: 1,
  maGV: 'GV99',
  giangVien: { maGV: 'GV99', hoTen: 'Hoa', email: 'hoa@uit.edu.vn', khoaBoMon: 'CNPM' },
};

function renderPage(): void {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <QuestionsPage />
    </QueryClientProvider>,
  );
}

describe('QuestionsPage', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    pushMock.mockReset();
  });
  afterEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('renders questions list seeded from mock', async () => {
    useAuthStore.getState().setAuth('mock-admin-token', ADMIN_USER);
    setMockUser('admin');
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/Trình bày khái niệm chuẩn hoá 3NF/)).toBeInTheDocument();
    });
  });

  it('admin sees no "Soạn câu hỏi" button', async () => {
    useAuthStore.getState().setAuth('mock-admin-token', ADMIN_USER);
    setMockUser('admin');
    renderPage();
    await waitFor(() => screen.getByText(/3NF/));
    expect(screen.queryByRole('button', { name: /soạn câu hỏi/i })).toBeNull();
  });

  it('GV-owner sees Sửa/Xoá for own question (CH1, GV01)', async () => {
    useAuthStore.getState().setAuth('mock-gv-token', GV_OWNER);
    setMockUser('giaovien');
    renderPage();
    await waitFor(() => screen.getByText(/3NF/));
    expect(screen.getAllByRole('button', { name: 'Sửa' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Xoá' }).length).toBeGreaterThan(0);
  });

  it('GV-other does NOT see Sửa/Xoá for question owned by GV01', async () => {
    useAuthStore.getState().setAuth('mock-gv-token', GV_OTHER);
    setMockUser('giaovien');
    renderPage();
    await waitFor(() => screen.getByText(/3NF/));
    // Xem buttons still appear, but Sửa/Xoá should NOT for any of the seeded GV01 questions
    expect(screen.queryByRole('button', { name: 'Sửa' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Xoá' })).toBeNull();
  });

  it('clicking Xem opens the QuestionDetailModal with full content', async () => {
    useAuthStore.getState().setAuth('mock-admin-token', ADMIN_USER);
    setMockUser('admin');
    renderPage();
    await waitFor(() => screen.getByText(/3NF/));
    const user = userEvent.setup();
    const xemButtons = screen.getAllByRole('button', { name: 'Xem' });
    await user.click(xemButtons[0]);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Chi tiết câu hỏi/i)).toBeInTheDocument();
  });

  it('filter by subject narrows the result set', async () => {
    useAuthStore.getState().setAuth('mock-admin-token', ADMIN_USER);
    setMockUser('admin');
    renderPage();
    await waitFor(() => screen.getByText(/3NF/));
    // also seeded MMT question
    expect(screen.getByText(/TCP và UDP/)).toBeInTheDocument();

    const user = userEvent.setup();
    const selects = screen.getAllByRole('combobox');
    // first select is "Tất cả môn"
    await user.click(selects[0]);
    const items = await screen.findAllByRole('option');
    const csdlOption = items.find((el) => el.textContent?.includes('CSDL'));
    expect(csdlOption).toBeTruthy();
    await user.click(csdlOption!);

    await waitFor(() => {
      expect(screen.queryByText(/TCP và UDP/)).toBeNull();
    });
    expect(screen.getByText(/3NF/)).toBeInTheDocument();
  });
});
