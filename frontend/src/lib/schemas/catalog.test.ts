import { describe, expect, it } from 'vitest';
import {
  subjectCreateSchema,
  classCreateSchema,
  studentCreateSchema,
  difficultySchema,
  regulationCreateSchema,
  regulationUpdateSchema,
  userCreateSchema,
} from './catalog';

describe('catalog schemas', () => {
  describe('subjectCreateSchema', () => {
    it('accepts valid input', () => {
      const r = subjectCreateSchema.safeParse({
        maMon: 'CSDL',
        tenMon: 'Cơ sở dữ liệu',
        soTinChi: 4,
      });
      expect(r.success).toBe(true);
    });
    it('rejects empty maMon', () => {
      const r = subjectCreateSchema.safeParse({ maMon: '', tenMon: 'X', soTinChi: 1 });
      expect(r.success).toBe(false);
    });
    it('rejects soTinChi < 1', () => {
      const r = subjectCreateSchema.safeParse({ maMon: 'X', tenMon: 'Y', soTinChi: 0 });
      expect(r.success).toBe(false);
    });
    it('rejects non-integer soTinChi', () => {
      const r = subjectCreateSchema.safeParse({ maMon: 'X', tenMon: 'Y', soTinChi: 2.5 });
      expect(r.success).toBe(false);
    });
  });

  describe('classCreateSchema', () => {
    it('accepts valid', () => {
      const r = classCreateSchema.safeParse({ maLop: 'CS01', tenLop: 'CSDL 01', maMon: 'CSDL' });
      expect(r.success).toBe(true);
    });
    it('rejects missing maMon', () => {
      const r = classCreateSchema.safeParse({ maLop: 'CS01', tenLop: 'X', maMon: '' });
      expect(r.success).toBe(false);
    });
  });

  describe('studentCreateSchema', () => {
    it('accepts valid', () => {
      const r = studentCreateSchema.safeParse({ maSV: '22520001', hoTen: 'A', maLop: 'CS01' });
      expect(r.success).toBe(true);
    });
    it('rejects too-long maSV', () => {
      const r = studentCreateSchema.safeParse({
        maSV: '12345678901',
        hoTen: 'A',
        maLop: 'CS01',
      });
      expect(r.success).toBe(false);
    });
  });

  describe('difficultySchema', () => {
    it('rejects empty tenDoKho', () => {
      const r = difficultySchema.safeParse({ tenDoKho: '' });
      expect(r.success).toBe(false);
    });
    it('accepts valid', () => {
      const r = difficultySchema.safeParse({ tenDoKho: 'Khó' });
      expect(r.success).toBe(true);
    });
  });

  describe('regulation schemas', () => {
    it('createSchema accepts valid', () => {
      const r = regulationCreateSchema.safeParse({ tenThamSo: 'X', giaTri: '1', moTa: '' });
      expect(r.success).toBe(true);
    });
    it('updateSchema requires giaTri', () => {
      const r = regulationUpdateSchema.safeParse({ giaTri: '' });
      expect(r.success).toBe(false);
    });
  });

  describe('userCreateSchema', () => {
    it('rejects invalid email', () => {
      const r = userCreateSchema.safeParse({
        tenDangNhap: 'u',
        matKhau: '123456',
        vaiTro: 'giaovien',
        hoTen: 'A',
        email: 'not-an-email',
      });
      expect(r.success).toBe(false);
    });
    it('rejects short password', () => {
      const r = userCreateSchema.safeParse({
        tenDangNhap: 'u',
        matKhau: '123',
        vaiTro: 'giaovien',
        hoTen: 'A',
        email: 'a@b.c',
      });
      expect(r.success).toBe(false);
    });
    it('accepts valid', () => {
      const r = userCreateSchema.safeParse({
        tenDangNhap: 'u',
        matKhau: '123456',
        vaiTro: 'admin',
        hoTen: 'A',
        email: 'a@b.com',
      });
      expect(r.success).toBe(true);
    });
  });
});
