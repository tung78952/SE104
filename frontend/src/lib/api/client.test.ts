import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/lib/auth/store';
import { API_BASE_URL, createApiClient, setAuthLostHandler } from './client';

describe('apiClient interceptors', () => {
  let restoreHandler: () => void;
  let onAuthLost: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAccessToken('old-token');
    onAuthLost = vi.fn<() => void>();
    restoreHandler = setAuthLostHandler(onAuthLost);
  });

  afterEach(() => {
    restoreHandler();
  });

  it('attaches Bearer token from auth store on each request', async () => {
    const client = createApiClient();
    let seenAuth: string | null = null;
    server.use(
      http.get(`${API_BASE_URL}/users/me`, ({ request }) => {
        seenAuth = request.headers.get('authorization');
        return HttpResponse.json({ maTK: 1 });
      }),
    );

    await client.get('/users/me');

    expect(seenAuth).toBe('Bearer old-token');
  });

  it('on 401 calls /auth/refresh and retries the original request with the new token', async () => {
    const client = createApiClient();
    let protectedCalls = 0;
    let refreshCalls = 0;
    let retryAuthHeader: string | null = null;

    server.use(
      http.get(`${API_BASE_URL}/protected`, ({ request }) => {
        protectedCalls += 1;
        if (protectedCalls === 1) {
          return HttpResponse.json({ statusCode: 401, message: 'expired' }, { status: 401 });
        }
        retryAuthHeader = request.headers.get('authorization');
        return HttpResponse.json({ ok: true });
      }),
      http.post(`${API_BASE_URL}/auth/refresh`, () => {
        refreshCalls += 1;
        return HttpResponse.json({ accessToken: 'fresh-token' });
      }),
    );

    const response = await client.get('/protected');

    expect(refreshCalls).toBe(1);
    expect(protectedCalls).toBe(2);
    expect(retryAuthHeader).toBe('Bearer fresh-token');
    expect(response.data).toEqual({ ok: true });
    expect(useAuthStore.getState().accessToken).toBe('fresh-token');
    expect(onAuthLost).not.toHaveBeenCalled();
  });

  it('when /auth/refresh fails, clears auth and invokes the auth-lost handler', async () => {
    const client = createApiClient();

    server.use(
      http.get(`${API_BASE_URL}/protected`, () =>
        HttpResponse.json({ statusCode: 401, message: 'expired' }, { status: 401 }),
      ),
      http.post(`${API_BASE_URL}/auth/refresh`, () =>
        HttpResponse.json({ statusCode: 401, message: 'no refresh' }, { status: 401 }),
      ),
    );

    await expect(client.get('/protected')).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(onAuthLost).toHaveBeenCalledTimes(1);
  });

  it('does not retry refresh if the failing request itself is /auth/refresh (avoids loop)', async () => {
    const client = createApiClient();
    let refreshCalls = 0;
    server.use(
      http.post(`${API_BASE_URL}/auth/refresh`, () => {
        refreshCalls += 1;
        return HttpResponse.json({ statusCode: 401, message: 'nope' }, { status: 401 });
      }),
    );

    await expect(client.post('/auth/refresh')).rejects.toBeDefined();

    expect(refreshCalls).toBe(1);
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(onAuthLost).toHaveBeenCalledTimes(1);
  });

  it('concurrent 401s share a single in-flight refresh request', async () => {
    const client = createApiClient();
    let refreshCalls = 0;

    server.use(
      http.get(`${API_BASE_URL}/r1`, ({ request }) => {
        if (request.headers.get('authorization') === 'Bearer old-token') {
          return HttpResponse.json({}, { status: 401 });
        }
        return HttpResponse.json({ from: 'r1' });
      }),
      http.get(`${API_BASE_URL}/r2`, ({ request }) => {
        if (request.headers.get('authorization') === 'Bearer old-token') {
          return HttpResponse.json({}, { status: 401 });
        }
        return HttpResponse.json({ from: 'r2' });
      }),
      http.post(`${API_BASE_URL}/auth/refresh`, async () => {
        refreshCalls += 1;
        await new Promise((r) => setTimeout(r, 20));
        return HttpResponse.json({ accessToken: 'shared-fresh' });
      }),
    );

    const [a, b] = await Promise.all([client.get('/r1'), client.get('/r2')]);
    expect(refreshCalls).toBe(1);
    expect(a.data).toEqual({ from: 'r1' });
    expect(b.data).toEqual({ from: 'r2' });
  });
});
