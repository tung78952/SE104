import { request } from './client';
import type { CauHoi, PageResponse } from '@/types/models';

export interface ListQuestionsParams {
  page?: number;
  limit?: number;
  maMon?: string;
  maDoKho?: number;
  keyword?: string;
}

export interface CreateQuestionPayload {
  noiDung: string;
  maMon: string;
  maDoKho: number;
}

export interface UpdateQuestionPayload {
  noiDung?: string;
  maMon?: string;
  maDoKho?: number;
}

export function listQuestions(params: ListQuestionsParams = {}): Promise<PageResponse<CauHoi>> {
  return request<PageResponse<CauHoi>>({
    method: 'GET',
    url: '/questions',
    params,
  });
}

export function getQuestion(id: number): Promise<CauHoi> {
  return request<CauHoi>({ method: 'GET', url: `/questions/${id}` });
}

export function createQuestion(payload: CreateQuestionPayload): Promise<CauHoi> {
  return request<CauHoi>({ method: 'POST', url: '/questions', data: payload });
}

export function updateQuestion(id: number, payload: UpdateQuestionPayload): Promise<CauHoi> {
  return request<CauHoi>({ method: 'PATCH', url: `/questions/${id}`, data: payload });
}

export function deleteQuestion(id: number): Promise<{ message: string }> {
  return request<{ message: string }>({ method: 'DELETE', url: `/questions/${id}` });
}
