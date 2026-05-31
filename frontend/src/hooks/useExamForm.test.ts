import { describe, expect, it } from 'vitest';
import { validateExam } from './useExamForm';

const LIMITS = { soCauToiDa: 5, thoiLuongMin: 30, thoiLuongMax: 180 };

describe('validateExam', () => {
  it('reports thoiLuong out-of-range', () => {
    const v = validateExam(
      { maMon: 'CSDL', hocKy: 1, namHoc: '2024-2025', thoiLuong: 10, chosenIds: [1] },
      LIMITS,
    );
    expect(v.thoiLuongValid).toBe(false);
    expect(v.thoiLuongMessage).toMatch(/30-180/);
    expect(v.ready).toBe(false);
  });

  it('reports thoiLuong above max', () => {
    const v = validateExam(
      { maMon: 'CSDL', hocKy: 1, namHoc: '2024-2025', thoiLuong: 200, chosenIds: [1] },
      LIMITS,
    );
    expect(v.thoiLuongValid).toBe(false);
  });

  it('reports countValid=false when 0 chosen', () => {
    const v = validateExam(
      { maMon: 'CSDL', hocKy: 1, namHoc: '2024-2025', thoiLuong: 90, chosenIds: [] },
      LIMITS,
    );
    expect(v.countValid).toBe(false);
    expect(v.countMessage).toMatch(/ít nhất 1/i);
    expect(v.ready).toBe(false);
  });

  it('reports countValid=false when exceeding SoCauToiDa', () => {
    const v = validateExam(
      {
        maMon: 'CSDL',
        hocKy: 1,
        namHoc: '2024-2025',
        thoiLuong: 90,
        chosenIds: [1, 2, 3, 4, 5, 6],
      },
      LIMITS,
    );
    expect(v.countValid).toBe(false);
    expect(v.countMessage).toMatch(/tối đa 5/);
  });

  it('reports namHoc invalid when not YYYY-YYYY', () => {
    const v = validateExam(
      { maMon: 'CSDL', hocKy: 1, namHoc: '2024', thoiLuong: 90, chosenIds: [1] },
      LIMITS,
    );
    expect(v.namHocValid).toBe(false);
    expect(v.ready).toBe(false);
  });

  it('reports maMon invalid when empty', () => {
    const v = validateExam(
      { maMon: '', hocKy: 1, namHoc: '2024-2025', thoiLuong: 90, chosenIds: [1] },
      LIMITS,
    );
    expect(v.maMonValid).toBe(false);
    expect(v.ready).toBe(false);
  });

  it('ready=true when all valid', () => {
    const v = validateExam(
      { maMon: 'CSDL', hocKy: 1, namHoc: '2024-2025', thoiLuong: 90, chosenIds: [1, 2] },
      LIMITS,
    );
    expect(v.ready).toBe(true);
  });
});
