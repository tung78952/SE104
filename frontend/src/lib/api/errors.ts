import axios, { type AxiosError } from 'axios';
import type { ApiError } from '@/types/models';

export function isAxiosError(err: unknown): err is AxiosError<ApiError> {
  return axios.isAxiosError(err);
}

export function getApiStatus(err: unknown): number | undefined {
  return isAxiosError(err) ? err.response?.status : undefined;
}

export function getApiMessage(err: unknown, fallback = 'Đã có lỗi xảy ra'): string {
  if (!isAxiosError(err)) {
    return fallback;
  }
  const data = err.response?.data;
  if (!data) {
    return fallback;
  }
  if (Array.isArray(data.message)) {
    return data.message.join(', ');
  }
  if (typeof data.message === 'string' && data.message.length > 0) {
    return data.message;
  }
  return fallback;
}
