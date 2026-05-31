import { describe, expect, it } from 'vitest';
import {
  buildPayloadEntries,
  buildSummary,
  validateEntry,
  type BatchGradeEntry,
} from './useBatchGrades';

const LIMITS = { diemMin: 0, diemMax: 10 };

function entry(maSV: string, diemSo: string, ghiChu = ''): BatchGradeEntry {
  return { maSV, hoTen: `Tên ${maSV}`, diemSo, ghiChu };
}

describe('validateEntry', () => {
  it('marks empty score as not-filled, valid', () => {
    expect(validateEntry(entry('A', ''), LIMITS)).toEqual({ isFilled: false, isValid: true });
  });

  it('marks score in range as filled+valid', () => {
    expect(validateEntry(entry('A', '7.5'), LIMITS)).toEqual({ isFilled: true, isValid: true });
  });

  it('marks score below min as filled+invalid', () => {
    expect(validateEntry(entry('A', '-1'), LIMITS)).toEqual({ isFilled: true, isValid: false });
  });

  it('marks score above max as filled+invalid', () => {
    expect(validateEntry(entry('A', '11'), LIMITS)).toEqual({ isFilled: true, isValid: false });
  });
});

describe('buildSummary', () => {
  it('computes total/filled/average', () => {
    const entries = [entry('A', '8'), entry('B', ''), entry('C', '6'), entry('D', '7')];
    const s = buildSummary(entries, LIMITS);
    expect(s.total).toBe(4);
    expect(s.filled).toBe(3);
    expect(s.average).toBe(7);
    expect(s.invalidCount).toBe(0);
  });

  it('counts invalid entries and excludes them from average', () => {
    const entries = [entry('A', '8'), entry('B', '15'), entry('C', '6')];
    const s = buildSummary(entries, LIMITS);
    expect(s.filled).toBe(3);
    expect(s.invalidCount).toBe(1);
    expect(s.average).toBe(7); // (8+6)/2
  });

  it('returns null average when no valid filled entries', () => {
    const entries = [entry('A', ''), entry('B', '')];
    const s = buildSummary(entries, LIMITS);
    expect(s.average).toBeNull();
  });
});

describe('buildPayloadEntries', () => {
  it('returns only filled entries with parsed numeric diemSo', () => {
    const entries = [entry('A', '8.5', 'good'), entry('B', ''), entry('C', '6', '')];
    const payload = buildPayloadEntries(entries);
    expect(payload).toEqual([
      { maSV: 'A', diemSo: 8.5, ghiChu: 'good' },
      { maSV: 'C', diemSo: 6, ghiChu: undefined },
    ]);
  });
});
