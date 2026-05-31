import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { API_BASE_URL } from './client';
import { getMe, updateMe } from './users';
import { useAuthStore } from '@/lib/auth/store';

describe('users API client', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAccessToken('test-token');
  });

  afterEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('getMe returns the current user', async () => {
    const me = await getMe();
    expect(me.tenDangNhap).toBe('admin');
    expect(me.vaiTro).toBe('admin');
  });

  it('updateMe sends the patched fields', async () => {
    let body: unknown = null;
    server.use(
      http.patch(`${API_BASE_URL}/users/me`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          maTK: 1,
          tenDangNhap: 'admin',
          vaiTro: 'admin',
          trangThai: 1,
          maGV: null,
          giangVien: {
            maGV: 'AD01',
            hoTen: 'New Name',
            email: 'new@uit.edu.vn',
            khoaBoMon: 'CNPM',
          },
        });
      }),
    );

    const updated = await updateMe({
      hoTen: 'New Name',
      email: 'new@uit.edu.vn',
      khoaBoMon: 'CNPM',
    });
    expect(updated.giangVien?.hoTen).toBe('New Name');
    expect(body).toEqual({
      hoTen: 'New Name',
      email: 'new@uit.edu.vn',
      khoaBoMon: 'CNPM',
    });
  });
});
