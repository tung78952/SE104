import { request } from './client';
import type { QuyDinh } from '@/types/models';

export interface CreateRegulationPayload {
  tenThamSo: string;
  giaTri: string;
  moTa?: string;
}

export interface UpdateRegulationPayload {
  giaTri: string;
}

export function listRegulations(): Promise<QuyDinh[]> {
  return request<QuyDinh[]>({ method: 'GET', url: '/regulations' });
}

export function createRegulation(payload: CreateRegulationPayload): Promise<QuyDinh> {
  return request<QuyDinh>({ method: 'POST', url: '/regulations', data: payload });
}

export function updateRegulation(
  tenThamSo: string,
  payload: UpdateRegulationPayload,
): Promise<QuyDinh> {
  return request<QuyDinh>({
    method: 'PATCH',
    url: `/regulations/${tenThamSo}`,
    data: payload,
  });
}
