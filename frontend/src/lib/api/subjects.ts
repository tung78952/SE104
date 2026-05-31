import { request } from './client';
import type { MonHoc, PageResponse } from '@/types/models';

export interface ListSubjectsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateSubjectPayload {
  maMon: string;
  tenMon: string;
  soTinChi: number;
}

export interface UpdateSubjectPayload {
  tenMon?: string;
  soTinChi?: number;
}

export function listSubjects(params: ListSubjectsParams = {}): Promise<PageResponse<MonHoc>> {
  return request<PageResponse<MonHoc>>({
    method: 'GET',
    url: '/subjects',
    params,
  });
}

export function createSubject(payload: CreateSubjectPayload): Promise<MonHoc> {
  return request<MonHoc>({ method: 'POST', url: '/subjects', data: payload });
}

export function updateSubject(maMon: string, payload: UpdateSubjectPayload): Promise<MonHoc> {
  return request<MonHoc>({ method: 'PATCH', url: `/subjects/${maMon}`, data: payload });
}

export function deleteSubject(maMon: string): Promise<{ message: string }> {
  return request<{ message: string }>({ method: 'DELETE', url: `/subjects/${maMon}` });
}
