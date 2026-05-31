import * as XLSX from 'xlsx';
import type { GradeCsvRow } from './csv';

export function gradesTemplateXlsx(students: { maSV: string; hoTen: string }[]): Blob {
  const rows = [
    ['maSV', 'hoTen', 'diemSo', 'ghiChu'],
    ...students.map((s) => [s.maSV, s.hoTen, '', '']),
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'BangDiem');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function parseGradesXlsx(buffer: ArrayBuffer): GradeCsvRow[] {
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
  const out: GradeCsvRow[] = [];
  for (const row of data) {
    const maSV = String(row['maSV'] ?? row['MSSV'] ?? '').trim();
    if (!maSV) continue;
    const entry: GradeCsvRow = { maSV };
    const diemSo = String(row['diemSo'] ?? row['diem'] ?? '').trim();
    if (diemSo) entry.diemSo = diemSo;
    const ghiChu = String(row['ghiChu'] ?? row['ghi chu'] ?? '').trim();
    if (ghiChu) entry.ghiChu = ghiChu;
    out.push(entry);
  }
  return out;
}
