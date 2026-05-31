# Tài liệu Thiết kế UI – Hệ thống Quản lý Ra đề & Chấm thi (SE104)

## Context

Phân tích từ Backend NestJS (58 endpoint) + Prisma schema (11 model) để xác định danh sách màn hình giao diện frontend cần xây dựng. Mục tiêu: cung cấp tài liệu UI specification để đội frontend lên wireframe và đặt route.

**Hai vai trò người dùng** (theo §1.5.2 báo cáo):

- **Admin**: quản trị danh mục (tài khoản, môn, lớp, SV, độ khó, quy định) + xem mọi thứ
- **Giảng viên**: soạn câu hỏi, lập đề thi, nhập điểm (chính chủ) + xem mọi thứ

**Quy ước chung mọi trang:**

- Header: Logo, tên user, vai trò, nút Đăng xuất, link Đổi mật khẩu / Hồ sơ
- Sidebar: menu điều hướng (render theo `vaiTro`)
- Bảng danh sách: tìm kiếm, lọc, phân trang (`page`, `limit`), sort, nút "Thêm mới"
- Form: validate phía client trùng với class-validator phía server
- Toast thông báo thành công / lỗi 4xx-5xx

---

## A. NHÓM XÁC THỰC & TÀI KHOẢN CÁ NHÂN

### A1. Trang Đăng nhập (`/login`) — public

- **Hiển thị**: logo, tiêu đề hệ thống
- **Form**: `tenDangNhap`, `matKhau`
- **Nút**: "Đăng nhập" → `POST /auth/signin`
- **Behavior**: lưu `accessToken`, redirect sang `/dashboard`. Hiện lỗi 401 nếu sai.

### A2. Trang Hồ sơ cá nhân (`/profile`) — Admin + GV

- **Hiển thị (read-only)**: `maTK`, `tenDangNhap`, `vaiTro`, `maGV` (nếu GV)
- **Form sửa**: `hoTen`, `email`, `khoaBoMon` → `PATCH /users/me` (GET `/users/me` để load)
- **Nút**: "Lưu thay đổi", "Đổi mật khẩu" (mở modal A3)

### A3. Modal/Trang Đổi mật khẩu — Admin + GV

- **Form**: `matKhauCu`, `matKhauMoi`, `xacNhanMatKhauMoi`
- **Nút**: "Cập nhật" → `PATCH /auth/change-password`

### A4. Dashboard / Trang chủ (`/dashboard`) — Admin + GV

- **Hiển thị thống kê** (gọi nhiều API tổng hợp, hoặc count từ list endpoints):
  - Số lượng môn học, lớp học, sinh viên, câu hỏi, đề thi, bảng điểm
  - Card "Đề thi gần đây" (từ `GET /exams?limit=5`)
  - Card "Câu hỏi mới tạo" (từ `GET /questions?limit=5`)
- **Shortcut**: nút truy cập nhanh tới các trang chức năng theo vai trò

---

## B. NHÓM QUẢN TRỊ DANH MỤC (chỉ Admin)

### B1. Quản lý Tài khoản (`/admin/users`) — Admin only

- **Bảng** (`GET /users`): `maTK`, `tenDangNhap`, `vaiTro` (badge admin/giaovien), `hoTen`, `email`, `trangThai` (Active/Locked)
- **Tìm kiếm/Lọc**: theo `tenDangNhap`, `vaiTro`
- **Hành động/Nút**:
  - "Thêm tài khoản" → mở form: `tenDangNhap`, `matKhau`, `vaiTro` (dropdown), `hoTen`, `email`, `khoaBoMon` → `POST /users` (hoặc `POST /auth/signup`)
  - "Sửa" → `PATCH /users/:maTK` (cho phép đổi `vaiTro`, `trangThai`, `hoTen`, `email`)
  - "Khoá / Mở khoá" → `PATCH /users/:maTK` với `trangThai`
  - "Xoá" (xác nhận) → `DELETE /users/:maTK`

### B2. Quản lý Môn học (`/subjects`) — Admin CRUD, GV xem

- **Bảng** (`GET /subjects?search=`): `maMon`, `tenMon`, `soTinChi`
- **Hành động (Admin)**:
  - "Thêm môn" → form: `maMon`, `tenMon`, `soTinChi` → `POST /subjects`
  - "Sửa" → `PATCH /subjects/:maMon` (`tenMon`, `soTinChi`)
  - "Xoá" → `DELETE /subjects/:maMon`

### B3. Quản lý Lớp học (`/classes`) — Admin CRUD, GV xem

- **Bảng** (`GET /classes?search=&maMon=`): `maLop`, `tenLop`, `tenMon` (kèm `maMon`)
- **Lọc**: dropdown môn học
- **Hành động (Admin)**:
  - "Thêm lớp" → form: `maLop`, `tenLop`, `maMon` (dropdown) → `POST /classes`
  - "Sửa" → `PATCH /classes/:maLop`
  - "Xoá" → `DELETE /classes/:maLop`
  - "Xem chi tiết" → trang B3.1

### B3.1. Chi tiết Lớp học (`/classes/:maLop`) — Admin CRUD SV, GV xem

- **Hiển thị**: thông tin lớp + tên môn
- **Bảng sinh viên** (lấy từ `GET /classes/:maLop`): `maSV`, `hoTen`
- **Hành động (Admin)**:
  - "Thêm SV vào lớp" → form: `maSV`, `hoTen` → `POST /classes/:maLop/students`
  - "Xoá khỏi lớp" → `DELETE /classes/:maLop/students/:maSV`

### B4. Quản lý Sinh viên (`/students`) — Admin CRUD, GV xem

- **Bảng** (`GET /students?search=&maLop=`): `maSV`, `hoTen`, `maLop`, `tenLop`
- **Lọc**: dropdown lớp
- **Hành động (Admin)**:
  - "Thêm SV" → form: `maSV`, `hoTen`, `maLop` (dropdown) → `POST /students`
  - "Sửa" → `PATCH /students/:maSV`
  - "Xoá" → `DELETE /students/:maSV`

### B5. Quản lý Độ khó (`/difficulties`) — Admin CRUD, GV xem

- **Bảng** (`GET /difficulties`): `maDoKho`, `tenDoKho` (Dễ / Trung Bình / Phức Tạp / Khó)
- **Hành động (Admin)**: "Thêm" (`POST`), "Sửa" (`PATCH /difficulties/:id`), "Xoá" (`DELETE /difficulties/:id`)
- **Lưu ý**: trang đơn giản, có thể trình bày inline-edit

### B6. Quản lý Quy định hệ thống (`/regulations`) — Admin sửa, GV xem

- **Bảng** (`GET /regulations`): `tenThamSo`, `giaTri`, `moTa`, `ngayCapNhat`, `nguoiCapNhat`
- **5 tham số mặc định**: SoCauToiDa, ThoiLuongMin, ThoiLuongMax, DiemMin, DiemMax
- **Hành động (Admin)**:
  - "Thêm tham số" → form: `tenThamSo`, `giaTri`, `moTa` → `POST /regulations`
  - "Sửa giá trị" → input inline `giaTri` → `PATCH /regulations/:tenThamSo`
  - **KHÔNG có nút Xoá** (theo §1.5.2)

---

## C. NHÓM NGHIỆP VỤ – CÂU HỎI & ĐỀ THI (Giảng viên CRUD, Admin xem)

### C1. Quản lý Câu hỏi (`/questions`) — GV CRUD chính chủ, Admin xem

- **Bảng** (`GET /questions?maMon=&maDoKho=&keyword=&page=&limit=`): `maCauHoi`, `noiDung` (truncate), `tenMon`, `tenDoKho`, `nguoiSoan` (hoTen GV), `ngayTao`
- **Bộ lọc trên header**: dropdown môn, dropdown độ khó, ô tìm theo keyword
- **Hành động**:
  - **GV**: "Soạn câu hỏi mới" → trang/modal C1.1
  - **GV** (chỉ với câu của mình): "Sửa" (`PATCH`), "Xoá" (`DELETE /questions/:id`)
  - **Tất cả**: "Xem chi tiết" → modal hiện đầy đủ nội dung
- **UI hint**: ẩn nút Sửa/Xoá nếu `maGV` khác user hiện tại (check qua `/users/me`)

### C1.1. Form Soạn / Sửa câu hỏi

- **Trường**: `noiDung` (textarea lớn, rich text optional), `maMon` (dropdown từ `/subjects`), `maDoKho` (dropdown từ `/difficulties`)
- **Nút**: "Lưu" → `POST /questions` hoặc `PATCH /questions/:id`, "Huỷ"

### C2. Quản lý Đề thi (`/exams`) — GV CRUD chính chủ, Admin xem

- **Bảng** (`GET /exams?maMon=&hocKy=&namHoc=&page=&limit=`): `maDeThi`, `tenMon`, `hocKy`, `namHoc`, `thoiLuong (phút)`, `soCauHoi`, `nguoiLap`, `ngayTao`
- **Bộ lọc**: dropdown môn, dropdown học kỳ (1/2/3), input năm học (YYYY-YYYY)
- **Hành động**:
  - **GV**: "Lập đề thi mới" → trang C2.1
  - **GV chính chủ**: "Sửa" (C2.1), "Xoá" (`DELETE`)
  - **Tất cả**: "Xem chi tiết" → C2.2, "Xuất PDF", "Xuất DOCX"

### C2.1. Trang Lập / Sửa Đề thi (`/exams/new`, `/exams/:id/edit`) — GV

- **Form thông tin chung**: `hocKy` (1/2/3), `namHoc` (input YYYY-YYYY), `thoiLuong` (số phút), `maMon` (dropdown – disable khi đã chọn câu)
- **Khu vực chọn câu hỏi**: 2 cột
  - **Cột trái** "Ngân hàng câu hỏi": list `GET /questions?maMon=<đã chọn>` có search/filter theo độ khó. Mỗi câu có checkbox / nút "Thêm"
  - **Cột phải** "Câu đã chọn": danh sách thứ tự kèm số thứ tự `soCau`, nút "Xoá khỏi đề", nút mũi tên đổi thứ tự
- **Validate client-side hiển thị**: cảnh báo nếu vượt `SoCauToiDa` hoặc `thoiLuong` ngoài [`ThoiLuongMin`, `ThoiLuongMax`] (đọc từ `GET /regulations`)
- **Nút**: "Lưu đề" → `POST /exams` / `PATCH /exams/:id` (gửi `danhSachMaCauHoi[]`)

### C2.2. Chi tiết Đề thi (`/exams/:id`) — Admin + GV

- **Hiển thị**: header thông tin đề, bảng danh sách câu hỏi (số thứ tự, nội dung, độ khó)
- **Nút**: "Xuất PDF" → `GET /export/exam/:maDeThi/pdf`, "Xuất DOCX" → `GET /export/exam/:maDeThi/docx`
- **Nút** (chỉ GV chính chủ): "Sửa đề", "Xoá đề"

---

## D. NHÓM NGHIỆP VỤ – BẢNG ĐIỂM (GV nhập, Admin xem)

### D1. Tra cứu Bảng điểm (`/grades`) — Admin + GV

- **Bảng** (`GET /grades?maLop=&maDeThi=&hocKy=&namHoc=&page=&limit=`): `maSV`, `hoTen SV`, `tenLop`, `maDeThi`, `tenMon`, `hocKy`, `namHoc`, `diemSo`, `ghiChu`
- **Bộ lọc**: dropdown lớp, dropdown đề thi, dropdown học kỳ, input năm học
- **Hành động (GV)**: "Sửa điểm" inline / modal → `PATCH /grades/:id`
- **Nút**: "Nhập điểm mới" → D2 hoặc D3, "Xuất bảng điểm PDF" → `GET /export/grades/pdf?maLop=&maDeThi=`
- **Lưu ý**: KHÔNG có nút Xoá (theo §1.5.2)

### D2. Nhập điểm theo từng SV (`/grades/new`) — GV

- **Form**: `maSV` (autocomplete từ `/students`), `maLop` (dropdown), `maDeThi` (dropdown), `hocKy`, `namHoc`, `diemSo` (number, 1 chữ số thập phân), `ghiChu` (textarea ngắn)
- **Validate client**: `diemSo` ∈ [`DiemMin`, `DiemMax`] (đọc từ `/regulations`)
- **Nút**: "Lưu" → `POST /grades`, "Huỷ"

### D3. Nhập điểm hàng loạt theo lớp (`/grades/batch`) — GV

- **Form đầu trang**: `maLop` (dropdown), `maDeThi` (dropdown lọc theo môn của lớp), `hocKy`, `namHoc`
- **Bảng nhập điểm**: tự load danh sách SV của lớp từ `GET /classes/:maLop`. Mỗi dòng: `maSV`, `hoTen`, input `diemSo`, input `ghiChu`
- **Nút**:
  - "Tải template Excel/CSV" (tuỳ chọn), "Import từ file"
  - "Lưu tất cả" → `POST /grades/batch` với `danhSachDiem[]` (upsert – có sẵn sẽ ghi đè)
- **Hiển thị summary**: tổng số SV, số dòng đã nhập, điểm TB

---

## E. NHÓM BÁO CÁO & XUẤT FILE (Admin + GV)

### E1. Báo cáo Đề thi theo Môn (`/reports/exams-by-subject`)

- **Bộ lọc**: `namHoc` (input bắt buộc), `hocKy` (optional, 1/2/3)
- **Bảng kết quả** (`GET /reports/exams-by-subject`): `maMon`, `tenMon`, `soLuongDeThi`, có thể nhóm theo học kỳ
- **Biểu đồ optional**: bar chart số lượng đề thi theo môn
- **Nút**: "In báo cáo" (browser print)

### E2. Báo cáo Kết quả thi theo Lớp (`/reports/results-by-class`)

- **Bộ lọc**: `namHoc` (bắt buộc), `hocKy` (optional), `maMon` (optional dropdown)
- **Bảng kết quả** (`GET /reports/results-by-class`): `maLop`, `tenLop`, `tenMon`, `siSo`, `soSVDiThi`, `diemTrungBinh`, có thể `tiLeDat`
- **Biểu đồ optional**: phân bố điểm
- **Nút**: "In báo cáo"

---

## F. SƠ ĐỒ ĐIỀU HƯỚNG (MENU)

**Sidebar Admin**:

1. Dashboard
2. Tài khoản
3. Môn học
4. Lớp học (→ chi tiết SV)
5. Sinh viên
6. Độ khó
7. Quy định
8. Câu hỏi (view-only)
9. Đề thi (view-only)
10. Bảng điểm (view-only)
11. Báo cáo (▸ Theo môn, ▸ Theo lớp)

**Sidebar Giảng viên**:

1. Dashboard
2. Câu hỏi (CRUD)
3. Đề thi (CRUD)
4. Bảng điểm (Nhập / Sửa / Xem)
5. Tra cứu (▸ Môn học, ▸ Lớp học, ▸ Sinh viên, ▸ Độ khó, ▸ Quy định) – read-only
6. Báo cáo (▸ Theo môn, ▸ Theo lớp)

---

## G. CHECKLIST TỔNG (22 màn hình)

| #   | Màn hình                          | Đường dẫn đề xuất                       | Quyền              |
| --- | --------------------------------- | --------------------------------------- | ------------------ |
| 1   | Đăng nhập                         | `/login`                                | Public             |
| 2   | Hồ sơ cá nhân                     | `/profile`                              | Admin + GV         |
| 3   | Đổi mật khẩu (modal)              | –                                       | Admin + GV         |
| 4   | Dashboard                         | `/dashboard`                            | Admin + GV         |
| 5   | Quản lý Tài khoản                 | `/admin/users`                          | Admin              |
| 6   | Quản lý Môn học                   | `/subjects`                             | Admin CRUD, GV xem |
| 7   | Quản lý Lớp học                   | `/classes`                              | Admin CRUD, GV xem |
| 8   | Chi tiết Lớp học + SV             | `/classes/:maLop`                       | Admin CRUD, GV xem |
| 9   | Quản lý Sinh viên                 | `/students`                             | Admin CRUD, GV xem |
| 10  | Quản lý Độ khó                    | `/difficulties`                         | Admin CRUD, GV xem |
| 11  | Quản lý Quy định                  | `/regulations`                          | Admin sửa, GV xem  |
| 12  | Quản lý Câu hỏi                   | `/questions`                            | GV CRUD, Admin xem |
| 13  | Soạn/Sửa Câu hỏi                  | `/questions/new`, `/questions/:id/edit` | GV                 |
| 14  | Quản lý Đề thi                    | `/exams`                                | GV CRUD, Admin xem |
| 15  | Lập/Sửa Đề thi                    | `/exams/new`, `/exams/:id/edit`         | GV                 |
| 16  | Chi tiết Đề thi                   | `/exams/:id`                            | Admin + GV         |
| 17  | Tra cứu Bảng điểm                 | `/grades`                               | Admin + GV         |
| 18  | Nhập điểm từng SV                 | `/grades/new`                           | GV                 |
| 19  | Nhập điểm hàng loạt               | `/grades/batch`                         | GV                 |
| 20  | Báo cáo Đề thi theo Môn           | `/reports/exams-by-subject`             | Admin + GV         |
| 21  | Báo cáo Kết quả theo Lớp          | `/reports/results-by-class`             | Admin + GV         |
| 22  | (Component) Trang lỗi 401/403/404 | `/error/...`                            | Public             |

---

## H. GHI CHÚ KỸ THUẬT FRONTEND

- **Auth flow**: lưu `accessToken` (memory hoặc localStorage), cookie `refreshToken` httpOnly do backend set. Interceptor tự gọi `POST /auth/refresh` khi 401.
- **Role-based UI**: load `/users/me` ngay sau đăng nhập để biết `vaiTro` và `maGV`. Dùng để ẩn nút và bảo vệ route.
- **Validation đồng bộ**: tải `/regulations` 1 lần khi vào hệ thống (cache 60s như backend) để hiển thị giới hạn `SoCauToiDa`, `ThoiLuongMin/Max`, `DiemMin/Max` trực tiếp trong form.
- **Export PDF/DOCX**: backend trả `Content-Disposition: attachment`; frontend chỉ cần `<a target="_blank">` hoặc fetch blob → tạo URL.
- **Phân trang**: tất cả list endpoint hỗ trợ `?page=&limit=` → bắt buộc dùng phân trang server-side, không load all.
- **Toast & xử lý lỗi**: 401 → redirect login, 403 → toast "Không đủ quyền", 404 → trang lỗi, 409 → toast "Trùng khoá".

---

## I. KIỂM CHỨNG END-TO-END

Sau khi UI dựng xong, kiểm thử bằng các kịch bản:

1. Đăng nhập `admin/admin123` → vào `/admin/users`, tạo 1 GV mới → đăng xuất.
2. Đăng nhập GV mới → soạn 5 câu hỏi cho 1 môn → lập đề thi → xem chi tiết → xuất PDF.
3. GV nhập điểm cho lớp đã tạo (batch) → vào trang `/grades` xem bảng điểm.
4. Admin vào `/regulations` đổi `SoCauToiDa` từ 5 → 3 → quay lại form Lập đề thi xem cảnh báo có cập nhật ngay (rule engine invalidate cache).
5. Vào 2 trang báo cáo, đối chiếu số liệu với dữ liệu vừa nhập.
6. Test phân quyền tiêu cực: tài khoản GV thử bấm "Sửa" câu hỏi của GV khác → backend trả 403, UI hiển thị toast & ẩn nút.
