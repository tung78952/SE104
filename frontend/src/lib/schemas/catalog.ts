import { z } from 'zod';

const required = (label: string): z.ZodString =>
  z
    .string({ message: `${label} không được để trống` })
    .trim()
    .min(1, `${label} không được để trống`);

// ─── Subjects ──────────────────────────────────────────────────────────────
export const subjectCreateSchema = z.object({
  maMon: required('Mã môn').max(10, 'Mã môn tối đa 10 ký tự'),
  tenMon: required('Tên môn').max(150, 'Tên môn tối đa 150 ký tự'),
  soTinChi: z
    .number({ message: 'Số tín chỉ phải là số' })
    .int('Số tín chỉ phải là số nguyên')
    .min(1, 'Số tín chỉ tối thiểu là 1'),
});
export type SubjectCreateInput = z.infer<typeof subjectCreateSchema>;

// ─── Classes ───────────────────────────────────────────────────────────────
export const classCreateSchema = z.object({
  maLop: required('Mã lớp').max(10, 'Mã lớp tối đa 10 ký tự'),
  tenLop: required('Tên lớp').max(100, 'Tên lớp tối đa 100 ký tự'),
  maMon: required('Mã môn').max(10),
});
export type ClassCreateInput = z.infer<typeof classCreateSchema>;

// ─── Students ──────────────────────────────────────────────────────────────
export const studentCreateSchema = z.object({
  maSV: required('Mã sinh viên').max(10, 'Mã sinh viên tối đa 10 ký tự'),
  hoTen: required('Họ tên').max(100, 'Họ tên tối đa 100 ký tự'),
  maLop: required('Mã lớp').max(10),
});
export type StudentCreateInput = z.infer<typeof studentCreateSchema>;

// SV thêm vào lớp (B3.1): chỉ cần maSV + hoTen
export const classStudentSchema = z.object({
  maSV: required('Mã sinh viên').max(10),
  hoTen: required('Họ tên').max(100),
});
export type ClassStudentInput = z.infer<typeof classStudentSchema>;

// ─── Difficulties ──────────────────────────────────────────────────────────
export const difficultySchema = z.object({
  tenDoKho: required('Tên độ khó').max(30, 'Tên độ khó tối đa 30 ký tự'),
});
export type DifficultyInput = z.infer<typeof difficultySchema>;

// ─── Regulations ───────────────────────────────────────────────────────────
export const regulationCreateSchema = z.object({
  tenThamSo: required('Tên tham số').max(50),
  giaTri: required('Giá trị').max(50),
  moTa: z.string().max(255).optional().or(z.literal('')),
});
export type RegulationCreateInput = z.infer<typeof regulationCreateSchema>;

export const regulationUpdateSchema = z.object({
  giaTri: required('Giá trị').max(50),
});

// ─── Users (admin) ─────────────────────────────────────────────────────────
export const userCreateSchema = z.object({
  tenDangNhap: required('Tên đăng nhập').max(50),
  matKhau: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  vaiTro: z.enum(['admin', 'giaovien'], { message: 'Vai trò không hợp lệ' }),
  hoTen: required('Họ tên').max(100),
  email: z.string().email('Email không hợp lệ'),
  khoaBoMon: z.string().max(100).optional().or(z.literal('')),
});
export type UserCreateInput = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = z.object({
  vaiTro: z.enum(['admin', 'giaovien']),
  trangThai: z.number().int().min(0).max(1),
  hoTen: required('Họ tên').max(100),
  email: z.string().email('Email không hợp lệ'),
});
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

// ─── Questions ─────────────────────────────────────────────────────────────
export const questionSchema = z.object({
  maMon: required('Môn học').max(10),
  maDoKho: z
    .number({ message: 'Độ khó là bắt buộc' })
    .int('Độ khó không hợp lệ')
    .min(1, 'Độ khó là bắt buộc'),
  noiDung: required('Nội dung').min(10, 'Nội dung tối thiểu 10 ký tự'),
});
export type QuestionInput = z.infer<typeof questionSchema>;

// ─── Grades ────────────────────────────────────────────────────────────────
const namHocPattern = /^\d{4}-\d{4}$/;
export const gradeCreateSchema = z.object({
  maSV: required('Mã sinh viên').max(10),
  maLop: required('Mã lớp').max(10),
  maDeThi: z.number({ message: 'Đề thi là bắt buộc' }).int().min(1, 'Đề thi là bắt buộc'),
  hocKy: z
    .number({ message: 'Học kỳ là bắt buộc' })
    .int()
    .min(1, 'Học kỳ phải từ 1-3')
    .max(3, 'Học kỳ phải từ 1-3'),
  namHoc: z
    .string({ message: 'Năm học là bắt buộc' })
    .regex(namHocPattern, 'Năm học phải có dạng YYYY-YYYY'),
  diemSo: z
    .number({ message: 'Điểm số là bắt buộc' })
    .min(0, 'Điểm tối thiểu là 0')
    .max(10, 'Điểm tối đa là 10'),
  ghiChu: z.string().max(255, 'Ghi chú tối đa 255 ký tự').optional().or(z.literal('')),
});
export type GradeCreateInput = z.infer<typeof gradeCreateSchema>;

export const gradeUpdateSchema = z.object({
  diemSo: z
    .number({ message: 'Điểm số là bắt buộc' })
    .min(0, 'Điểm tối thiểu là 0')
    .max(10, 'Điểm tối đa là 10'),
  hocKy: z
    .number({ message: 'Học kỳ là bắt buộc' })
    .int()
    .min(1, 'Học kỳ phải từ 1-3')
    .max(3, 'Học kỳ phải từ 1-3'),
  ghiChu: z.string().max(255, 'Ghi chú tối đa 255 ký tự').optional().or(z.literal('')),
});
export type GradeUpdateInput = z.infer<typeof gradeUpdateSchema>;
