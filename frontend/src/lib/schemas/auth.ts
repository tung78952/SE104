import { z } from 'zod';

export const signinSchema = z.object({
  tenDangNhap: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên đăng nhập')
    .max(50, 'Tên đăng nhập tối đa 50 ký tự'),
  matKhau: z.string().min(1, 'Vui lòng nhập mật khẩu').min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

export type SigninInput = z.infer<typeof signinSchema>;

export const changePasswordSchema = z
  .object({
    matKhauCu: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    matKhauMoi: z.string().min(8, 'Mật khẩu mới tối thiểu 8 ký tự'),
    xacNhanMatKhauMoi: z.string().min(1, 'Vui lòng nhập lại mật khẩu mới'),
  })
  .refine((data) => data.matKhauMoi === data.xacNhanMatKhauMoi, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['xacNhanMatKhauMoi'],
  })
  .refine((data) => data.matKhauCu !== data.matKhauMoi, {
    message: 'Mật khẩu mới phải khác mật khẩu cũ',
    path: ['matKhauMoi'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const updateProfileSchema = z.object({
  hoTen: z.string().trim().min(1, 'Vui lòng nhập họ tên').max(100, 'Họ tên tối đa 100 ký tự'),
  email: z.string().trim().min(1, 'Vui lòng nhập email').email('Email không hợp lệ'),
  khoaBoMon: z
    .string()
    .trim()
    .max(100, 'Khoa/Bộ môn tối đa 100 ký tự')
    .optional()
    .or(z.literal('')),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
