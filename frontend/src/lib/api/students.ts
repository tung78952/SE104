import { request } from './client';
import type { PageResponse, SinhVien } from '@/types/models';

export interface ListStudentsParams {
  page?: number;
  limit?: number;
  search?: string;
  maLop?: string;
}

export interface CreateStudentPayload {
  maSV: string;
  hoTen: string;
  maLop: string;
}

export interface UpdateStudentPayload {
  hoTen?: string;
  maLop?: string;
}

export function listStudents(params: ListStudentsParams = {}): Promise<PageResponse<SinhVien>> {
  return request<PageResponse<SinhVien>>({ method: 'GET', url: '/students', params });
}

export function createStudent(payload: CreateStudentPayload): Promise<SinhVien> {
  return request<SinhVien>({ method: 'POST', url: '/students', data: payload });
}

export function updateStudent(maSV: string, payload: UpdateStudentPayload): Promise<SinhVien> {
  return request<SinhVien>({ method: 'PATCH', url: `/students/${maSV}`, data: payload });
}

export function deleteStudent(maSV: string): Promise<{ message: string }> {
  return request<{ message: string }>({ method: 'DELETE', url: `/students/${maSV}` });
}
