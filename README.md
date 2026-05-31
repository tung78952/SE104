# SE104 — Hệ thống Quản lý Ra đề & Chấm thi

Đồ án môn **SE104 - Nhập môn Công nghệ Phần mềm**, ĐH Công nghệ Thông tin (ĐHQG-HCM).
GV hướng dẫn: **ThS. Đỗ Thị Thanh Tuyền**.
Nhóm 14 (5 thành viên):

| MSSV | Họ và tên |
|------|-----------|
| 23521481 | Nguyễn Hải Thiện |
| 23520519 | Lại Khánh Hoàng |
| 23521747 | Trần Phan Thanh Tùng |
| 23521741 | Mô Văn Tùng |
| 23520134 | Phan Đức Chí Bảo |

---

## 1. Stack công nghệ

| Lớp | Công nghệ |
|-----|-----------|
| **Frontend** | Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS 4 + shadcn/ui + Zustand + TanStack Query + Axios + Zod + Recharts |
| **Backend** | NestJS 11 + Prisma ORM 5.22 + JWT + Swagger + class-validator + bcrypt |
| **Database** | MySQL 8.4 (chạy trong Docker container `se104_mysql`) |
| **Export** | PDFKit (PDF) + docx (DOCX) — font Lora (OFL, free) cho tiếng Việt |
| **Kiến trúc** | 3-Tier: Presentation (Next.js) ↔ Business (NestJS) ↔ Data (MySQL via Prisma) |

---

## 2. Cấu trúc thư mục

```
SE104/
├── backend/                       # NestJS API server (port 5001)
│   ├── prisma/
│   │   ├── schema.prisma          # 11 model
│   │   ├── migrations/            # SQL migration
│   │   └── seed.ts                # Dữ liệu mẫu (10 môn, 100 câu, 150 SV, …)
│   ├── src/
│   │   ├── auth/                  # JWT signin/signup/refresh, RolesGuard
│   │   ├── users/                 # CRUD tài khoản
│   │   ├── subjects/              # CRUD môn học
│   │   ├── classes/               # CRUD lớp + nested SV
│   │   ├── students/              # CRUD sinh viên
│   │   ├── difficulties/          # CRUD độ khó
│   │   ├── questions/             # Soạn câu hỏi (GV chỉ sửa câu của mình)
│   │   ├── exams/                 # Lập đề thi (max 5 câu, 30-180 phút)
│   │   ├── grades/                # Nhập điểm đơn + batch CSV
│   │   ├── regulations/           # QuyDinh (tham số động — QĐ6)
│   │   ├── reports/               # 3 endpoint: exams-by-subject, results-by-class, overview
│   │   ├── export/                # PDF/DOCX đề thi + bảng điểm
│   │   └── prisma/                # PrismaService wrapper
│   ├── assets/fonts/              # Lora-Regular.ttf + Lora-Bold.ttf (OFL) cho PDF
│   ├── docker-compose.yml         # MySQL 8.4
│   ├── .env                       # DATABASE_URL + JWT_SECRET (đã ignore)
│   └── package.json
│
├── frontend/                      # Next.js client (port 3000)
│   ├── src/
│   │   ├── app/                   # 25 routes (App Router)
│   │   │   ├── dashboard/         # Trang chủ sau login
│   │   │   ├── admin/users/       # Admin: CRUD tài khoản
│   │   │   ├── subjects/          # Môn học
│   │   │   ├── classes/[maLop]/   # Lớp học + chi tiết
│   │   │   ├── students/          # Sinh viên
│   │   │   ├── difficulties/      # Độ khó
│   │   │   ├── questions/         # Ngân hàng câu hỏi (CRUD)
│   │   │   ├── exams/[id]/        # Đề thi (list + view + edit)
│   │   │   ├── grades/batch/      # Nhập điểm hàng loạt
│   │   │   ├── regulations/       # Quy định
│   │   │   ├── reports/           # 2 báo cáo: theo môn + theo lớp
│   │   │   ├── login/             # Form đăng nhập
│   │   │   ├── profile/           # Đổi mật khẩu
│   │   │   └── 403/               # Forbidden page
│   │   ├── components/            # UI components, layout, forms
│   │   ├── hooks/                 # usePermission, useIsOwner, useCrudResource…
│   │   └── lib/                   # api/, auth/, schemas/, utils/
│   └── package.json
│
├── README.md                      # File này
└── .gitignore
```

---

## 3. Database — 11 bảng

Sơ đồ ERD (xem ảnh trong báo cáo `DoAnSE104.docx`):

| # | Bảng | Mô tả ngắn |
|---|------|------------|
| 1 | **GIANGVIEN** (`maGV`) | Hồ sơ giảng viên (họ tên, email, khoa/bộ môn) |
| 2 | **TAIKHOAN** (`maTK`) | Đăng nhập (username, hash password, vai trò: `admin`\|`giaovien`). FK `maGV` → `GIANGVIEN` (null nếu Admin) |
| 3 | **MONHOC** (`maMon`) | Môn học (tên môn, số tín chỉ) |
| 4 | **DOKHO** (`maDoKho`) | 4 mức: Dễ / Trung Bình / Phức Tạp / Khó |
| 5 | **CAUHOI** (`maCauHoi`) | Ngân hàng câu hỏi (nội dung text). FK: `maMon`, `maDoKho`, `maGV` (người soạn) |
| 6 | **DETHI** (`maDeThi`) | Đề thi (học kỳ, năm học, thời lượng). FK: `maMon`, `maGV` (người lập) |
| 7 | **CHITIETDETHI** (`maDeThi`+`maCauHoi`) | Bảng nối Đề ↔ Câu hỏi (m-n) + `soCau` (thứ tự câu) |
| 8 | **LOPHOC** (`maLop`) | Lớp học phần. FK: `maMon` |
| 9 | **SINHVIEN** (`maSV`) | Sinh viên. FK: `maLop` |
| 10 | **BANGDIEM** (`maBangDiem`) | Kết quả thi (điểm 0-10). FK: `maSV`, `maLop`, `maDeThi` + `hocKy`, `namHoc` |
| 11 | **QUYDINH** (`maQuyDinh`) | Tham số động (SoCauToiDa, ThoiLuongMin/Max, DiemMin/Max). FK: `maTKCapNhat` → `TAIKHOAN` |

**Quan hệ chính**:
- 1 GV soạn nhiều CauHoi và DeThi
- 1 MonHoc có nhiều CauHoi, DeThi, LopHoc
- 1 LopHoc có nhiều SinhVien (1-N)
- BangDiem nối SinhVien × DeThi × LopHoc (cho biết điểm SV nào, lớp nào, đề nào)
- QuyDinh được Admin (TaiKhoan) cập nhật → truy vết qua `maTKCapNhat`

---

## 4. 9 Yêu cầu nghiệp vụ

| # | Yêu cầu | Biểu mẫu | Quy định |
|---|---------|----------|----------|
| 1 | Soạn câu hỏi | BM1 | QĐ1 (4 mức độ khó, nội dung không trống) |
| 2 | Soạn đề thi | BM2 | QĐ2 (≤5 câu, 30-180 phút, cùng môn) |
| 3 | Nhập danh sách lớp học | BM3 | QĐ3 (mã lớp duy nhất) |
| 4 | Lập danh sách môn học | BM4 | QĐ4 (mã môn duy nhất, số tín chỉ > 0) |
| 5 | Ghi nhận kết quả chấm thi | BM5 | QĐ5 (điểm 0.0-10.0) |
| 6 | Tra cứu câu hỏi | BM6 | — |
| 7 | Tra cứu đề thi | BM7 | — |
| 8 | Lập báo cáo năm | BM8.1, BM8.2 | — |
| 9 | Thay đổi quy định | — | QĐ6 (chỉ Admin) |

---

## 5. Chức năng theo vai trò

### 5.1. Admin

| Nhóm | Chức năng cụ thể |
|------|------------------|
| **Tài khoản & hệ thống** | CRUD tài khoản giảng viên (tạo, sửa, khoá, xoá, đổi mật khẩu) |
| **Danh mục** | CRUD Môn học, Lớp học (kèm thêm/xoá SV), Sinh viên, Độ khó |
| **Quy định** | Thay đổi tham số: SoCauToiDa, ThoiLuongMin/Max, DiemMin/Max (QĐ6) |
| **Dashboard** | Xem tổng số SV, bảng điểm, giảng viên, điểm TB toàn hệ thống + biểu đồ đề thi theo môn |
| **Tra cứu** | Xem tất cả câu hỏi, đề thi, bảng điểm của mọi GV |
| **Báo cáo** | BM8.1 (số đề theo môn) + BM8.2 (kết quả theo lớp) — lọc theo năm/học kỳ/môn |
| **Export** | Xuất PDF/DOCX đề thi của bất kỳ GV nào |

### 5.2. Giảng viên (`giaovien`)

| Nhóm | Chức năng cụ thể |
|------|------------------|
| **Hồ sơ** | Xem thông tin cá nhân, đổi mật khẩu |
| **Câu hỏi** | CRUD câu hỏi (chỉ sửa/xoá câu **chính mình tạo** — verify qua `maGV`) |
| **Đề thi** | Lập đề mới từ ngân hàng câu hỏi (max 5 câu/đề, 30-180 phút, cùng môn). Sửa/xoá đề chính chủ |
| **Nhập điểm** | Nhập điểm cho SV của lớp + đề. 2 chế độ: đơn lẻ (`/grades/new`) hoặc hàng loạt CSV (`/grades/batch`) |
| **Dashboard cá nhân** | Số câu hỏi của tôi, số đề của tôi, bảng điểm liên quan, điểm TB đề của mình |
| **Tra cứu** | Xem tất cả câu hỏi & đề thi (chỉ đọc với câu/đề của GV khác), xem bảng điểm |
| **Báo cáo** | Xem 2 báo cáo BM8.1, BM8.2 |
| **Export** | Xuất PDF/DOCX đề thi chính chủ |

> 📌 Phân quyền được enforce ở **backend** (`AuthGuard` + `RolesGuard` + decorator `@Roles(...)` cho mọi endpoint) — frontend chỉ ẩn/hiện UI thêm cho UX.

---

## 6. Yêu cầu hệ thống

- **Node.js** ≥ 20 (LTS)
- **npm** ≥ 10
- **Docker Desktop** (để chạy MySQL container)
- **Font Lora** (đã có sẵn trong `backend/assets/fonts/`, OFL license) — chạy mọi OS, không cần cài thêm

---

## 7. Cài đặt & Chạy

### 7.1. Cài đặt lần đầu

Mở 2 terminal:

**Terminal 1 — Backend:**
```powershell
cd backend
npm install                  # cài dependencies
docker compose up -d         # bật MySQL (container `se104_mysql`)
npx prisma migrate deploy    # tạo 11 bảng (an toàn, non-interactive)
npx prisma db seed           # nạp dữ liệu mẫu (10 môn, 100 câu, 150 SV, 20+ đề, 230+ bảng điểm)
npm run start:dev            # → http://localhost:5001 (Swagger: /api/docs)
```

**Terminal 2 — Frontend:**
```powershell
cd frontend
npm install
npm run dev                  # → http://localhost:3000
```

Mở `http://localhost:3000/login` và đăng nhập.

### 7.2. Chạy lần sau (đã cài đặt rồi)

```powershell
# Terminal 1 (Backend)
cd backend
docker compose up -d         # bật lại MySQL (data còn nguyên nhờ Docker volume)
npm run start:dev

# Terminal 2 (Frontend)
cd frontend
npm run dev
```
**Không cần** chạy lại `migrate` hay `seed` — data trong Docker volume vẫn nguyên.

### 7.3. Cách tắt

**Tắt dev server**: bấm `Ctrl+C` trong từng terminal.

**Tắt MySQL container**:
```powershell
cd backend
docker compose down          # tắt container, GIỮ data (lần sau up -d sẽ thấy nguyên)
# HOẶC
docker compose down -v       # XOÁ data sạch (cần migrate + seed lại từ đầu)
```

> ⚠️ **CỜ `-v` XOÁ DATA**. Chỉ dùng khi muốn reset toàn bộ.

### 7.4. Reset dữ liệu (giữ container, chỉ reseed)

```powershell
cd backend
npx prisma db seed           # script tự xoá data cũ + seed mới
```

---

## 8. Tài khoản test (đã seed sẵn)

| Vai trò | Username | Password | Ghi chú |
|---------|----------|----------|---------|
| Admin | `admin` | `admin123` | Toàn quyền hệ thống |
| Giảng viên | `gv_thien` | `123456` | maGV = GV01 (Nguyễn Hải Thiện) |
| Giảng viên | `gv_hoang` | `123456` | maGV = GV02 (Lại Khánh Hoàng) |
| Giảng viên | `gv_tung` | `123456` | maGV = GV03 (Trần Phan Thanh Tùng) |
| Giảng viên | `gv_bao` | `123456` | maGV = GV04 (Phan Đức Chí Bảo) |

**Dữ liệu seed kèm**: 4 độ khó, 10 môn (IT001, IT002, CS104, MA003, MA006, MA004, IT005, IT006, NT106, SE104), 10 lớp, ~150 SV (MSSV `23520001+`), 20+ đề thi rải qua 2 năm 2024-2025 + 2025-2026, ~230 bảng điểm với phân phối điểm Gauss lệch theo môn.

---

## 9. Endpoint chính (backend, base `http://localhost:5001`)

Swagger docs đầy đủ: **http://localhost:5001/api/docs**

| Nhóm | Method + Route | Mô tả |
|------|---------------|-------|
| **Auth** | `POST /auth/signin` `POST /auth/refresh` `POST /auth/signout` `PATCH /auth/change-password` | Đăng nhập/đăng xuất, JWT 15p + refresh 7 ngày |
| **Users** | `GET/POST/PATCH/DELETE /users[/:id]` `GET/PATCH /users/me` | Quản lý tài khoản (admin) + hồ sơ cá nhân |
| **Subjects** | `GET/POST/PATCH/DELETE /subjects[/:maMon]` | Môn học |
| **Classes** | `GET/POST/PATCH/DELETE /classes[/:maLop]` `POST/DELETE /classes/:maLop/students[/:maSV]` | Lớp + nested SV |
| **Students** | `GET/POST/PATCH/DELETE /students[/:maSV]` | Sinh viên |
| **Difficulties** | `GET/POST/PATCH/DELETE /difficulties[/:id]` | Độ khó |
| **Questions** | `GET/POST/PATCH/DELETE /questions[/:id]?maMon&maDoKho&keyword` | Câu hỏi (GV: chỉ chính chủ) |
| **Exams** | `GET/POST/PATCH/DELETE /exams[/:id]?maMon&hocKy&namHoc` | Đề thi (GV: chỉ chính chủ) |
| **Grades** | `GET/POST/PATCH /grades[/:id]` `POST /grades/batch` | Bảng điểm + nhập hàng loạt |
| **Regulations** | `GET/POST/PATCH /regulations[/:tenThamSo]` | Quy định (admin sửa) |
| **Reports** | `GET /reports/exams-by-subject?namHoc&hocKy` `GET /reports/results-by-class?namHoc&hocKy&maMon` `GET /reports/overview` | BM8.1, BM8.2, dashboard overview |
| **Export** | `GET /export/exam/:maDeThi/{pdf,docx}` `GET /export/grades/pdf?maLop&maDeThi` | Xuất đề + bảng điểm |

---

## 10. Build production

```powershell
# Backend
cd backend
npm run build
npm run start:prod           # chạy dist/main.js

# Frontend
cd frontend
npm run build
npm run start                # → http://localhost:3000 (instant, không có dev indicator)
```

Production mode: nhanh hơn dev mode ~3-5x, không có "Compiling…", không có Next.js DevTools indicator. Phù hợp khi demo/nộp đồ án.

---

## 11. Lưu ý

- **Font Lora** (`backend/assets/fonts/Lora-Regular.ttf` + `Lora-Bold.ttf`) — kiểu serif đẹp, hỗ trợ đầy đủ tiếng Việt, **license OFL (open source, free)**, có nguồn từ Google Fonts qua npm package `@expo-google-fonts/lora`. Dùng cho cả PDF (PDFKit embed) lẫn DOCX (set name `Lora`). Người mở file Word chưa cài Lora sẽ thấy fallback serif gần giống.
- **`.env` không được commit** (đã ignored). Sau khi clone repo, copy `backend/.env.example` thành `backend/.env` và điền `DATABASE_URL` cùng `JWT_SECRET` của riêng bạn.
- **CORS**: backend cấu hình `Access-Control-Allow-Origin: http://localhost:3000` — đổi nếu frontend chạy port khác.

---

## 12. License & Tham khảo

Đồ án học thuật cho môn SE104 — UIT, không sử dụng cho mục đích thương mại.
