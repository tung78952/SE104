// Minimal CSV parser supporting double-quoted fields with escaped quotes.
// Returns array of rows; each row is an array of string fields.
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      i++;
      continue;
    }
    if (ch === '\r') {
      i++;
      continue;
    }
    if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.length > 0));
}

export interface GradeCsvRow {
  maSV: string;
  diemSo?: string;
  ghiChu?: string;
}

// Parse a CSV with header row containing maSV (or MSSV), diemSo (or diem), ghiChu (optional)
export function parseGradesCsv(input: string): GradeCsvRow[] {
  const rows = parseCsv(input);
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const maSVIdx = header.findIndex((h) => h === 'masv' || h === 'mssv');
  const diemIdx = header.findIndex((h) => h === 'diemso' || h === 'diem');
  const ghiChuIdx = header.findIndex((h) => h === 'ghichu' || h === 'ghi chu');
  if (maSVIdx === -1) return [];
  const out: GradeCsvRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];
    const maSV = (cells[maSVIdx] ?? '').trim();
    if (!maSV) continue;
    const entry: GradeCsvRow = { maSV };
    if (diemIdx !== -1) {
      const v = (cells[diemIdx] ?? '').trim();
      if (v.length > 0) entry.diemSo = v;
    }
    if (ghiChuIdx !== -1) {
      const v = (cells[ghiChuIdx] ?? '').trim();
      if (v.length > 0) entry.ghiChu = v;
    }
    out.push(entry);
  }
  return out;
}

export function gradesTemplate(students: { maSV: string; hoTen: string }[]): string {
  const lines = ['maSV,hoTen,diemSo,ghiChu'];
  for (const s of students) {
    const safeName = s.hoTen.includes(',') ? `"${s.hoTen.replace(/"/g, '""')}"` : s.hoTen;
    lines.push(`${s.maSV},${safeName},,`);
  }
  return lines.join('\n');
}
