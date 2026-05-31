import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIsOwner } from './useIsOwner';
import { useAuthStore } from '@/lib/auth/store';
import type { TaiKhoan } from '@/types/models';

const GV_USER: TaiKhoan = {
  maTK: 2,
  tenDangNhap: 'gv',
  vaiTro: 'giaovien',
  trangThai: 1,
  maGV: 'GV01',
  giangVien: { maGV: 'GV01', hoTen: 'X', email: 'x@uit.edu.vn', khoaBoMon: null },
};

const ADMIN_USER: TaiKhoan = {
  maTK: 1,
  tenDangNhap: 'admin',
  vaiTro: 'admin',
  trangThai: 1,
  maGV: null,
  giangVien: null,
};

describe('useIsOwner', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('returns isOwner=true when GV.maGV matches record.maGV', () => {
    useAuthStore.getState().setUser(GV_USER);
    const { result } = renderHook(() => useIsOwner('GV01'));
    expect(result.current.isOwner).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });

  it('returns isOwner=false when GV.maGV does NOT match record.maGV', () => {
    useAuthStore.getState().setUser(GV_USER);
    const { result } = renderHook(() => useIsOwner('GV99'));
    expect(result.current.isOwner).toBe(false);
  });

  it('returns isOwner=false for admin even if record.maGV equals null', () => {
    useAuthStore.getState().setUser(ADMIN_USER);
    const { result } = renderHook(() => useIsOwner(null));
    expect(result.current.isOwner).toBe(false);
    expect(result.current.isAdmin).toBe(true);
  });

  it('returns isOwner=false when user is null (logged out)', () => {
    const { result } = renderHook(() => useIsOwner('GV01'));
    expect(result.current.isOwner).toBe(false);
    expect(result.current.role).toBeNull();
  });

  it('returns isOwner=false when recordMaGV is undefined', () => {
    useAuthStore.getState().setUser(GV_USER);
    const { result } = renderHook(() => useIsOwner(undefined));
    expect(result.current.isOwner).toBe(false);
  });
});
