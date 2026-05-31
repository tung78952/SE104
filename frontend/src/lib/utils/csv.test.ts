import { describe, expect, it } from 'vitest';
import { parseCsv, parseGradesCsv, gradesTemplate } from './csv';

describe('parseCsv', () => {
  it('parses simple comma-separated rows', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('handles quoted fields with commas', () => {
    expect(parseCsv('a,"b,c",d\n1,2,3')).toEqual([
      ['a', 'b,c', 'd'],
      ['1', '2', '3'],
    ]);
  });

  it('handles escaped quotes inside quoted fields', () => {
    expect(parseCsv('"a""b",c')).toEqual([['a"b', 'c']]);
  });

  it('ignores fully-empty rows', () => {
    expect(parseCsv('a,b\n\n1,2\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
});

describe('parseGradesCsv', () => {
  it('parses grades using maSV/diemSo header', () => {
    const csv = 'maSV,diemSo,ghiChu\n22520001,8.5,\n22520002,6,Vắng\n';
    expect(parseGradesCsv(csv)).toEqual([
      { maSV: '22520001', diemSo: '8.5' },
      { maSV: '22520002', diemSo: '6', ghiChu: 'Vắng' },
    ]);
  });

  it('accepts MSSV/diem header aliases', () => {
    const csv = 'MSSV,diem\n22520001,7\n';
    expect(parseGradesCsv(csv)).toEqual([{ maSV: '22520001', diemSo: '7' }]);
  });

  it('skips rows with empty maSV', () => {
    const csv = 'maSV,diemSo\n22520001,8\n,5\n';
    expect(parseGradesCsv(csv)).toEqual([{ maSV: '22520001', diemSo: '8' }]);
  });

  it('returns [] if header has no maSV column', () => {
    const csv = 'foo,bar\n1,2\n';
    expect(parseGradesCsv(csv)).toEqual([]);
  });
});

describe('gradesTemplate', () => {
  it('produces a header + rows for each student', () => {
    const csv = gradesTemplate([
      { maSV: '22520001', hoTen: 'A' },
      { maSV: '22520002', hoTen: 'B, Đỗ' },
    ]);
    expect(csv.split('\n')).toEqual([
      'maSV,hoTen,diemSo,ghiChu',
      '22520001,A,,',
      '22520002,"B, Đỗ",,',
    ]);
  });
});
