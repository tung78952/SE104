import { describe, expect, it } from 'vitest';
import { changePasswordSchema, signinSchema, updateProfileSchema } from './auth';

describe('signinSchema', () => {
  it('accepts a valid payload', () => {
    const res = signinSchema.safeParse({ tenDangNhap: 'admin', matKhau: 'admin123' });
    expect(res.success).toBe(true);
  });

  it('rejects empty tenDangNhap', () => {
    const res = signinSchema.safeParse({ tenDangNhap: '', matKhau: 'admin123' });
    expect(res.success).toBe(false);
    if (!res.success) {
      const issue = res.error.issues.find((i) => i.path[0] === 'tenDangNhap');
      expect(issue?.message).toMatch(/tên đăng nhập/i);
    }
  });

  it('rejects whitespace-only tenDangNhap', () => {
    const res = signinSchema.safeParse({ tenDangNhap: '   ', matKhau: 'admin123' });
    expect(res.success).toBe(false);
  });

  it('rejects matKhau shorter than 6', () => {
    const res = signinSchema.safeParse({ tenDangNhap: 'admin', matKhau: '12345' });
    expect(res.success).toBe(false);
    if (!res.success) {
      const issue = res.error.issues.find((i) => i.path[0] === 'matKhau');
      expect(issue?.message).toMatch(/tối thiểu/i);
    }
  });

  it('rejects empty matKhau with required message', () => {
    const res = signinSchema.safeParse({ tenDangNhap: 'admin', matKhau: '' });
    expect(res.success).toBe(false);
    if (!res.success) {
      const issue = res.error.issues.find((i) => i.path[0] === 'matKhau');
      expect(issue?.message).toMatch(/nhập mật khẩu/i);
    }
  });
});

describe('changePasswordSchema', () => {
  it('accepts matching new + confirm passwords (>=8 chars)', () => {
    const res = changePasswordSchema.safeParse({
      matKhauCu: 'oldpass',
      matKhauMoi: 'newSecret9',
      xacNhanMatKhauMoi: 'newSecret9',
    });
    expect(res.success).toBe(true);
  });

  it('rejects when new password is too short', () => {
    const res = changePasswordSchema.safeParse({
      matKhauCu: 'oldpass',
      matKhauMoi: 'short',
      xacNhanMatKhauMoi: 'short',
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      const issue = res.error.issues.find((i) => i.path[0] === 'matKhauMoi');
      expect(issue?.message).toMatch(/tối thiểu 8/i);
    }
  });

  it('rejects when confirm does not match new password', () => {
    const res = changePasswordSchema.safeParse({
      matKhauCu: 'oldpass',
      matKhauMoi: 'newSecret9',
      xacNhanMatKhauMoi: 'differento',
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      const issue = res.error.issues.find((i) => i.path[0] === 'xacNhanMatKhauMoi');
      expect(issue?.message).toMatch(/không khớp/i);
    }
  });

  it('rejects when new password equals old password', () => {
    const res = changePasswordSchema.safeParse({
      matKhauCu: 'samePass1',
      matKhauMoi: 'samePass1',
      xacNhanMatKhauMoi: 'samePass1',
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      const issue = res.error.issues.find((i) => i.path[0] === 'matKhauMoi');
      expect(issue?.message).toMatch(/khác mật khẩu cũ/i);
    }
  });

  it('rejects when matKhauCu is empty', () => {
    const res = changePasswordSchema.safeParse({
      matKhauCu: '',
      matKhauMoi: 'newSecret9',
      xacNhanMatKhauMoi: 'newSecret9',
    });
    expect(res.success).toBe(false);
  });

  it('rejects when xacNhanMatKhauMoi is empty', () => {
    const res = changePasswordSchema.safeParse({
      matKhauCu: 'oldpass',
      matKhauMoi: 'newSecret9',
      xacNhanMatKhauMoi: '',
    });
    expect(res.success).toBe(false);
  });
});

describe('updateProfileSchema', () => {
  it('accepts a valid payload', () => {
    const res = updateProfileSchema.safeParse({
      hoTen: 'Nguyễn Văn A',
      email: 'a@uit.edu.vn',
      khoaBoMon: 'CNPM',
    });
    expect(res.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const res = updateProfileSchema.safeParse({
      hoTen: 'Nguyễn Văn A',
      email: 'not-an-email',
      khoaBoMon: '',
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      const issue = res.error.issues.find((i) => i.path[0] === 'email');
      expect(issue?.message).toMatch(/không hợp lệ/i);
    }
  });

  it('accepts empty khoaBoMon (optional)', () => {
    const res = updateProfileSchema.safeParse({
      hoTen: 'Nguyễn Văn A',
      email: 'a@uit.edu.vn',
      khoaBoMon: '',
    });
    expect(res.success).toBe(true);
  });

  it('rejects empty hoTen', () => {
    const res = updateProfileSchema.safeParse({
      hoTen: '   ',
      email: 'a@uit.edu.vn',
      khoaBoMon: '',
    });
    expect(res.success).toBe(false);
  });
});
