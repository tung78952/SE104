export type VaiTro = 'admin' | 'giaovien';

export interface GiangVien {
  maGV: string;
  hoTen: string;
  email: string;
  khoaBoMon: string | null;
}

export interface TaiKhoan {
  maTK: number;
  tenDangNhap: string;
  vaiTro: VaiTro;
  trangThai: number;
  maGV: string | null;
  giangVien?: GiangVien | null;
}

export interface MonHoc {
  maMon: string;
  tenMon: string;
  soTinChi: number;
}

export interface DoKho {
  maDoKho: number;
  tenDoKho: string;
}

export interface CauHoi {
  maCauHoi: number;
  noiDung: string;
  ngayTao: string;
  maMon: string;
  maDoKho: number;
  maGV: string;
  monHoc?: MonHoc;
  doKho?: DoKho;
  giangVien?: GiangVien;
}

export interface ChiTietDeThi {
  maDeThi: number;
  maCauHoi: number;
  soCau: number;
  cauHoi?: CauHoi;
}

export interface DeThi {
  maDeThi: number;
  hocKy: number;
  namHoc: string;
  thoiLuong: number;
  ngayTao: string;
  maMon: string;
  maGV: string;
  monHoc?: MonHoc;
  giangVien?: GiangVien;
  chiTietDeThis?: ChiTietDeThi[];
  _count?: { chiTietDeThis?: number };
}

export interface LopHoc {
  maLop: string;
  tenLop: string;
  maMon: string;
  monHoc?: MonHoc;
  sinhViens?: SinhVien[];
}

export interface SinhVien {
  maSV: string;
  hoTen: string;
  maLop: string;
  lopHoc?: LopHoc;
}

export interface BangDiem {
  maBangDiem: number;
  hocKy: number;
  namHoc: string;
  diemSo: number | string;
  ghiChu: string | null;
  maSV: string;
  maLop: string;
  maDeThi: number;
  sinhVien?: SinhVien;
  lopHoc?: LopHoc;
  deThi?: DeThi;
}

export interface QuyDinh {
  maQuyDinh: number;
  tenThamSo: string;
  giaTri: string;
  moTa: string | null;
  ngayCapNhat: string;
  maTKCapNhat: number;
  nguoiCapNhat?: Pick<TaiKhoan, 'maTK' | 'tenDangNhap'>;
}

export interface PageResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
