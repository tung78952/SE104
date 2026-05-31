'use client';

import { useMemo, useState } from 'react';

export interface BatchGradeEntry {
  maSV: string;
  hoTen: string;
  diemSo: string; // string to allow empty input
  ghiChu: string;
}

export interface BatchSummary {
  total: number;
  filled: number;
  average: number | null;
  invalidCount: number;
}

function parseScore(raw: string): number | null {
  if (raw === '' || raw === undefined) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return n;
}

export interface BatchValidation {
  isFilled: boolean;
  isValid: boolean;
}

export function validateEntry(
  entry: BatchGradeEntry,
  limits: { diemMin: number; diemMax: number },
): BatchValidation {
  const n = parseScore(entry.diemSo);
  if (n === null) return { isFilled: false, isValid: true };
  return { isFilled: true, isValid: n >= limits.diemMin && n <= limits.diemMax };
}

export function buildSummary(
  entries: BatchGradeEntry[],
  limits: { diemMin: number; diemMax: number },
): BatchSummary {
  let filled = 0;
  let sum = 0;
  let invalid = 0;
  for (const e of entries) {
    const v = validateEntry(e, limits);
    if (v.isFilled) {
      filled += 1;
      if (v.isValid) sum += Number(e.diemSo);
      else invalid += 1;
    }
  }
  const validFilled = filled - invalid;
  return {
    total: entries.length,
    filled,
    average: validFilled > 0 ? Number((sum / validFilled).toFixed(2)) : null,
    invalidCount: invalid,
  };
}

export function buildPayloadEntries(
  entries: BatchGradeEntry[],
): { maSV: string; diemSo: number; ghiChu?: string }[] {
  const out: { maSV: string; diemSo: number; ghiChu?: string }[] = [];
  for (const e of entries) {
    const n = parseScore(e.diemSo);
    if (n === null) continue;
    out.push({
      maSV: e.maSV,
      diemSo: n,
      ghiChu: e.ghiChu.trim() ? e.ghiChu.trim() : undefined,
    });
  }
  return out;
}

interface UseBatchGradesOptions {
  limits: { diemMin: number; diemMax: number };
}

// Per-student inputs are stored as a sparse map keyed by maSV.
// Entries are derived by merging the students list with the overrides map,
// so changing `students` cleans up stale rows without a setState-in-effect.
type Override = { diemSo?: string; ghiChu?: string };

export function useBatchGrades(
  students: { maSV: string; hoTen: string }[],
  options: UseBatchGradesOptions,
) {
  const [overrides, setOverrides] = useState<Record<string, Override>>({});

  const entries = useMemo<BatchGradeEntry[]>(
    () =>
      students.map((s) => ({
        maSV: s.maSV,
        hoTen: s.hoTen,
        diemSo: overrides[s.maSV]?.diemSo ?? '',
        ghiChu: overrides[s.maSV]?.ghiChu ?? '',
      })),
    [students, overrides],
  );

  function setField(maSV: string, key: 'diemSo' | 'ghiChu', value: string): void {
    setOverrides((prev) => ({
      ...prev,
      [maSV]: { ...prev[maSV], [key]: value },
    }));
  }

  function applyImport(rows: { maSV: string; diemSo?: string; ghiChu?: string }[]): {
    matched: number;
    skipped: number;
  } {
    const studentIds = new Set(students.map((s) => s.maSV));
    let matched = 0;
    let skipped = 0;
    setOverrides((prev) => {
      const next: Record<string, Override> = { ...prev };
      for (const r of rows) {
        if (!studentIds.has(r.maSV)) {
          skipped += 1;
          continue;
        }
        matched += 1;
        next[r.maSV] = {
          ...next[r.maSV],
          ...(r.diemSo !== undefined ? { diemSo: r.diemSo } : {}),
          ...(r.ghiChu !== undefined ? { ghiChu: r.ghiChu } : {}),
        };
      }
      return next;
    });
    return { matched, skipped };
  }

  const summary = useMemo(() => buildSummary(entries, options.limits), [entries, options.limits]);

  return { entries, setField, applyImport, summary };
}
