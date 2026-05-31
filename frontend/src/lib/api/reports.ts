import { request } from './client';

export interface ExamsBySubjectRow {
  maMon: string;
  tenMon: string;
  soLuongDeThi: number;
  hocKy?: number;
}

export interface ResultsByClassRow {
  maLop: string;
  tenLop: string;
  maMon: string;
  tenMon: string;
  hocKy: number;
  siSo: number;
  soSVDiThi: number;
  diemTrungBinh: number;
  tiLeDat: number;
}

export function reportExamsBySubject(params: {
  namHoc: string;
  hocKy?: number;
}): Promise<ExamsBySubjectRow[]> {
  return request<ExamsBySubjectRow[]>({
    method: 'GET',
    url: '/reports/exams-by-subject',
    params,
  });
}

export function reportResultsByClass(params: {
  namHoc: string;
  hocKy?: number;
  maMon?: string;
}): Promise<ResultsByClassRow[]> {
  return request<ResultsByClassRow[]>({
    method: 'GET',
    url: '/reports/results-by-class',
    params,
  });
}

export type DashboardOverview =
  | {
      role: 'admin';
      studentCount: number;
      gradeCount: number;
      teacherCount: number;
      averageScore: number | null;
    }
  | {
      role: 'giaovien';
      studentCount: number;
      gradeCount: number;
      ownQuestionCount: number;
      ownExamCount: number;
      averageScore: number | null;
    };

export function reportsOverview(): Promise<DashboardOverview> {
  return request<DashboardOverview>({
    method: 'GET',
    url: '/reports/overview',
  });
}
