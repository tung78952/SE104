import { request } from './client';

export interface SigninPayload {
  tenDangNhap: string;
  matKhau: string;
}

export interface SigninResponse {
  accessToken: string;
  userId: number;
}

export interface ChangePasswordPayload {
  matKhauCu: string;
  matKhauMoi: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface MessageResponse {
  message: string;
}

export function signin(payload: SigninPayload): Promise<SigninResponse> {
  return request<SigninResponse>({
    method: 'POST',
    url: '/auth/signin',
    data: payload,
  });
}

export function signout(): Promise<MessageResponse> {
  return request<MessageResponse>({
    method: 'POST',
    url: '/auth/signout',
  });
}

export function refresh(): Promise<RefreshResponse> {
  return request<RefreshResponse>({
    method: 'POST',
    url: '/auth/refresh',
  });
}

export function changePassword(payload: ChangePasswordPayload): Promise<MessageResponse> {
  return request<MessageResponse>({
    method: 'PATCH',
    url: '/auth/change-password',
    data: payload,
  });
}
