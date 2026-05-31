import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { API_BASE_URL } from './client';
import { useAuthStore } from '@/lib/auth/store';
import { createQuestion, deleteQuestion, getQuestion, updateQuestion } from './questions';
import { createGrade, createGradesBatch, updateGrade, listGrades } from './grades';
import { exportExamDocx, exportExamPdf, exportGradesPdf } from './exports';
import { reportExamsBySubject, reportResultsByClass } from './reports';
import { getExam, deleteExam, createExam, updateExam } from './exams';

describe('thin api wrappers', () => {
  beforeEach(() => {
    useAuthStore.getState().setAccessToken('test-token');
  });
  afterEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('questions wrappers hit correct endpoints', async () => {
    const calls: Array<{ method: string; url: string; body?: unknown }> = [];
    server.use(
      http.get(`${API_BASE_URL}/questions/1`, () =>
        HttpResponse.json({ maCauHoi: 1, noiDung: 'q', maMon: 'CSDL', maDoKho: 1, maGV: 'GV01' }),
      ),
      http.post(`${API_BASE_URL}/questions`, async ({ request }) => {
        calls.push({ method: 'POST', url: '/questions', body: await request.json() });
        return HttpResponse.json({ maCauHoi: 99 });
      }),
      http.patch(`${API_BASE_URL}/questions/1`, async ({ request }) => {
        calls.push({ method: 'PATCH', url: '/questions/1', body: await request.json() });
        return HttpResponse.json({ maCauHoi: 1 });
      }),
      http.delete(`${API_BASE_URL}/questions/1`, () => HttpResponse.json({ message: 'ok' })),
    );

    const q = await getQuestion(1);
    expect(q.maCauHoi).toBe(1);
    await createQuestion({ noiDung: 'new', maMon: 'CSDL', maDoKho: 1 });
    await updateQuestion(1, { noiDung: 'edited' });
    const del = await deleteQuestion(1);
    expect(del.message).toBe('ok');
    expect(calls).toEqual([
      { method: 'POST', url: '/questions', body: { noiDung: 'new', maMon: 'CSDL', maDoKho: 1 } },
      { method: 'PATCH', url: '/questions/1', body: { noiDung: 'edited' } },
    ]);
  });

  it('grades wrappers hit correct endpoints', async () => {
    const calls: string[] = [];
    server.use(
      http.get(`${API_BASE_URL}/grades`, () =>
        HttpResponse.json({ data: [], total: 0, page: 1, limit: 10 }),
      ),
      http.post(`${API_BASE_URL}/grades`, async () => {
        calls.push('POST grades');
        return HttpResponse.json({ maBangDiem: 1 });
      }),
      http.patch(`${API_BASE_URL}/grades/1`, async () => {
        calls.push('PATCH grades/1');
        return HttpResponse.json({ maBangDiem: 1, diemSo: 9 });
      }),
      http.post(`${API_BASE_URL}/grades/batch`, async () => {
        calls.push('POST grades/batch');
        return HttpResponse.json({ count: 2, data: [] });
      }),
    );

    const list = await listGrades();
    expect(list.total).toBe(0);
    await createGrade({
      maSV: 'S1',
      maLop: 'C1',
      maDeThi: 1,
      hocKy: 1,
      namHoc: '2025-2026',
      diemSo: 8,
    });
    await updateGrade(1, { diemSo: 9 });
    await createGradesBatch({
      maLop: 'C1',
      maDeThi: 1,
      hocKy: 1,
      namHoc: '2025-2026',
      danhSachDiem: [
        { maSV: 'S1', diemSo: 8 },
        { maSV: 'S2', diemSo: 9 },
      ],
    });
    expect(calls).toEqual(['POST grades', 'PATCH grades/1', 'POST grades/batch']);
  });

  it('exam wrappers hit correct endpoints', async () => {
    const calls: string[] = [];
    server.use(
      http.get(`${API_BASE_URL}/exams/1`, () =>
        HttpResponse.json({
          maDeThi: 1,
          maMon: 'CSDL',
          hocKy: 1,
          namHoc: '2025-2026',
          thoiLuong: 60,
        }),
      ),
      http.post(`${API_BASE_URL}/exams`, async () => {
        calls.push('POST exams');
        return HttpResponse.json({ maDeThi: 9 });
      }),
      http.delete(`${API_BASE_URL}/exams/1`, () => HttpResponse.json({ message: 'ok' })),
      http.patch(`${API_BASE_URL}/exams/1`, async () => {
        calls.push('PATCH exams/1');
        return HttpResponse.json({ maDeThi: 1 });
      }),
    );

    const e = await getExam(1);
    expect(e.maDeThi).toBe(1);
    await createExam({
      maMon: 'CSDL',
      hocKy: 1,
      namHoc: '2025-2026',
      thoiLuong: 60,
      danhSachMaCauHoi: [1, 2],
    });
    await updateExam(1, { thoiLuong: 90 });
    const del = await deleteExam(1);
    expect(del.message).toBe('ok');
    expect(calls).toEqual(['POST exams', 'PATCH exams/1']);
  });

  it('export wrappers fetch blobs', async () => {
    const blob = (kind: string): Blob =>
      new Blob([`mock-${kind}`], { type: 'application/octet-stream' });
    server.use(
      http.get(`${API_BASE_URL}/export/exam/1/pdf`, async () => new HttpResponse(blob('pdf'))),
      http.get(`${API_BASE_URL}/export/exam/1/docx`, async () => new HttpResponse(blob('docx'))),
      http.get(`${API_BASE_URL}/export/grades/pdf`, async () => new HttpResponse(blob('grades'))),
    );

    const pdf = await exportExamPdf(1);
    expect(pdf).toBeInstanceOf(Blob);
    const docx = await exportExamDocx(1);
    expect(docx).toBeInstanceOf(Blob);
    const grades = await exportGradesPdf({ maLop: 'CS01', maDeThi: 1 });
    expect(grades).toBeInstanceOf(Blob);
  });

  it('report wrappers pass through filters', async () => {
    let lastSearch = '';
    server.use(
      http.get(`${API_BASE_URL}/reports/exams-by-subject`, ({ request }) => {
        lastSearch = new URL(request.url).search;
        return HttpResponse.json([{ maMon: 'CSDL', tenMon: 'CSDL', soLuongDeThi: 1, hocKy: 1 }]);
      }),
      http.get(`${API_BASE_URL}/reports/results-by-class`, ({ request }) => {
        lastSearch = new URL(request.url).search;
        return HttpResponse.json([
          {
            maLop: 'CS01',
            tenLop: 'C1',
            maMon: 'CSDL',
            tenMon: 'CSDL',
            siSo: 30,
            soSVDiThi: 28,
            diemTrungBinh: 7.5,
            tiLeDat: 0.9,
          },
        ]);
      }),
    );

    const a = await reportExamsBySubject({ namHoc: '2025-2026', hocKy: 1 });
    expect(a[0].maMon).toBe('CSDL');
    expect(lastSearch).toContain('namHoc=2025-2026');
    expect(lastSearch).toContain('hocKy=1');

    const b = await reportResultsByClass({ namHoc: '2025-2026', maMon: 'CSDL' });
    expect(b[0].maLop).toBe('CS01');
    expect(lastSearch).toContain('namHoc=2025-2026');
    expect(lastSearch).toContain('maMon=CSDL');
  });
});
