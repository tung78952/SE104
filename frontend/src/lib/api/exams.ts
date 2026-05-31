import { request } from './client';
import type { DeThi, PageResponse } from '@/types/models';

export interface ListExamsParams {
  page?: number;
  limit?: number;
  maMon?: string;
  hocKy?: number;
  namHoc?: string;
}

export interface CreateExamPayload {
  hocKy: number;
  namHoc: string;
  thoiLuong: number;
  maMon: string;
  danhSachMaCauHoi: number[];
}

export interface UpdateExamPayload {
  hocKy?: number;
  namHoc?: string;
  thoiLuong?: number;
  danhSachMaCauHoi?: number[];
}

export function listExams(params: ListExamsParams = {}): Promise<PageResponse<DeThi>> {
  return request<PageResponse<DeThi>>({
    method: 'GET',
    url: '/exams',
    params,
  });
}

export function getExam(id: number): Promise<DeThi> {
  return request<DeThi>({ method: 'GET', url: `/exams/${id}` });
}

export function createExam(payload: CreateExamPayload): Promise<DeThi> {
  return request<DeThi>({ method: 'POST', url: '/exams', data: payload });
}

export function updateExam(id: number, payload: UpdateExamPayload): Promise<DeThi> {
  return request<DeThi>({ method: 'PATCH', url: `/exams/${id}`, data: payload });
}

export function deleteExam(id: number): Promise<{ message: string }> {
  return request<{ message: string }>({ method: 'DELETE', url: `/exams/${id}` });
}
