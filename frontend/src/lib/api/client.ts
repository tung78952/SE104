import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/lib/auth/store';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshInflight: Promise<string | null> | null = null;

let onAuthLost: () => void = () => {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

function onForbidden(): void {
  if (typeof window !== 'undefined' && window.location.pathname !== '/403') {
    window.location.href = '/403';
  }
}

export function setAuthLostHandler(handler: () => void): () => void {
  const previous = onAuthLost;
  onAuthLost = handler;
  return () => {
    onAuthLost = previous;
  };
}

async function performRefresh(client: AxiosInstance): Promise<string | null> {
  try {
    const { data } = await client.post<{ accessToken: string }>('/auth/refresh');
    useAuthStore.getState().setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    useAuthStore.getState().clearAuth();
    onAuthLost();
    return null;
  }
}

function getOrStartRefresh(client: AxiosInstance): Promise<string | null> {
  if (!refreshInflight) {
    refreshInflight = performRefresh(client).finally(() => {
      refreshInflight = null;
    });
  }
  return refreshInflight;
}

export function createApiClient(baseURL: string = API_BASE_URL): AxiosInstance {
  const client = axios.create({
    baseURL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original = error.config as RetriableConfig | undefined;
      const status = error.response?.status;

      // 403 on a GET = the user navigated to a forbidden route.
      // Redirect to /403 so they see a clear error page.
      // Mutations (POST/PATCH/DELETE) propagate so pages can toast inline.
      if (status === 403 && original) {
        const method = (original.method ?? 'get').toLowerCase();
        if (method === 'get') {
          onForbidden();
        }
        return Promise.reject(error);
      }

      if (status !== 401 || !original || original._retry) {
        return Promise.reject(error);
      }

      const url = original.url ?? '';
      if (url.includes('/auth/refresh')) {
        if (refreshInflight === null) {
          useAuthStore.getState().clearAuth();
          onAuthLost();
        }
        return Promise.reject(error);
      }
      if (url.includes('/auth/signin')) {
        return Promise.reject(error);
      }

      original._retry = true;
      const newToken = await getOrStartRefresh(client);
      if (!newToken) {
        return Promise.reject(error);
      }

      original.headers.set('Authorization', `Bearer ${newToken}`);
      return client.request(original);
    },
  );

  return client;
}

export const apiClient = createApiClient();

export function request<T>(config: AxiosRequestConfig): Promise<T> {
  return apiClient.request<T>(config).then((r) => r.data);
}
