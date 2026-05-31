import { apiClient } from './client';

export async function exportExamPdf(maDeThi: number): Promise<Blob> {
  const res = await apiClient.request<Blob>({
    method: 'GET',
    url: `/export/exam/${maDeThi}/pdf`,
    responseType: 'blob',
  });
  return res.data;
}

export async function exportExamDocx(maDeThi: number): Promise<Blob> {
  const res = await apiClient.request<Blob>({
    method: 'GET',
    url: `/export/exam/${maDeThi}/docx`,
    responseType: 'blob',
  });
  return res.data;
}

export async function exportGradesPdf(params: { maLop: string; maDeThi: number }): Promise<Blob> {
  const res = await apiClient.request<Blob>({
    method: 'GET',
    url: '/export/grades/pdf',
    params,
    responseType: 'blob',
  });
  return res.data;
}
