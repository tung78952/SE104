import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '@/lib/auth/store';
import { listSubjects, createSubject, updateSubject, deleteSubject } from './subjects';
import {
  listClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass,
} from './classes';
import { listStudents, createStudent, updateStudent, deleteStudent } from './students';
import {
  listDifficulties,
  createDifficulty,
  updateDifficulty,
  deleteDifficulty,
} from './difficulties';
import { listRegulations, createRegulation, updateRegulation } from './regulations';
import { listUsers, createUser, updateUser, deleteUser } from './users';
import { setMockUser } from '@/mocks/handlers';

beforeEach(() => {
  useAuthStore.getState().setAccessToken('test-token');
  setMockUser('admin');
});

describe('subjects API', () => {
  it('list returns paginated data', async () => {
    const r = await listSubjects({ page: 1, limit: 10 });
    expect(r.data.length).toBeGreaterThan(0);
    expect(r.total).toBeGreaterThan(0);
  });
  it('create + update + delete round-trip', async () => {
    const created = await createSubject({ maMon: 'XX1', tenMon: 'X', soTinChi: 2 });
    expect(created.maMon).toBe('XX1');
    const updated = await updateSubject('XX1', { tenMon: 'Y' });
    expect(updated.tenMon).toBe('Y');
    const del = await deleteSubject('XX1');
    expect(del.message).toBeDefined();
  });
});

describe('classes API', () => {
  it('list + detail', async () => {
    const r = await listClasses({});
    expect(r.data.length).toBeGreaterThan(0);
    const detail = await getClass('CS01');
    expect(detail.maLop).toBe('CS01');
  });
  it('create + update + delete', async () => {
    const cls = await createClass({ maLop: 'C99', tenLop: 'T', maMon: 'CSDL' });
    expect(cls.maLop).toBe('C99');
    const up = await updateClass('C99', { tenLop: 'TT' });
    expect(up.tenLop).toBe('TT');
    await deleteClass('C99');
  });
  it('add/remove student to class', async () => {
    const sv = await addStudentToClass('CS01', { maSV: 'SV99', hoTen: 'A' });
    expect(sv.maSV).toBe('SV99');
    await removeStudentFromClass('CS01', 'SV99');
  });
});

describe('students API', () => {
  it('list + create + update + delete', async () => {
    const r = await listStudents({});
    expect(r.total).toBeGreaterThan(0);
    const sv = await createStudent({ maSV: 'NEW1', hoTen: 'N', maLop: 'CS01' });
    expect(sv.maSV).toBe('NEW1');
    const up = await updateStudent('NEW1', { hoTen: 'NN' });
    expect(up.hoTen).toBe('NN');
    await deleteStudent('NEW1');
  });
});

describe('difficulties API', () => {
  it('list + create + update + delete', async () => {
    const list = await listDifficulties();
    expect(list.length).toBeGreaterThan(0);
    const c = await createDifficulty({ tenDoKho: 'Cực khó' });
    const u = await updateDifficulty(c.maDoKho, { tenDoKho: 'Siêu khó' });
    expect(u.tenDoKho).toBe('Siêu khó');
    await deleteDifficulty(c.maDoKho);
  });
});

describe('regulations API', () => {
  it('list returns the default 5', async () => {
    const list = await listRegulations();
    expect(list.length).toBeGreaterThanOrEqual(5);
  });
  it('create + update', async () => {
    const r = await createRegulation({ tenThamSo: 'TestParam', giaTri: '1', moTa: 'm' });
    expect(r.tenThamSo).toBe('TestParam');
    const u = await updateRegulation('SoCauToiDa', { giaTri: '7' });
    expect(u.giaTri).toBe('7');
  });
});

describe('users API (admin)', () => {
  it('list + create + update + delete', async () => {
    const r = await listUsers({ page: 1, limit: 10 });
    expect(r.data.length).toBeGreaterThan(0);
    const created = await createUser({
      tenDangNhap: 'uniq_user',
      matKhau: '123456',
      vaiTro: 'giaovien',
      hoTen: 'X',
      email: 'x@y.com',
    });
    const u = await updateUser(created.maTK, {
      trangThai: 0,
      vaiTro: 'giaovien',
      hoTen: 'X',
      email: 'x@y.com',
    });
    expect(u.trangThai).toBe(0);
    await deleteUser(created.maTK);
  });
});
