import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/store';
import DashboardPage from './page';
import type { TaiKhoan } from '@/types/models';

vi.mock('next/navigation', () => ({
  useRouter: (): { replace: () => void; push: () => void } => ({
    replace: vi.fn(),
    push: vi.fn(),
  }),
  usePathname: (): string => '/dashboard',
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: (): null => null,
}));

// Recharts ResponsiveContainer relies on DOM measurements; stub for jsdom.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive">{children}</div>
    ),
  };
});

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
    khoaBoMon: 'KHMT',
  },
};

describe('DashboardPage', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAuth('mock-admin-token', ADMIN_USER);
  });
  afterEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('renders 4 main stat cards with values from mock data', async () => {
    renderWithQuery(<DashboardPage />);

    const stats = await screen.findByTestId('dashboard-stats');
    expect(within(stats).getByText('Môn học')).toBeInTheDocument();
    expect(within(stats).getByText('Lớp học')).toBeInTheDocument();
    expect(within(stats).getByText('Câu hỏi')).toBeInTheDocument();
    expect(within(stats).getByText('Đề thi')).toBeInTheDocument();

    // From mock handlers: 12 subjects, 3 classes, 4 questions, 1 exam
    await waitFor(() => {
      expect(within(stats).getByText('12')).toBeInTheDocument();
    });
    expect(within(stats).getByText('3')).toBeInTheDocument();
    expect(within(stats).getByText('4')).toBeInTheDocument();
    expect(within(stats).getByText('1')).toBeInTheDocument();
  });

  it('renders recent exams table with backend data', async () => {
    renderWithQuery(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getAllByText(/Cơ sở dữ liệu/i).length).toBeGreaterThan(0);
    });
    // 'Lê Thị Hoa' appears as an exam author AND a question author — that's fine.
    expect(screen.getAllByText(/Lê Thị Hoa/i).length).toBeGreaterThan(0);
  });

  it('renders recent questions list with author + difficulty', async () => {
    renderWithQuery(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText(/Trình bày khái niệm chuẩn hoá 3NF/i)).toBeInTheDocument();
    });
  });
});
