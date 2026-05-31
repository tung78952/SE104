import { create } from 'zustand';
import type { TaiKhoan, VaiTro } from '@/types/models';

interface AuthState {
  accessToken: string | null;
  user: TaiKhoan | null;
  isHydrated: boolean;
  setAccessToken: (token: string | null) => void;
  setUser: (user: TaiKhoan | null) => void;
  setAuth: (accessToken: string, user: TaiKhoan) => void;
  clearAuth: () => void;
  markHydrated: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isHydrated: false,
  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  setAuth: (accessToken, user) => set({ accessToken, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
  markHydrated: () => set({ isHydrated: true }),
}));

export const selectVaiTro = (state: AuthState): VaiTro | null => state.user?.vaiTro ?? null;
export const selectMaGV = (state: AuthState): string | null => state.user?.maGV ?? null;
export const selectIsAuthenticated = (state: AuthState): boolean => state.accessToken !== null;
