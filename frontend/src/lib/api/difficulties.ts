import { request } from './client';
import type { DoKho } from '@/types/models';

export interface CreateDifficultyPayload {
  tenDoKho: string;
}

export interface UpdateDifficultyPayload {
  tenDoKho?: string;
}

export function listDifficulties(): Promise<DoKho[]> {
  return request<DoKho[]>({ method: 'GET', url: '/difficulties' });
}

export function createDifficulty(payload: CreateDifficultyPayload): Promise<DoKho> {
  return request<DoKho>({ method: 'POST', url: '/difficulties', data: payload });
}

export function updateDifficulty(id: number, payload: UpdateDifficultyPayload): Promise<DoKho> {
  return request<DoKho>({ method: 'PATCH', url: `/difficulties/${id}`, data: payload });
}

export function deleteDifficulty(id: number): Promise<{ message: string }> {
  return request<{ message: string }>({ method: 'DELETE', url: `/difficulties/${id}` });
}
