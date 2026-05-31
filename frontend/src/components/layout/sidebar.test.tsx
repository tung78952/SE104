import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from './sidebar';
import type { TaiKhoan } from '@/types/models';

vi.mock('next/navigation', () => ({
  usePathname: (): string => '/dashboard',
}));

const adminUser: TaiKhoan = {
  maTK: 1,
  tenDangNhap: 'admin',
  vaiTro: 'admin',
  trangThai: 1,
  maGV: null,
};

const gvUser: TaiKhoan = {
  maTK: 2,
  tenDangNhap: 'gv_thien',
  vaiTro: 'giaovien',
  trangThai: 1,
  maGV: 'GV01',
  giangVien: {
    maGV: 'GV01',
    hoTen: 'Nguyễn Văn Thiện',
    email: 'thien@uit.edu.vn',
    khoaBoMon: 'CNPM',
  },
};

describe('Sidebar — role-based menu', () => {
  it('admin sees "Tài khoản" menu', () => {
    render(<Sidebar user={adminUser} />);
    expect(screen.getByRole('link', { name: /Tài khoản/i })).toBeInTheDocument();
  });

  it('giảng viên does NOT see "Tài khoản" menu', () => {
    render(<Sidebar user={gvUser} />);
    expect(screen.queryByRole('link', { name: /Tài khoản/i })).not.toBeInTheDocument();
  });

  it('giảng viên sees read-only badges on the catalog items', () => {
    render(<Sidebar user={gvUser} />);
    const tags = screen.getAllByTestId('readonly-tag');
    expect(tags.length).toBeGreaterThanOrEqual(5);
  });

  it('admin sees catalog items WITHOUT read-only badges', () => {
    render(<Sidebar user={adminUser} />);
    expect(screen.queryAllByTestId('readonly-tag')).toHaveLength(0);
  });

  it('marks the active route via aria-current="page" when pathname matches', () => {
    render(<Sidebar user={adminUser} />);
    const dashboard = screen.getByRole('link', { name: /Dashboard/i });
    expect(dashboard).toHaveAttribute('aria-current', 'page');
  });

  it('displays the lecturer name from giangVien.hoTen when available', () => {
    render(<Sidebar user={gvUser} />);
    expect(screen.getByText('Nguyễn Văn Thiện')).toBeInTheDocument();
  });

  it('falls back to tenDangNhap when no giangVien is attached (admin)', () => {
    render(<Sidebar user={adminUser} />);
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('renders a logout button that calls onLogout', async () => {
    const onLogout = vi.fn();
    render(<Sidebar user={adminUser} onLogout={onLogout} />);
    const btn = screen.getByRole('button', { name: /Đăng xuất/i });
    btn.click();
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
