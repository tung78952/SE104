import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { API_BASE_URL } from './client';
import { changePassword, refresh, signin, signout } from './auth';
import { useAuthStore } from '@/lib/auth/store';
import { getApiMessage, getApiStatus } from './errors';

describe('auth API client', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAccessToken('test-token');
  });

  afterEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('signin posts credentials and returns tokens', async () => {
    let receivedBody: unknown = null;
    server.use(
      http.post(`${API_BASE_URL}/auth/signin`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ accessToken: 'token-abc', userId: 1 });
      }),
    );

    const result = await signin({ tenDangNhap: 'admin', matKhau: 'admin123' });
    expect(result).toEqual({ accessToken: 'token-abc', userId: 1 });
    expect(receivedBody).toEqual({ tenDangNhap: 'admin', matKhau: 'admin123' });
  });

  it('signin propagates 401 from the server', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/signin`, () =>
        HttpResponse.json({ statusCode: 401, message: 'Mật khẩu không đúng' }, { status: 401 }),
      ),
    );

    try {
      await signin({ tenDangNhap: 'admin', matKhau: 'wrongpw' });
      throw new Error('should have thrown');
    } catch (err) {
      expect(getApiStatus(err)).toBe(401);
      expect(getApiMessage(err)).toBe('Mật khẩu không đúng');
    }
  });

  it('signout returns a message', async () => {
    const res = await signout();
    expect(res.message).toBeDefined();
  });

  it('refresh returns a new access token', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/refresh`, () =>
        HttpResponse.json({ accessToken: 'fresh-token' }),
      ),
    );
    const res = await refresh();
    expect(res.accessToken).toBe('fresh-token');
  });

  it('changePassword posts the old + new password', async () => {
    let body: unknown = null;
    server.use(
      http.patch(`${API_BASE_URL}/auth/change-password`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ message: 'Đổi mật khẩu thành công' });
      }),
    );
    const res = await changePassword({
      matKhauCu: 'admin123',
      matKhauMoi: 'newSecret9',
    });
    expect(res.message).toBeDefined();
    expect(body).toEqual({ matKhauCu: 'admin123', matKhauMoi: 'newSecret9' });
  });

  it('changePassword surfaces 400 (sai mật khẩu cũ)', async () => {
    server.use(
      http.patch(`${API_BASE_URL}/auth/change-password`, () =>
        HttpResponse.json(
          { statusCode: 400, message: 'Mật khẩu cũ không chính xác' },
          { status: 400 },
        ),
      ),
    );
    try {
      await changePassword({ matKhauCu: 'wrong', matKhauMoi: 'newSecret9' });
      throw new Error('should have thrown');
    } catch (err) {
      expect(getApiStatus(err)).toBe(400);
      expect(getApiMessage(err)).toMatch(/mật khẩu cũ/i);
    }
  });
});
