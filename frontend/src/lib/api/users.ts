import { request } from './client';
import type { PageResponse, TaiKhoan, VaiTro } from '@/types/models';

export interface UpdateProfilePayload {
  hoTen?: string;
  email?: string;
  khoaBoMon?: string;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
}

export interface CreateUserPayload {
  tenDangNhap: string;
  matKhau: string;
  vaiTro: VaiTro;
  hoTen: string;
  email: string;
  khoaBoMon?: string;
}

export interface UpdateUserPayload {
  vaiTro?: VaiTro;
  trangThai?: number;
  hoTen?: string;
  email?: string;
}

interface ListUsersResponse {
  users: TaiKhoan[];
  total: number;
  page: number;
  limit: number;
}

export function getMe(): Promise<TaiKhoan> {
  return request<TaiKhoan>({
    method: 'GET',
    url: '/users/me',
  });
}

export function updateMe(payload: UpdateProfilePayload): Promise<TaiKhoan> {
  return request<TaiKhoan>({
    method: 'PATCH',
    url: '/users/me',
    data: payload,
  });
}

export async function listUsers(params: ListUsersParams = {}): Promise<PageResponse<TaiKhoan>> {
  const raw = await request<ListUsersResponse>({ method: 'GET', url: '/users', params });
  return {
    data: raw.users,
    total: raw.total,
    page: raw.page,
    limit: raw.limit,
  };
}

export function createUser(payload: CreateUserPayload): Promise<TaiKhoan> {
  return request<TaiKhoan>({ method: 'POST', url: '/users', data: payload });
}

export function updateUser(maTK: number, payload: UpdateUserPayload): Promise<TaiKhoan> {
  return request<TaiKhoan>({ method: 'PATCH', url: `/users/${maTK}`, data: payload });
}

export function deleteUser(maTK: number): Promise<{ message: string }> {
  return request<{ message: string }>({ method: 'DELETE', url: `/users/${maTK}` });
}
