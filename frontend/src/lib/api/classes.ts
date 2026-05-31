import { request } from './client';
import type { LopHoc, PageResponse, SinhVien } from '@/types/models';

export interface ListClassesParams {
  page?: number;
  limit?: number;
  search?: string;
  maMon?: string;
}

export interface CreateClassPayload {
  maLop: string;
  tenLop: string;
  maMon: string;
}

export interface UpdateClassPayload {
  tenLop?: string;
  maMon?: string;
}

export interface AddStudentPayload {
  maSV: string;
  hoTen: string;
}

export function listClasses(params: ListClassesParams = {}): Promise<PageResponse<LopHoc>> {
  return request<PageResponse<LopHoc>>({ method: 'GET', url: '/classes', params });
}

export function getClass(maLop: string): Promise<LopHoc> {
  return request<LopHoc>({ method: 'GET', url: `/classes/${maLop}` });
}

export function createClass(payload: CreateClassPayload): Promise<LopHoc> {
  return request<LopHoc>({ method: 'POST', url: '/classes', data: payload });
}

export function updateClass(maLop: string, payload: UpdateClassPayload): Promise<LopHoc> {
  return request<LopHoc>({ method: 'PATCH', url: `/classes/${maLop}`, data: payload });
}

export function deleteClass(maLop: string): Promise<{ message: string }> {
  return request<{ message: string }>({ method: 'DELETE', url: `/classes/${maLop}` });
}

export function addStudentToClass(maLop: string, payload: AddStudentPayload): Promise<SinhVien> {
  return request<SinhVien>({
    method: 'POST',
    url: `/classes/${maLop}/students`,
    data: payload,
  });
}

export function removeStudentFromClass(maLop: string, maSV: string): Promise<{ message: string }> {
  return request<{ message: string }>({
    method: 'DELETE',
    url: `/classes/${maLop}/students/${maSV}`,
  });
}
