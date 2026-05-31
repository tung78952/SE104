import { http, HttpResponse } from 'msw';
import type {
  BangDiem,
  CauHoi,
  ChiTietDeThi,
  DeThi,
  DoKho,
  GiangVien,
  LopHoc,
  MonHoc,
  QuyDinh,
  SinhVien,
  TaiKhoan,
} from '@/types/models';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';

const ADMIN_USER: TaiKhoan = {
  maTK: 1,
  tenDangNhap: 'admin',
  vaiTro: 'admin',
  trangThai: 1,
  maGV: null,
  giangVien: {
    maGV: 'AD01',
    hoTen: 'Nguyễn Minh Tuấn',
    email: 'tuan.nm@uit.edu.vn',
    khoaBoMon: 'Khoa Khoa học Máy tính',
  },
};

const GV_USER: TaiKhoan = {
  maTK: 2,
  tenDangNhap: 'gv_thien',
  vaiTro: 'giaovien',
  trangThai: 1,
  maGV: 'GV01',
  giangVien: {
    maGV: 'GV01',
    hoTen: 'Nguyễn Văn Thiện',
    email: 'thien@uit.edu.vn',
    khoaBoMon: 'CNPM',
  },
};

interface MockState {
  currentUser: TaiKhoan;
  passwordChanges: number;
  subjects: MonHoc[];
  classes: LopHoc[];
  students: SinhVien[];
  difficulties: DoKho[];
  regulations: QuyDinh[];
  users: TaiKhoan[];
  questions: CauHoi[];
  exams: DeThi[];
  examQuestions: ChiTietDeThi[];
  grades: BangDiem[];
  nextQuestionId: number;
  nextExamId: number;
  nextGradeId: number;
}

const INITIAL_SUBJECTS: MonHoc[] = [
  { maMon: 'CSDL', tenMon: 'Cơ sở dữ liệu', soTinChi: 4 },
  { maMon: 'MMT', tenMon: 'Mạng máy tính', soTinChi: 3 },
  { maMon: 'GT1', tenMon: 'Giải tích 1', soTinChi: 4 },
  { maMon: 'OOP', tenMon: 'Lập trình hướng đối tượng', soTinChi: 4 },
  { maMon: 'KTMT', tenMon: 'Kiến trúc máy tính', soTinChi: 3 },
  { maMon: 'DSA', tenMon: 'Cấu trúc dữ liệu & Giải thuật', soTinChi: 4 },
  { maMon: 'SE104', tenMon: 'Nhập môn Công nghệ Phần mềm', soTinChi: 3 },
  { maMon: 'TKHT', tenMon: 'Thiết kế hệ thống', soTinChi: 3 },
  { maMon: 'AI', tenMon: 'Trí tuệ nhân tạo', soTinChi: 4 },
  { maMon: 'ML', tenMon: 'Học máy', soTinChi: 4 },
  { maMon: 'TT', tenMon: 'Toán rời rạc', soTinChi: 3 },
  { maMon: 'WEB', tenMon: 'Lập trình Web', soTinChi: 3 },
];

const INITIAL_CLASSES: LopHoc[] = [
  { maLop: 'CS01', tenLop: 'CSDL - CTT2022', maMon: 'CSDL' },
  { maLop: 'CS02', tenLop: 'CSDL - CTT2023', maMon: 'CSDL' },
  { maLop: 'OOP01', tenLop: 'OOP - KHMT2023', maMon: 'OOP' },
];

const INITIAL_STUDENTS: SinhVien[] = [
  { maSV: '22520001', hoTen: 'Nguyễn Văn A', maLop: 'CS01' },
  { maSV: '22520002', hoTen: 'Trần Thị B', maLop: 'CS01' },
  { maSV: '22520003', hoTen: 'Lê Văn C', maLop: 'OOP01' },
];

const INITIAL_DIFFICULTIES: DoKho[] = [
  { maDoKho: 1, tenDoKho: 'Dễ' },
  { maDoKho: 2, tenDoKho: 'Trung Bình' },
  { maDoKho: 3, tenDoKho: 'Phức Tạp' },
  { maDoKho: 4, tenDoKho: 'Khó' },
];

const INITIAL_REGULATIONS: QuyDinh[] = [
  {
    maQuyDinh: 1,
    tenThamSo: 'SoCauToiDa',
    giaTri: '5',
    moTa: 'Số câu hỏi tối đa trong 1 đề thi',
    ngayCapNhat: '2026-01-01T00:00:00Z',
    maTKCapNhat: 1,
  },
  {
    maQuyDinh: 2,
    tenThamSo: 'ThoiLuongMin',
    giaTri: '30',
    moTa: 'Thời lượng thi tối thiểu (phút)',
    ngayCapNhat: '2026-01-01T00:00:00Z',
    maTKCapNhat: 1,
  },
  {
    maQuyDinh: 3,
    tenThamSo: 'ThoiLuongMax',
    giaTri: '180',
    moTa: 'Thời lượng thi tối đa (phút)',
    ngayCapNhat: '2026-01-01T00:00:00Z',
    maTKCapNhat: 1,
  },
  {
    maQuyDinh: 4,
    tenThamSo: 'DiemMin',
    giaTri: '0',
    moTa: 'Điểm số tối thiểu',
    ngayCapNhat: '2026-01-01T00:00:00Z',
    maTKCapNhat: 1,
  },
  {
    maQuyDinh: 5,
    tenThamSo: 'DiemMax',
    giaTri: '10',
    moTa: 'Điểm số tối đa',
    ngayCapNhat: '2026-01-01T00:00:00Z',
    maTKCapNhat: 1,
  },
];

const GV_HOA: GiangVien = {
  maGV: 'GV02',
  hoTen: 'Lê Thị Hoa',
  email: 'hoa.lt@uit.edu.vn',
  khoaBoMon: 'KHMT',
};

const GV_THIEN: GiangVien = {
  maGV: 'GV01',
  hoTen: 'Nguyễn Văn Thiện',
  email: 'thien@uit.edu.vn',
  khoaBoMon: 'CNPM',
};

const INITIAL_QUESTIONS: CauHoi[] = [
  {
    maCauHoi: 1,
    noiDung: 'Trình bày khái niệm chuẩn hoá 3NF trong CSDL quan hệ và cho ví dụ minh hoạ',
    ngayTao: '2026-05-17T09:00:00Z',
    maMon: 'CSDL',
    maDoKho: 2,
    maGV: 'GV01',
    monHoc: { maMon: 'CSDL', tenMon: 'Cơ sở dữ liệu', soTinChi: 4 },
    doKho: { maDoKho: 2, tenDoKho: 'Trung Bình' },
    giangVien: GV_THIEN,
  },
  {
    maCauHoi: 2,
    noiDung: 'Phân biệt khoá chính (Primary Key) và khoá ngoại (Foreign Key) trong CSDL',
    ngayTao: '2026-05-16T09:00:00Z',
    maMon: 'CSDL',
    maDoKho: 1,
    maGV: 'GV01',
    monHoc: { maMon: 'CSDL', tenMon: 'Cơ sở dữ liệu', soTinChi: 4 },
    doKho: { maDoKho: 1, tenDoKho: 'Dễ' },
    giangVien: GV_THIEN,
  },
  {
    maCauHoi: 3,
    noiDung: 'Viết câu truy vấn SQL JOIN 3 bảng và lọc theo điều kiện ngày tạo',
    ngayTao: '2026-05-15T09:00:00Z',
    maMon: 'CSDL',
    maDoKho: 3,
    maGV: 'GV01',
    monHoc: { maMon: 'CSDL', tenMon: 'Cơ sở dữ liệu', soTinChi: 4 },
    doKho: { maDoKho: 3, tenDoKho: 'Phức Tạp' },
    giangVien: GV_THIEN,
  },
  {
    maCauHoi: 4,
    noiDung: 'Phân biệt giao thức TCP và UDP trong tầng vận chuyển của mô hình OSI',
    ngayTao: '2026-05-14T09:00:00Z',
    maMon: 'MMT',
    maDoKho: 1,
    maGV: 'GV02',
    monHoc: { maMon: 'MMT', tenMon: 'Mạng máy tính', soTinChi: 3 },
    doKho: { maDoKho: 1, tenDoKho: 'Dễ' },
    giangVien: GV_HOA,
  },
];

const INITIAL_USERS: TaiKhoan[] = [
  ADMIN_USER,
  GV_USER,
  {
    maTK: 3,
    tenDangNhap: 'gv_hoa',
    vaiTro: 'giaovien',
    trangThai: 0,
    maGV: 'GV02',
    giangVien: {
      maGV: 'GV02',
      hoTen: 'Lê Thị Hoa',
      email: 'hoa.lt@uit.edu.vn',
      khoaBoMon: 'KHMT',
    },
  },
];

const INITIAL_EXAMS: DeThi[] = [
  {
    maDeThi: 58,
    hocKy: 1,
    namHoc: '2024-2025',
    thoiLuong: 90,
    ngayTao: '2026-05-17T08:00:00Z',
    maMon: 'CSDL',
    maGV: 'GV02',
    monHoc: { maMon: 'CSDL', tenMon: 'Cơ sở dữ liệu', soTinChi: 4 },
    giangVien: GV_HOA,
  },
];

const state: MockState = {
  currentUser: ADMIN_USER,
  passwordChanges: 0,
  subjects: [...INITIAL_SUBJECTS],
  classes: [...INITIAL_CLASSES],
  students: [...INITIAL_STUDENTS],
  difficulties: [...INITIAL_DIFFICULTIES],
  regulations: [...INITIAL_REGULATIONS],
  users: INITIAL_USERS.map((u) => ({ ...u })),
  questions: INITIAL_QUESTIONS.map((q) => ({ ...q })),
  exams: INITIAL_EXAMS.map((e) => ({ ...e })),
  examQuestions: [],
  grades: [],
  nextQuestionId: 100,
  nextExamId: 100,
  nextGradeId: 1,
};

export function resetMockState(): void {
  state.currentUser = { ...ADMIN_USER };
  state.passwordChanges = 0;
  state.subjects = [...INITIAL_SUBJECTS];
  state.classes = [...INITIAL_CLASSES];
  state.students = [...INITIAL_STUDENTS];
  state.difficulties = [...INITIAL_DIFFICULTIES];
  state.regulations = [...INITIAL_REGULATIONS];
  state.users = INITIAL_USERS.map((u) => ({ ...u }));
  state.questions = INITIAL_QUESTIONS.map((q) => ({ ...q }));
  state.exams = INITIAL_EXAMS.map((e) => ({ ...e }));
  state.examQuestions = [];
  state.grades = [];
  state.nextQuestionId = 100;
  state.nextExamId = 100;
  state.nextGradeId = 1;
}

export function setMockUser(role: 'admin' | 'giaovien'): void {
  state.currentUser = role === 'admin' ? { ...ADMIN_USER } : { ...GV_USER };
}

function requireAuth(request: Request): Response | null {
  const auth = request.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ')) {
    return HttpResponse.json(
      { statusCode: 401, message: 'Thiếu access token', error: 'Unauthorized' },
      { status: 401 },
    );
  }
  return null;
}

function paginate<T>(items: T[], page: number, limit: number): { data: T[]; total: number } {
  const total = items.length;
  const start = (page - 1) * limit;
  return { data: items.slice(start, start + limit), total };
}

export const handlers = [
  // ─── Auth ────────────────────────────────────────────────────────────────
  http.post(`${API}/auth/signin`, async ({ request }) => {
    const body = (await request.json()) as { tenDangNhap?: string; matKhau?: string };
    if (body.matKhau === 'wrongpw') {
      return HttpResponse.json(
        { statusCode: 401, message: 'Mật khẩu không đúng', error: 'Unauthorized' },
        { status: 401 },
      );
    }
    if (body.tenDangNhap === 'admin' && body.matKhau === 'admin123') {
      state.currentUser = ADMIN_USER;
      return HttpResponse.json({ accessToken: 'mock-admin-token', userId: 1 });
    }
    if (body.tenDangNhap === 'gv_thien' && body.matKhau === '123456') {
      state.currentUser = GV_USER;
      return HttpResponse.json({ accessToken: 'mock-gv-token', userId: 2 });
    }
    return HttpResponse.json(
      {
        statusCode: 401,
        message: 'Tên đăng nhập hoặc mật khẩu không đúng',
        error: 'Unauthorized',
      },
      { status: 401 },
    );
  }),

  http.post(`${API}/auth/refresh`, () =>
    HttpResponse.json({ accessToken: 'mock-refreshed-token' }),
  ),

  http.post(`${API}/auth/signout`, () => HttpResponse.json({ message: 'Đăng xuất thành công' })),

  http.patch(`${API}/auth/change-password`, async ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    const body = (await request.json()) as { matKhauCu?: string; matKhauMoi?: string };
    if (!body.matKhauCu || !body.matKhauMoi) {
      return HttpResponse.json(
        { statusCode: 400, message: 'Dữ liệu không hợp lệ', error: 'Bad Request' },
        { status: 400 },
      );
    }
    if (body.matKhauCu !== 'admin123' && body.matKhauCu !== '123456') {
      return HttpResponse.json(
        {
          statusCode: 400,
          message: 'Mật khẩu cũ không chính xác',
          error: 'Bad Request',
        },
        { status: 400 },
      );
    }
    if (body.matKhauMoi.length < 6) {
      return HttpResponse.json(
        { statusCode: 400, message: 'Mật khẩu mới quá ngắn', error: 'Bad Request' },
        { status: 400 },
      );
    }
    state.passwordChanges += 1;
    return HttpResponse.json({ message: 'Đổi mật khẩu thành công' });
  }),

  // ─── Users ───────────────────────────────────────────────────────────────
  http.get(`${API}/users/me`, ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    return HttpResponse.json(state.currentUser);
  }),

  http.patch(`${API}/users/me`, async ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    const body = (await request.json()) as {
      hoTen?: string;
      email?: string;
      khoaBoMon?: string;
    };
    const next: TaiKhoan = {
      ...state.currentUser,
      giangVien: state.currentUser.giangVien
        ? {
            ...state.currentUser.giangVien,
            hoTen: body.hoTen ?? state.currentUser.giangVien.hoTen,
            email: body.email ?? state.currentUser.giangVien.email,
            khoaBoMon: body.khoaBoMon ?? state.currentUser.giangVien.khoaBoMon,
          }
        : null,
    };
    state.currentUser = next;
    return HttpResponse.json(next);
  }),

  http.get(`${API}/users`, ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'admin') {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ admin được phép', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '10');
    const { data, total } = paginate(state.users, page, limit);
    return HttpResponse.json({ users: data, total, page, limit });
  }),

  http.post(`${API}/users`, async ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'admin') {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ admin được phép', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const body = (await request.json()) as {
      tenDangNhap: string;
      matKhau: string;
      vaiTro: 'admin' | 'giaovien';
      hoTen: string;
      email: string;
      khoaBoMon?: string;
    };
    if (state.users.some((u) => u.tenDangNhap === body.tenDangNhap)) {
      return HttpResponse.json(
        { statusCode: 409, message: 'Tên đăng nhập đã tồn tại', error: 'Conflict' },
        { status: 409 },
      );
    }
    const nextId = Math.max(0, ...state.users.map((u) => u.maTK)) + 1;
    const isGV = body.vaiTro === 'giaovien';
    const maGV = isGV
      ? `GV${String(state.users.filter((u) => u.vaiTro === 'giaovien').length + 1).padStart(2, '0')}`
      : null;
    const created: TaiKhoan = {
      maTK: nextId,
      tenDangNhap: body.tenDangNhap,
      vaiTro: body.vaiTro,
      trangThai: 1,
      maGV,
      giangVien: maGV
        ? {
            maGV,
            hoTen: body.hoTen,
            email: body.email,
            khoaBoMon: body.khoaBoMon ?? null,
          }
        : null,
    };
    state.users.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch(`${API}/users/:maTK`, async ({ request, params }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'admin') {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ admin được phép', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const id = Number(params.maTK);
    const idx = state.users.findIndex((u) => u.maTK === id);
    if (idx === -1) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Không tìm thấy', error: 'Not Found' },
        { status: 404 },
      );
    }
    const body = (await request.json()) as Partial<TaiKhoan> & { hoTen?: string; email?: string };
    const next: TaiKhoan = {
      ...state.users[idx],
      ...('vaiTro' in body && body.vaiTro ? { vaiTro: body.vaiTro } : {}),
      ...('trangThai' in body && typeof body.trangThai === 'number'
        ? { trangThai: body.trangThai }
        : {}),
      giangVien: state.users[idx].giangVien
        ? {
            ...state.users[idx].giangVien,
            hoTen: body.hoTen ?? state.users[idx].giangVien!.hoTen,
            email: body.email ?? state.users[idx].giangVien!.email,
          }
        : null,
    };
    state.users[idx] = next;
    return HttpResponse.json(next);
  }),

  http.delete(`${API}/users/:maTK`, ({ request, params }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'admin') {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ admin được phép', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const id = Number(params.maTK);
    const before = state.users.length;
    state.users = state.users.filter((u) => u.maTK !== id);
    if (state.users.length === before) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Không tìm thấy', error: 'Not Found' },
        { status: 404 },
      );
    }
    return HttpResponse.json({ message: 'Đã xoá' });
  }),

  // ─── Subjects ────────────────────────────────────────────────────────────
  http.get(`${API}/subjects`, ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '10');
    const search = (url.searchParams.get('search') ?? '').toLowerCase();
    const filtered = search
      ? state.subjects.filter(
          (s) => s.maMon.toLowerCase().includes(search) || s.tenMon.toLowerCase().includes(search),
        )
      : state.subjects;
    const { data, total } = paginate(filtered, page, limit);
    return HttpResponse.json({ data, total, page, limit });
  }),

  http.post(`${API}/subjects`, async ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'admin') {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ admin được phép', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const body = (await request.json()) as MonHoc;
    if (state.subjects.some((s) => s.maMon === body.maMon)) {
      return HttpResponse.json(
        { statusCode: 409, message: 'Mã môn đã tồn tại', error: 'Conflict' },
        { status: 409 },
      );
    }
    state.subjects.unshift(body);
    return HttpResponse.json(body, { status: 201 });
  }),

  http.patch(`${API}/subjects/:maMon`, async ({ request, params }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'admin') {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ admin được phép', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const maMon = String(params.maMon);
    const idx = state.subjects.findIndex((s) => s.maMon === maMon);
    if (idx === -1) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Không tìm thấy môn', error: 'Not Found' },
        { status: 404 },
      );
    }
    const body = (await request.json()) as Partial<MonHoc>;
    state.subjects[idx] = { ...state.subjects[idx], ...body };
    return HttpResponse.json(state.subjects[idx]);
  }),

  http.delete(`${API}/subjects/:maMon`, ({ request, params }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'admin') {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ admin được phép', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const maMon = String(params.maMon);
    const before = state.subjects.length;
    state.subjects = state.subjects.filter((s) => s.maMon !== maMon);
    if (state.subjects.length === before) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Không tìm thấy môn', error: 'Not Found' },
        { status: 404 },
      );
    }
    return HttpResponse.json({ message: 'Đã xoá' });
  }),

  // ─── Classes ─────────────────────────────────────────────────────────────
  http.get(`${API}/classes`, ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '10');
    const search = (url.searchParams.get('search') ?? '').toLowerCase();
    const maMon = url.searchParams.get('maMon') ?? '';
    let list = state.classes;
    if (maMon) list = list.filter((c) => c.maMon === maMon);
    if (search) {
      list = list.filter(
        (c) => c.maLop.toLowerCase().includes(search) || c.tenLop.toLowerCase().includes(search),
      );
    }
    const withMon = list.map((c) => ({
      ...c,
      monHoc: state.subjects.find((s) => s.maMon === c.maMon),
    }));
    const { data, total } = paginate(withMon, page, limit);
    return HttpResponse.json({ data, total, page, limit });
  }),

  http.get(`${API}/classes/:maLop`, ({ request, params }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    const maLop = String(params.maLop);
    const cls = state.classes.find((c) => c.maLop === maLop);
    if (!cls) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Không tìm thấy lớp', error: 'Not Found' },
        { status: 404 },
      );
    }
    const monHoc = state.subjects.find((s) => s.maMon === cls.maMon);
    const sinhViens = state.students.filter((sv) => sv.maLop === maLop);
    return HttpResponse.json({ ...cls, monHoc, sinhViens });
  }),

  http.post(`${API}/classes`, async ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'admin') {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ admin được phép', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const body = (await request.json()) as LopHoc;
    if (state.classes.some((c) => c.maLop === body.maLop)) {
      return HttpResponse.json(
        { statusCode: 409, message: 'Mã lớp đã tồn tại', error: 'Conflict' },
        { status: 409 },
      );
    }
    if (!state.subjects.some((s) => s.maMon === body.maMon)) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Môn học không tồn tại', error: 'Not Found' },
        { status: 404 },
      );
    }
    state.classes.unshift(body);
    return HttpResponse.json(body, { status: 201 });
  }),

  http.patch(`${API}/classes/:maLop`, async ({ request, params }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'admin') {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ admin được phép', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const maLop = String(params.maLop);
    const idx = state.classes.findIndex((c) => c.maLop === maLop);
    if (idx === -1) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Không tìm thấy lớp', error: 'Not Found' },
        { status: 404 },
      );
    }
    const body = (await request.json()) as Partial<LopHoc>;
    state.classes[idx] = { ...state.classes[idx], ...body };
    return HttpResponse.json(state.classes[idx]);
  }),

  http.delete(`${API}/classes/:maLop`, ({ request, params }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'admin') {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ admin được phép', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const maLop = String(params.maLop);
    const before = state.classes.length;
    state.classes = state.classes.filter((c) => c.maLop !== maLop);
    state.students = state.students.filter((sv) => sv.maLop !== maLop);
    if (state.classes.length === before) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Không tìm thấy lớp', error: 'Not Found' },
        { status: 404 },
      );
    }
    return HttpResponse.json({ message: 'Đã xoá' });
  }),

  http.post(`${API}/classes/:maLop/students`, async ({ request, params }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'admin') {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ admin được phép', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const maLop = String(params.maLop);
    if (!state.classes.some((c) => c.maLop === maLop)) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Không tìm thấy lớp', error: 'Not Found' },
        { status: 404 },
      );
    }
    const body = (await request.json()) as { maSV: string; hoTen: string };
    if (state.students.some((sv) => sv.maSV === body.maSV)) {
      return HttpResponse.json(
        { statusCode: 409, message: 'Mã SV đã tồn tại', error: 'Conflict' },
        { status: 409 },
      );
    }
    const created: SinhVien = { ...body, maLop };
    state.students.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.delete(`${API}/classes/:maLop/students/:maSV`, ({ request, params }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'admin') {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ admin được phép', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const maLop = String(params.maLop);
    const maSV = String(params.maSV);
    const before = state.students.length;
    state.students = state.students.filter((sv) => !(sv.maLop === maLop && sv.maSV === maSV));
    if (state.students.length === before) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Không tìm thấy SV', error: 'Not Found' },
        { status: 404 },
      );
    }
    return HttpResponse.json({ message: 'Đã xoá' });
  }),

  // ─── Students ────────────────────────────────────────────────────────────
  http.get(`${API}/students`, ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '10');
    const search = (url.searchParams.get('search') ?? '').toLowerCase();
    const maLop = url.searchParams.get('maLop') ?? '';
    let list = state.students;
    if (maLop) list = list.filter((sv) => sv.maLop === maLop);
    if (search) {
      list = list.filter(
        (sv) => sv.maSV.toLowerCase().includes(search) || sv.hoTen.toLowerCase().includes(search),
      );
    }
    const withLop = list.map((sv) => ({
      ...sv,
      lopHoc: state.classes.find((c) => c.maLop === sv.maLop),
    }));
    const { data, total } = paginate(withLop, page, limit);
    return HttpResponse.json({ data, total, page, limit });
  }),

  http.post(`${API}/students`, async ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'admin') {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ admin được phép', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const body = (await request.json()) as SinhVien;
    if (state.students.some((sv) => sv.maSV === body.maSV)) {
      return HttpResponse.json(
        { statusCode: 409, message: 'Mã SV đã tồn tại', error: 'Conflict' },
        { status: 409 },
      );
    }
    if (!state.classes.some((c) => c.maLop === body.maLop)) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Lớp không tồn tại', error: 'Not Found' },
        { status: 404 },
      );
    }
    state.students.push(body);
    return HttpResponse.json(body, { status: 201 });
  }),

  http.patch(`${API}/students/:maSV`, async ({ request, params }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'admin') {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ admin được phép', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const maSV = String(params.maSV);
    const idx = state.students.findIndex((sv) => sv.maSV === maSV);
    if (idx === -1) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Không tìm thấy SV', error: 'Not Found' },
        { status: 404 },
      );
    }
    const body = (await request.json()) as Partial<SinhVien>;
    state.students[idx] = { ...state.students[idx], ...body };
    return HttpResponse.json(state.students[idx]);
  }),

  http.delete(`${API}/students/:maSV`, ({ request, params }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'admin') {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ admin được phép', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const maSV = String(params.maSV);
    const before = state.students.length;
    state.students = state.students.filter((sv) => sv.maSV !== maSV);
    if (state.students.length === before) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Không tìm thấy SV', error: 'Not Found' },
        { status: 404 },
      );
    }
    return HttpResponse.json({ message: 'Đã xoá' });
  }),

  // ─── Difficulties ───────────────────────────────────────────────────────
  http.get(`${API}/difficulties`, ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    return HttpResponse.json(state.difficulties);
  }),

  http.post(`${API}/difficulties`, async ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'admin') {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ admin được phép', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const body = (await request.json()) as { tenDoKho: string };
    const nextId = Math.max(0, ...state.difficulties.map((d) => d.maDoKho)) + 1;
    const created: DoKho = { maDoKho: nextId, tenDoKho: body.tenDoKho };
    state.difficulties.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch(`${API}/difficulties/:id`, async ({ request, params }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'admin') {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ admin được phép', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const id = Number(params.id);
    const idx = state.difficulties.findIndex((d) => d.maDoKho === id);
    if (idx === -1) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Không tìm thấy', error: 'Not Found' },
        { status: 404 },
      );
    }
    const body = (await request.json()) as { tenDoKho?: string };
    state.difficulties[idx] = { ...state.difficulties[idx], ...body };
    return HttpResponse.json(state.difficulties[idx]);
  }),

  http.delete(`${API}/difficulties/:id`, ({ request, params }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'admin') {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ admin được phép', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const id = Number(params.id);
    const before = state.difficulties.length;
    state.difficulties = state.difficulties.filter((d) => d.maDoKho !== id);
    if (state.difficulties.length === before) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Không tìm thấy', error: 'Not Found' },
        { status: 404 },
      );
    }
    return HttpResponse.json({ message: 'Đã xoá' });
  }),

  // ─── Regulations ────────────────────────────────────────────────────────
  http.get(`${API}/regulations`, ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    return HttpResponse.json(state.regulations);
  }),

  http.post(`${API}/regulations`, async ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'admin') {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ admin được phép', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const body = (await request.json()) as { tenThamSo: string; giaTri: string; moTa?: string };
    if (state.regulations.some((r) => r.tenThamSo === body.tenThamSo)) {
      return HttpResponse.json(
        { statusCode: 409, message: 'Tham số đã tồn tại', error: 'Conflict' },
        { status: 409 },
      );
    }
    const nextId = Math.max(0, ...state.regulations.map((r) => r.maQuyDinh)) + 1;
    const created: QuyDinh = {
      maQuyDinh: nextId,
      tenThamSo: body.tenThamSo,
      giaTri: body.giaTri,
      moTa: body.moTa ?? null,
      ngayCapNhat: new Date().toISOString(),
      maTKCapNhat: state.currentUser.maTK,
    };
    state.regulations.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch(`${API}/regulations/:tenThamSo`, async ({ request, params }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'admin') {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ admin được phép', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const tenThamSo = String(params.tenThamSo);
    const idx = state.regulations.findIndex((r) => r.tenThamSo === tenThamSo);
    if (idx === -1) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Không tìm thấy quy định', error: 'Not Found' },
        { status: 404 },
      );
    }
    const body = (await request.json()) as { giaTri: string };
    state.regulations[idx] = {
      ...state.regulations[idx],
      giaTri: body.giaTri,
      ngayCapNhat: new Date().toISOString(),
      maTKCapNhat: state.currentUser.maTK,
    };
    return HttpResponse.json(state.regulations[idx]);
  }),

  // ─── Questions ───────────────────────────────────────────────────────────
  http.get(`${API}/questions`, ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '10');
    const maMon = url.searchParams.get('maMon') ?? '';
    const maDoKho = url.searchParams.get('maDoKho') ?? '';
    const keyword = (url.searchParams.get('keyword') ?? '').toLowerCase();
    let list = [...state.questions];
    if (maMon) list = list.filter((q) => q.maMon === maMon);
    if (maDoKho) list = list.filter((q) => q.maDoKho === Number(maDoKho));
    if (keyword) list = list.filter((q) => q.noiDung.toLowerCase().includes(keyword));
    list.sort((a, b) => b.maCauHoi - a.maCauHoi);
    const { data, total } = paginate(list, page, limit);
    return HttpResponse.json({ data, total, page, limit });
  }),

  http.get(`${API}/questions/:id`, ({ request, params }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    const id = Number(params.id);
    const q = state.questions.find((x) => x.maCauHoi === id);
    if (!q) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Không tìm thấy câu hỏi', error: 'Not Found' },
        { status: 404 },
      );
    }
    return HttpResponse.json(q);
  }),

  http.post(`${API}/questions`, async ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'giaovien' || !state.currentUser.maGV) {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ giảng viên được phép soạn câu hỏi', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const body = (await request.json()) as { noiDung: string; maMon: string; maDoKho: number };
    const monHoc = state.subjects.find((s) => s.maMon === body.maMon);
    if (!monHoc) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Môn học không tồn tại', error: 'Not Found' },
        { status: 404 },
      );
    }
    const doKho = state.difficulties.find((d) => d.maDoKho === body.maDoKho);
    if (!doKho) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Độ khó không tồn tại', error: 'Not Found' },
        { status: 404 },
      );
    }
    const created: CauHoi = {
      maCauHoi: state.nextQuestionId++,
      noiDung: body.noiDung,
      ngayTao: new Date().toISOString(),
      maMon: body.maMon,
      maDoKho: body.maDoKho,
      maGV: state.currentUser.maGV,
      monHoc,
      doKho,
      giangVien: state.currentUser.giangVien ?? undefined,
    };
    state.questions.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch(`${API}/questions/:id`, async ({ request, params }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    const id = Number(params.id);
    const idx = state.questions.findIndex((q) => q.maCauHoi === id);
    if (idx === -1) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Không tìm thấy', error: 'Not Found' },
        { status: 404 },
      );
    }
    if (
      state.currentUser.vaiTro !== 'giaovien' ||
      state.questions[idx].maGV !== state.currentUser.maGV
    ) {
      return HttpResponse.json(
        {
          statusCode: 403,
          message: 'Chỉ giảng viên đã soạn câu hỏi này mới được sửa/xoá',
          error: 'Forbidden',
        },
        { status: 403 },
      );
    }
    const body = (await request.json()) as Partial<{
      noiDung: string;
      maMon: string;
      maDoKho: number;
    }>;
    const next: CauHoi = { ...state.questions[idx], ...body };
    if (body.maMon) next.monHoc = state.subjects.find((s) => s.maMon === body.maMon);
    if (body.maDoKho) next.doKho = state.difficulties.find((d) => d.maDoKho === body.maDoKho);
    state.questions[idx] = next;
    return HttpResponse.json(next);
  }),

  http.delete(`${API}/questions/:id`, ({ request, params }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    const id = Number(params.id);
    const idx = state.questions.findIndex((q) => q.maCauHoi === id);
    if (idx === -1) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Không tìm thấy', error: 'Not Found' },
        { status: 404 },
      );
    }
    if (
      state.currentUser.vaiTro !== 'giaovien' ||
      state.questions[idx].maGV !== state.currentUser.maGV
    ) {
      return HttpResponse.json(
        {
          statusCode: 403,
          message: 'Chỉ giảng viên đã soạn câu hỏi này mới được sửa/xoá',
          error: 'Forbidden',
        },
        { status: 403 },
      );
    }
    if (state.examQuestions.some((eq) => eq.maCauHoi === id)) {
      return HttpResponse.json(
        {
          statusCode: 409,
          message: 'Câu hỏi đang được sử dụng trong đề thi',
          error: 'Conflict',
        },
        { status: 409 },
      );
    }
    state.questions.splice(idx, 1);
    return HttpResponse.json({ message: 'Đã xoá' });
  }),

  // ─── Exams ───────────────────────────────────────────────────────────────
  http.get(`${API}/exams`, ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '10');
    const maMon = url.searchParams.get('maMon') ?? '';
    const hocKy = url.searchParams.get('hocKy') ?? '';
    const namHoc = url.searchParams.get('namHoc') ?? '';
    let list = [...state.exams];
    if (maMon) list = list.filter((e) => e.maMon === maMon);
    if (hocKy) list = list.filter((e) => e.hocKy === Number(hocKy));
    if (namHoc) list = list.filter((e) => e.namHoc === namHoc);
    list.sort((a, b) => b.maDeThi - a.maDeThi);
    const withDetails = list.map((e) => ({
      ...e,
      chiTietDeThis: state.examQuestions
        .filter((eq) => eq.maDeThi === e.maDeThi)
        .sort((a, b) => a.soCau - b.soCau),
    }));
    const { data, total } = paginate(withDetails, page, limit);
    return HttpResponse.json({ data, total, page, limit });
  }),

  http.get(`${API}/exams/:id`, ({ request, params }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    const id = Number(params.id);
    const exam = state.exams.find((e) => e.maDeThi === id);
    if (!exam) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Không tìm thấy đề thi', error: 'Not Found' },
        { status: 404 },
      );
    }
    const chiTiet = state.examQuestions
      .filter((eq) => eq.maDeThi === id)
      .sort((a, b) => a.soCau - b.soCau)
      .map((eq) => ({
        ...eq,
        cauHoi: state.questions.find((q) => q.maCauHoi === eq.maCauHoi),
      }));
    return HttpResponse.json({ ...exam, chiTietDeThis: chiTiet });
  }),

  http.post(`${API}/exams`, async ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'giaovien' || !state.currentUser.maGV) {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ giảng viên được phép lập đề', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const body = (await request.json()) as {
      hocKy: number;
      namHoc: string;
      thoiLuong: number;
      maMon: string;
      danhSachMaCauHoi: number[];
    };
    if (!Array.isArray(body.danhSachMaCauHoi) || body.danhSachMaCauHoi.length === 0) {
      return HttpResponse.json(
        { statusCode: 400, message: 'Phải chọn ít nhất 1 câu hỏi', error: 'Bad Request' },
        { status: 400 },
      );
    }
    const ids = body.danhSachMaCauHoi;
    if (new Set(ids).size !== ids.length) {
      return HttpResponse.json(
        { statusCode: 400, message: 'Có câu hỏi trùng nhau', error: 'Bad Request' },
        { status: 400 },
      );
    }
    const SoCauToiDa = Number(
      state.regulations.find((r) => r.tenThamSo === 'SoCauToiDa')?.giaTri ?? '5',
    );
    if (ids.length > SoCauToiDa) {
      return HttpResponse.json(
        {
          statusCode: 400,
          message: `Số câu hỏi vượt quá quy định (tối đa ${SoCauToiDa})`,
          error: 'Bad Request',
        },
        { status: 400 },
      );
    }
    const ThoiLuongMin = Number(
      state.regulations.find((r) => r.tenThamSo === 'ThoiLuongMin')?.giaTri ?? '30',
    );
    const ThoiLuongMax = Number(
      state.regulations.find((r) => r.tenThamSo === 'ThoiLuongMax')?.giaTri ?? '180',
    );
    if (body.thoiLuong < ThoiLuongMin || body.thoiLuong > ThoiLuongMax) {
      return HttpResponse.json(
        {
          statusCode: 400,
          message: `Thời lượng phải trong khoảng ${ThoiLuongMin}-${ThoiLuongMax} phút`,
          error: 'Bad Request',
        },
        { status: 400 },
      );
    }
    const qs = ids.map((id) => state.questions.find((q) => q.maCauHoi === id));
    if (qs.some((q) => !q)) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Có câu hỏi không tồn tại', error: 'Not Found' },
        { status: 404 },
      );
    }
    if (qs.some((q) => q!.maMon !== body.maMon)) {
      return HttpResponse.json(
        { statusCode: 400, message: 'Câu hỏi không cùng môn với đề thi', error: 'Bad Request' },
        { status: 400 },
      );
    }
    const monHoc = state.subjects.find((s) => s.maMon === body.maMon);
    if (!monHoc) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Môn học không tồn tại', error: 'Not Found' },
        { status: 404 },
      );
    }
    const newId = state.nextExamId++;
    const exam: DeThi = {
      maDeThi: newId,
      hocKy: body.hocKy,
      namHoc: body.namHoc,
      thoiLuong: body.thoiLuong,
      ngayTao: new Date().toISOString(),
      maMon: body.maMon,
      maGV: state.currentUser.maGV,
      monHoc,
      giangVien: state.currentUser.giangVien ?? undefined,
    };
    state.exams.push(exam);
    ids.forEach((maCauHoi, i) => {
      state.examQuestions.push({ maDeThi: newId, maCauHoi, soCau: i + 1 });
    });
    return HttpResponse.json(exam, { status: 201 });
  }),

  http.patch(`${API}/exams/:id`, async ({ request, params }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    const id = Number(params.id);
    const idx = state.exams.findIndex((e) => e.maDeThi === id);
    if (idx === -1) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Không tìm thấy đề thi', error: 'Not Found' },
        { status: 404 },
      );
    }
    if (
      state.currentUser.vaiTro !== 'giaovien' ||
      state.exams[idx].maGV !== state.currentUser.maGV
    ) {
      return HttpResponse.json(
        {
          statusCode: 403,
          message: 'Chỉ giảng viên đã lập đề mới được sửa/xoá',
          error: 'Forbidden',
        },
        { status: 403 },
      );
    }
    const body = (await request.json()) as Partial<{
      hocKy: number;
      namHoc: string;
      thoiLuong: number;
      danhSachMaCauHoi: number[];
    }>;
    if (body.danhSachMaCauHoi) {
      const ids = body.danhSachMaCauHoi;
      const SoCauToiDa = Number(
        state.regulations.find((r) => r.tenThamSo === 'SoCauToiDa')?.giaTri ?? '5',
      );
      if (ids.length === 0 || ids.length > SoCauToiDa || new Set(ids).size !== ids.length) {
        return HttpResponse.json(
          { statusCode: 400, message: 'Danh sách câu hỏi không hợp lệ', error: 'Bad Request' },
          { status: 400 },
        );
      }
      state.examQuestions = state.examQuestions.filter((eq) => eq.maDeThi !== id);
      ids.forEach((maCauHoi, i) => {
        state.examQuestions.push({ maDeThi: id, maCauHoi, soCau: i + 1 });
      });
    }
    state.exams[idx] = {
      ...state.exams[idx],
      ...('hocKy' in body && body.hocKy !== undefined ? { hocKy: body.hocKy } : {}),
      ...('namHoc' in body && body.namHoc !== undefined ? { namHoc: body.namHoc } : {}),
      ...('thoiLuong' in body && body.thoiLuong !== undefined ? { thoiLuong: body.thoiLuong } : {}),
    };
    return HttpResponse.json(state.exams[idx]);
  }),

  http.delete(`${API}/exams/:id`, ({ request, params }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    const id = Number(params.id);
    const idx = state.exams.findIndex((e) => e.maDeThi === id);
    if (idx === -1) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Không tìm thấy đề thi', error: 'Not Found' },
        { status: 404 },
      );
    }
    if (
      state.currentUser.vaiTro !== 'giaovien' ||
      state.exams[idx].maGV !== state.currentUser.maGV
    ) {
      return HttpResponse.json(
        {
          statusCode: 403,
          message: 'Chỉ giảng viên đã lập đề mới được sửa/xoá',
          error: 'Forbidden',
        },
        { status: 403 },
      );
    }
    const gradeCount = state.grades.filter((g) => g.maDeThi === id).length;
    if (gradeCount > 0) {
      return HttpResponse.json(
        {
          statusCode: 409,
          message: `Không thể xoá đề thi: còn ${gradeCount} dòng điểm tham chiếu`,
          error: 'Conflict',
        },
        { status: 409 },
      );
    }
    state.exams.splice(idx, 1);
    state.examQuestions = state.examQuestions.filter((eq) => eq.maDeThi !== id);
    return HttpResponse.json({ message: 'Đã xoá' });
  }),

  // ─── Grades ──────────────────────────────────────────────────────────────
  http.get(`${API}/grades`, ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '10');
    const maLop = url.searchParams.get('maLop') ?? '';
    const maDeThi = url.searchParams.get('maDeThi') ?? '';
    const hocKy = url.searchParams.get('hocKy') ?? '';
    const namHoc = url.searchParams.get('namHoc') ?? '';
    let list = [...state.grades];
    if (maLop) list = list.filter((g) => g.maLop === maLop);
    if (maDeThi) list = list.filter((g) => g.maDeThi === Number(maDeThi));
    if (hocKy) list = list.filter((g) => g.hocKy === Number(hocKy));
    if (namHoc) list = list.filter((g) => g.namHoc === namHoc);
    list.sort((a, b) => b.maBangDiem - a.maBangDiem);
    const enriched = list.map((g) => ({
      ...g,
      sinhVien: state.students.find((sv) => sv.maSV === g.maSV),
      lopHoc: state.classes.find((c) => c.maLop === g.maLop),
      deThi: state.exams.find((e) => e.maDeThi === g.maDeThi),
    }));
    const { data, total } = paginate(enriched, page, limit);
    return HttpResponse.json({ data, total, page, limit });
  }),

  http.get(`${API}/grades/:id`, ({ request, params }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    const id = Number(params.id);
    const g = state.grades.find((x) => x.maBangDiem === id);
    if (!g) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Không tìm thấy', error: 'Not Found' },
        { status: 404 },
      );
    }
    return HttpResponse.json(g);
  }),

  http.post(`${API}/grades`, async ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'giaovien') {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ giảng viên được phép nhập điểm', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const body = (await request.json()) as {
      maSV: string;
      maLop: string;
      maDeThi: number;
      hocKy: number;
      namHoc: string;
      diemSo: number;
      ghiChu?: string;
    };
    const DiemMin = Number(state.regulations.find((r) => r.tenThamSo === 'DiemMin')?.giaTri ?? '0');
    const DiemMax = Number(
      state.regulations.find((r) => r.tenThamSo === 'DiemMax')?.giaTri ?? '10',
    );
    if (body.diemSo < DiemMin || body.diemSo > DiemMax) {
      return HttpResponse.json(
        {
          statusCode: 400,
          message: `Điểm phải trong khoảng ${DiemMin}-${DiemMax}`,
          error: 'Bad Request',
        },
        { status: 400 },
      );
    }
    const sv = state.students.find((x) => x.maSV === body.maSV);
    if (!sv) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Sinh viên không tồn tại', error: 'Not Found' },
        { status: 404 },
      );
    }
    if (sv.maLop !== body.maLop) {
      return HttpResponse.json(
        { statusCode: 400, message: 'Sinh viên không thuộc lớp', error: 'Bad Request' },
        { status: 400 },
      );
    }
    const dup = state.grades.find(
      (g) =>
        g.maSV === body.maSV &&
        g.maDeThi === body.maDeThi &&
        g.hocKy === body.hocKy &&
        g.namHoc === body.namHoc,
    );
    if (dup) {
      return HttpResponse.json(
        {
          statusCode: 409,
          message: 'Sinh viên đã có điểm cho đề thi này. Dùng PATCH để cập nhật.',
          error: 'Conflict',
        },
        { status: 409 },
      );
    }
    const created: BangDiem = {
      maBangDiem: state.nextGradeId++,
      hocKy: body.hocKy,
      namHoc: body.namHoc,
      diemSo: body.diemSo,
      ghiChu: body.ghiChu ?? null,
      maSV: body.maSV,
      maLop: body.maLop,
      maDeThi: body.maDeThi,
    };
    state.grades.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch(`${API}/grades/:id`, async ({ request, params }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'giaovien') {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ giảng viên được phép sửa điểm', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const id = Number(params.id);
    const idx = state.grades.findIndex((g) => g.maBangDiem === id);
    if (idx === -1) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Không tìm thấy', error: 'Not Found' },
        { status: 404 },
      );
    }
    const body = (await request.json()) as Partial<{
      diemSo: number;
      ghiChu: string;
      hocKy: number;
    }>;
    if (body.diemSo !== undefined) {
      const DiemMin = Number(
        state.regulations.find((r) => r.tenThamSo === 'DiemMin')?.giaTri ?? '0',
      );
      const DiemMax = Number(
        state.regulations.find((r) => r.tenThamSo === 'DiemMax')?.giaTri ?? '10',
      );
      if (body.diemSo < DiemMin || body.diemSo > DiemMax) {
        return HttpResponse.json(
          {
            statusCode: 400,
            message: `Điểm phải trong khoảng ${DiemMin}-${DiemMax}`,
            error: 'Bad Request',
          },
          { status: 400 },
        );
      }
    }
    state.grades[idx] = { ...state.grades[idx], ...body };
    return HttpResponse.json(state.grades[idx]);
  }),

  http.post(`${API}/grades/batch`, async ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    if (state.currentUser.vaiTro !== 'giaovien') {
      return HttpResponse.json(
        { statusCode: 403, message: 'Chỉ giảng viên được phép nhập điểm', error: 'Forbidden' },
        { status: 403 },
      );
    }
    const body = (await request.json()) as {
      maLop: string;
      maDeThi: number;
      hocKy: number;
      namHoc: string;
      danhSachDiem: { maSV: string; diemSo: number; ghiChu?: string }[];
    };
    if (!Array.isArray(body.danhSachDiem) || body.danhSachDiem.length === 0) {
      return HttpResponse.json(
        { statusCode: 400, message: 'Danh sách điểm rỗng', error: 'Bad Request' },
        { status: 400 },
      );
    }
    const seen = new Set<string>();
    for (const e of body.danhSachDiem) {
      if (seen.has(e.maSV)) {
        return HttpResponse.json(
          {
            statusCode: 400,
            message: `Sinh viên ${e.maSV} bị trùng trong danh sách`,
            error: 'Bad Request',
          },
          { status: 400 },
        );
      }
      seen.add(e.maSV);
    }
    const DiemMin = Number(state.regulations.find((r) => r.tenThamSo === 'DiemMin')?.giaTri ?? '0');
    const DiemMax = Number(
      state.regulations.find((r) => r.tenThamSo === 'DiemMax')?.giaTri ?? '10',
    );
    for (const e of body.danhSachDiem) {
      if (e.diemSo < DiemMin || e.diemSo > DiemMax) {
        return HttpResponse.json(
          {
            statusCode: 400,
            message: `Điểm của SV ${e.maSV} ngoài khoảng ${DiemMin}-${DiemMax}`,
            error: 'Bad Request',
          },
          { status: 400 },
        );
      }
      const sv = state.students.find((s) => s.maSV === e.maSV);
      if (!sv || sv.maLop !== body.maLop) {
        return HttpResponse.json(
          {
            statusCode: 400,
            message: `Sinh viên ${e.maSV} không thuộc lớp ${body.maLop}`,
            error: 'Bad Request',
          },
          { status: 400 },
        );
      }
    }
    const data: BangDiem[] = [];
    for (const e of body.danhSachDiem) {
      const existingIdx = state.grades.findIndex(
        (g) =>
          g.maSV === e.maSV &&
          g.maDeThi === body.maDeThi &&
          g.hocKy === body.hocKy &&
          g.namHoc === body.namHoc,
      );
      if (existingIdx !== -1) {
        state.grades[existingIdx] = {
          ...state.grades[existingIdx],
          diemSo: e.diemSo,
          ghiChu: e.ghiChu ?? state.grades[existingIdx].ghiChu,
        };
        data.push(state.grades[existingIdx]);
      } else {
        const created: BangDiem = {
          maBangDiem: state.nextGradeId++,
          hocKy: body.hocKy,
          namHoc: body.namHoc,
          diemSo: e.diemSo,
          ghiChu: e.ghiChu ?? null,
          maSV: e.maSV,
          maLop: body.maLop,
          maDeThi: body.maDeThi,
        };
        state.grades.push(created);
        data.push(created);
      }
    }
    return HttpResponse.json({ count: data.length, data }, { status: 201 });
  }),

  // ─── Exports ─────────────────────────────────────────────────────────────
  http.get(`${API}/export/exam/:maDeThi/pdf`, ({ request, params }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    const id = Number(params.maDeThi);
    if (!state.exams.some((e) => e.maDeThi === id)) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Không tìm thấy đề thi', error: 'Not Found' },
        { status: 404 },
      );
    }
    const blob = new Blob([`%PDF-1.4 mock exam ${id}`], { type: 'application/pdf' });
    return new HttpResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="de-thi-${id}.pdf"`,
      },
    });
  }),

  http.get(`${API}/export/exam/:maDeThi/docx`, ({ request, params }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    const id = Number(params.maDeThi);
    if (!state.exams.some((e) => e.maDeThi === id)) {
      return HttpResponse.json(
        { statusCode: 404, message: 'Không tìm thấy đề thi', error: 'Not Found' },
        { status: 404 },
      );
    }
    const blob = new Blob([`mock docx exam ${id}`], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    return new HttpResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="de-thi-${id}.docx"`,
      },
    });
  }),

  http.get(`${API}/export/grades/pdf`, ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    const url = new URL(request.url);
    const maLop = url.searchParams.get('maLop');
    const maDeThi = url.searchParams.get('maDeThi');
    if (!maLop || !maDeThi) {
      return HttpResponse.json(
        { statusCode: 400, message: 'Thiếu maLop hoặc maDeThi', error: 'Bad Request' },
        { status: 400 },
      );
    }
    const blob = new Blob([`%PDF-1.4 mock grades ${maLop}-${maDeThi}`], {
      type: 'application/pdf',
    });
    return new HttpResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bang-diem-${maLop}-${maDeThi}.pdf"`,
      },
    });
  }),

  // ─── Reports (read-only) ─────────────────────────────────────────────────
  http.get(`${API}/reports/exams-by-subject`, ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    const url = new URL(request.url);
    const hocKyParam = url.searchParams.get('hocKy');
    const hocKy = hocKyParam ? Number(hocKyParam) : null;

    // Seed deterministic data per môn × HK
    const seeds: Array<{ maMon: string; tenMon: string; hk1: number; hk2: number }> = [
      { maMon: 'CSDL', tenMon: 'Cơ sở dữ liệu', hk1: 7, hk2: 5 },
      { maMon: 'MMT', tenMon: 'Mạng máy tính', hk1: 4, hk2: 5 },
      { maMon: 'GT1', tenMon: 'Giải tích 1', hk1: 3, hk2: 4 },
      { maMon: 'OOP', tenMon: 'Lập trình hướng đối tượng', hk1: 6, hk2: 4 },
      { maMon: 'KTMT', tenMon: 'Kiến trúc máy tính', hk1: 3, hk2: 2 },
      { maMon: 'DSA', tenMon: 'Cấu trúc dữ liệu & Giải thuật', hk1: 5, hk2: 3 },
    ];

    const rows = seeds.flatMap((s) => {
      if (hocKy === 1) {
        return [{ maMon: s.maMon, tenMon: s.tenMon, soLuongDeThi: s.hk1, hocKy: 1 }];
      }
      if (hocKy === 2) {
        return [{ maMon: s.maMon, tenMon: s.tenMon, soLuongDeThi: s.hk2, hocKy: 2 }];
      }
      return [
        { maMon: s.maMon, tenMon: s.tenMon, soLuongDeThi: s.hk1, hocKy: 1 },
        { maMon: s.maMon, tenMon: s.tenMon, soLuongDeThi: s.hk2, hocKy: 2 },
      ];
    });
    return HttpResponse.json(rows);
  }),

  http.get(`${API}/reports/results-by-class`, ({ request }) => {
    const guard = requireAuth(request);
    if (guard) return guard;
    const url = new URL(request.url);
    const maMonFilter = url.searchParams.get('maMon');

    const seeds = [
      {
        maLop: 'CS01',
        tenLop: 'CSDL - CTT2022',
        maMon: 'CSDL',
        tenMon: 'Cơ sở dữ liệu',
        siSo: 45,
        soSVDiThi: 44,
        diemTrungBinh: 7.4,
        tiLeDat: 0.93,
      },
      {
        maLop: 'CS02',
        tenLop: 'CSDL - CTT2023',
        maMon: 'CSDL',
        tenMon: 'Cơ sở dữ liệu',
        siSo: 42,
        soSVDiThi: 40,
        diemTrungBinh: 6.9,
        tiLeDat: 0.85,
      },
      {
        maLop: 'OO01',
        tenLop: 'OOP - CTT2022',
        maMon: 'OOP',
        tenMon: 'Lập trình hướng đối tượng',
        siSo: 50,
        soSVDiThi: 48,
        diemTrungBinh: 7.8,
        tiLeDat: 0.92,
      },
      {
        maLop: 'MM01',
        tenLop: 'MMT - CTT2022',
        maMon: 'MMT',
        tenMon: 'Mạng máy tính',
        siSo: 40,
        soSVDiThi: 38,
        diemTrungBinh: 6.5,
        tiLeDat: 0.78,
      },
      {
        maLop: 'DS01',
        tenLop: 'DSA - CTT2022',
        maMon: 'DSA',
        tenMon: 'Cấu trúc dữ liệu & Giải thuật',
        siSo: 48,
        soSVDiThi: 46,
        diemTrungBinh: 7.1,
        tiLeDat: 0.87,
      },
    ];

    const rows = maMonFilter ? seeds.filter((s) => s.maMon === maMonFilter) : seeds;
    return HttpResponse.json(rows);
  }),
];
