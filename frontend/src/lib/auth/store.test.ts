import { beforeEach, describe, expect, it } from 'vitest';
import { selectIsAuthenticated, selectMaGV, selectVaiTro, useAuthStore } from './store';
import type { TaiKhoan } from '@/types/models';

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
};

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('starts unauthenticated with null token and user', () => {
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(selectIsAuthenticated(state)).toBe(false);
    expect(selectVaiTro(state)).toBeNull();
    expect(selectMaGV(state)).toBeNull();
  });

  it('setAuth sets both token and user atomically', () => {
    useAuthStore.getState().setAuth('tok-123', adminUser);
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('tok-123');
    expect(state.user).toEqual(adminUser);
    expect(selectIsAuthenticated(state)).toBe(true);
    expect(selectVaiTro(state)).toBe('admin');
  });

  it('clearAuth wipes token and user', () => {
    useAuthStore.getState().setAuth('tok-123', adminUser);
    useAuthStore.getState().clearAuth();
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(selectIsAuthenticated(state)).toBe(false);
  });

  it('setAccessToken updates token only, leaving user intact', () => {
    useAuthStore.getState().setAuth('old-token', adminUser);
    useAuthStore.getState().setAccessToken('new-token');
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('new-token');
    expect(state.user).toEqual(adminUser);
  });

  it('setUser updates user only, leaving token intact', () => {
    useAuthStore.getState().setAuth('keep-token', adminUser);
    useAuthStore.getState().setUser(gvUser);
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('keep-token');
    expect(state.user).toEqual(gvUser);
    expect(selectMaGV(state)).toBe('GV01');
  });

  it('selectMaGV returns maGV for giaovien, null for admin', () => {
    useAuthStore.getState().setAuth('t', adminUser);
    expect(selectMaGV(useAuthStore.getState())).toBeNull();

    useAuthStore.getState().setAuth('t', gvUser);
    expect(selectMaGV(useAuthStore.getState())).toBe('GV01');
  });

  it('markHydrated flips isHydrated to true', () => {
    expect(useAuthStore.getState().isHydrated).toBe(false);
    useAuthStore.getState().markHydrated();
    expect(useAuthStore.getState().isHydrated).toBe(true);
  });
});
