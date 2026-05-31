import { request } from './client';
import type { BangDiem, PageResponse } from '@/types/models';

export interface ListGradesParams {
  page?: number;
  limit?: number;
  maLop?: string;
  maDeThi?: number;
  hocKy?: number;
  namHoc?: string;
}

export interface CreateGradePayload {
  maSV: string;
  maLop: string;
  maDeThi: number;
  hocKy: number;
  namHoc: string;
  diemSo: number;
  ghiChu?: string;
}

export interface UpdateGradePayload {
  diemSo?: number;
  ghiChu?: string;
}

interface GradeEntry {
  maSV: string;
  diemSo: number;
  ghiChu?: string;
}

export interface CreateGradesBatchPayload {
  maLop: string;
  maDeThi: number;
  hocKy: number;
  namHoc: string;
  danhSachDiem: GradeEntry[];
}

export interface GradesBatchResponse {
  count: number;
  data: BangDiem[];
}

export function listGrades(params: ListGradesParams = {}): Promise<PageResponse<BangDiem>> {
  return request<PageResponse<BangDiem>>({
    method: 'GET',
    url: '/grades',
    params,
  });
}

export function createGrade(payload: CreateGradePayload): Promise<BangDiem> {
  return request<BangDiem>({ method: 'POST', url: '/grades', data: payload });
}

export function updateGrade(id: number, payload: UpdateGradePayload): Promise<BangDiem> {
  return request<BangDiem>({ method: 'PATCH', url: `/grades/${id}`, data: payload });
}

export function createGradesBatch(payload: CreateGradesBatchPayload): Promise<GradesBatchResponse> {
  return request<GradesBatchResponse>({
    method: 'POST',
    url: '/grades/batch',
    data: payload,
  });
}
