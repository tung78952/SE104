# Backend API Specification – SE104

Tài liệu đặc tả đầy đủ cho REST API của hệ thống Quản lý Ra đề & Chấm thi (SE104 – UIT). Sinh ra từ việc đọc trực tiếp source code (`backend/src/**`, `backend/prisma/schema.prisma`) – không phải tóm tắt.

> Tổng số endpoint: **58** (App 1 + Auth 5 + Users 7 + Subjects 5 + Classes 7 + Students 5 + Difficulties 4 + Questions 5 + Exams 5 + Grades 5 + Regulations 4 + Reports 2 + Export 3).

---

## 1. Tổng quan

| Mục                     | Giá trị                                                                  |
| ----------------------- | ------------------------------------------------------------------------ |
| Base URL (dev)          | `http://localhost:5001`                                                  |
| Global prefix           | (không) – tất cả controller mount ở root                                 |
| CORS origin             | `http://localhost:3000`                                                  |
| CORS credentials        | `true` (cookie được gửi kèm)                                             |
| Body parser             | mặc định NestJS (`express.json()`)                                       |
| Cookie parser           | bật ở `main.ts` (`app.use(cookieParser())`) để đọc `refreshToken`        |
| ValidationPipe (global) | `{ whitelist: true, transform: true }`                                   |
| Swagger UI              | `GET /api/docs` (persistAuthorization, BearerAuth name `access-token`)   |
| Static health check     | `GET /` → trả chuỗi text                                                 |
| Auth scheme             | `Authorization: Bearer <accessToken>` + cookie `refreshToken` (httpOnly) |

### 1.1 Error response format

NestJS exception filter trả về JSON chuẩn:

```json
{
  "statusCode": 400,
  "message": "Một mô tả lỗi hoặc mảng validation errors",
  "error": "Bad Request"
}
```

Khi `ValidationPipe` reject DTO, `message` là mảng các thông báo từ `class-validator`.

### 1.2 Mã lỗi thường gặp

| Code                      | Khi nào                              | Ví dụ                                                                                        |
| ------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------- |
| 400 Bad Request           | DTO không hợp lệ, business rule fail | "Số câu hỏi vượt quá quy định", "Năm học phải theo định dạng YYYY-YYYY"                      |
| 401 Unauthorized          | Thiếu/sai token, tài khoản khoá      | "Thiếu access token", "Token không hợp lệ hoặc hết hạn", "Tài khoản đã bị khóa"              |
| 403 Forbidden             | Sai role, không phải chính chủ       | "Chỉ admin/giaovien mới được phép...", "Chỉ giảng viên đã soạn câu hỏi này mới được sửa/xoá" |
| 404 Not Found             | Resource không tồn tại               | "Môn học không tồn tại"                                                                      |
| 409 Conflict              | Trùng khoá, vi phạm ràng buộc        | "Tên đăng nhập đã tồn tại", "Không thể xoá đề thi: còn N dòng điểm tham chiếu"               |
| 500 Internal Server Error | Lỗi không lường trước                | Lỗi DB, mất kết nối                                                                          |

---

## 2. Authentication

### 2.1 Cấu hình

| Mục                   | Giá trị                                                              |
| --------------------- | -------------------------------------------------------------------- |
| Thuật toán mật khẩu   | bcrypt, **salt rounds = 10**                                         |
| JWT secret            | `process.env.JWT_SECRET` (có fallback hardcoded cho dev)             |
| Access token TTL      | **15 phút** (`"15m"`)                                                |
| Refresh token TTL     | **7 ngày** (`"7d"`)                                                  |
| Cookie name (refresh) | `refreshToken`                                                       |
| Cookie options        | `httpOnly: true` (đặt ở `auth.controller`)                           |
| Payload JWT           | `{ sub: maTK, vaiTro: 'admin' \| 'giaovien', maGV: string \| null }` |
| Locked account        | `trangThai = 0` → 401 "Tài khoản đã bị khóa"                         |

### 2.2 Flow

1. **Signin**: `POST /auth/signin` với `tenDangNhap`+`matKhau` → server bcrypt-compare, ký 2 token, set cookie `refreshToken`, trả `{ accessToken, userId }`.
2. **Sử dụng API**: gắn `Authorization: Bearer <accessToken>` mỗi request.
3. **Refresh** (khi accessToken hết hạn): `POST /auth/refresh` – browser tự gửi cookie → server verify → trả `accessToken` mới.
4. **Signout**: `POST /auth/signout` → server clear cookie `refreshToken`.
5. **Change password**: `PATCH /auth/change-password` (cần access token) – chỉ đổi mật khẩu của chính `req.user.sub`.

### 2.3 Guards

| Guard               | File                                     | Hành vi                                                                                                                                     |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `AuthGuard`         | `src/auth/guards/auth.guard.ts`          | Lấy `Authorization: Bearer ...` → `jwtService.verifyAsync()` → gán payload vào `request.user`. Throw `UnauthorizedException` nếu thiếu/sai. |
| `RolesGuard`        | `src/auth/guards/roles.guard.ts`         | Đọc `@Roles(...)` qua Reflector; nếu `request.user.vaiTro` không nằm trong list → throw `ForbiddenException`. Không có `@Roles` ⇒ pass.     |
| `@Roles(...vaiTro)` | `src/auth/decorators/roles.decorator.ts` | Decorator gán `SetMetadata('roles', [...])`. Type: `'admin' \| 'giaovien'`.                                                                 |

---

## 3. Endpoints

Mỗi nhóm liệt kê đầy đủ. Cột **Auth**: ✓ = cần access token, ✗ = public. Cột **Role**: `admin`, `giaovien`, hoặc `both`.

---

### 3.1 App (1 endpoint)

#### `GET /`

| Mục          | Giá trị                                                    |
| ------------ | ---------------------------------------------------------- |
| Auth         | ✗ public                                                   |
| Role         | –                                                          |
| Body         | (none)                                                     |
| Response 200 | `string` – health-check message từ `AppService.getHello()` |

---

### 3.2 Auth (5 endpoints)

#### `POST /auth/signup`

| Mục      | Giá trị                                                                                            |
| -------- | -------------------------------------------------------------------------------------------------- |
| Auth     | ✓                                                                                                  |
| Role     | `admin`                                                                                            |
| Body     | `SignupDto`                                                                                        |
| Response | `201 Created` – `{ message: string, userId: number }`                                              |
| Errors   | 400 (validation), 401 (token), 403 (không phải admin), 409 (`tenDangNhap` hoặc `email` đã tồn tại) |

**`SignupDto`** (`src/auth/dto/signup.dto.ts`):

| Field         | Type   | Required | Validators                                               |
| ------------- | ------ | -------- | -------------------------------------------------------- |
| `tenDangNhap` | string | ✓        | `@IsString`, `@IsNotEmpty`                               |
| `matKhau`     | string | ✓        | `@IsString`, `@IsNotEmpty`, `@MinLength(6)`              |
| `hoTen`       | string | ✓        | `@IsString`, `@IsNotEmpty`                               |
| `email`       | string | ✓        | `@IsEmail`, `@IsNotEmpty`                                |
| `khoaBoMon`   | string | ✗        | `@IsString`, `@IsOptional`                               |
| `vaiTro`      | enum   | ✓        | `@IsEnum(Role)`, `@IsNotEmpty` – `'admin' \| 'giaovien'` |

**Logic**: Nếu `vaiTro='giaovien'` → tạo cả `GiangVien` (auto-gen `maGV = 'GV' + (count+1).padStart(2,'0')`) + `TaiKhoan` lồng nhau.

---

#### `POST /auth/signin`

| Mục      | Giá trị                                                                                            |
| -------- | -------------------------------------------------------------------------------------------------- |
| Auth     | ✗ public                                                                                           |
| Role     | –                                                                                                  |
| Body     | `SigninDto`                                                                                        |
| Response | `200 OK` – `{ accessToken: string, userId: number }` + Set-Cookie `refreshToken=...; HttpOnly`     |
| Errors   | 400 (validation), 401 ("Tài khoản không tồn tại" / "Mật khẩu không đúng" / "Tài khoản đã bị khóa") |

**`SigninDto`** (`src/auth/dto/signin.dto.ts`):

| Field         | Type   | Required | Validators                 |
| ------------- | ------ | -------- | -------------------------- |
| `tenDangNhap` | string | ✓        | `@IsString`, `@IsNotEmpty` |
| `matKhau`     | string | ✓        | `@IsString`, `@IsNotEmpty` |

---

#### `POST /auth/signout`

| Mục      | Giá trị                                                          |
| -------- | ---------------------------------------------------------------- |
| Auth     | ✓                                                                |
| Role     | `admin`, `giaovien`                                              |
| Body     | (none)                                                           |
| Response | `200 OK` – `{ message: string }` + Set-Cookie xoá `refreshToken` |
| Errors   | 401                                                              |

---

#### `POST /auth/refresh`

| Mục      | Giá trị                                            |
| -------- | -------------------------------------------------- |
| Auth     | ✗ public (nhưng cần cookie `refreshToken`)         |
| Role     | –                                                  |
| Body     | (none) – đọc cookie `refreshToken`                 |
| Response | `200 OK` – `{ accessToken: string }`               |
| Errors   | 401 ("Refresh token không hợp lệ hoặc đã hết hạn") |

---

#### `PATCH /auth/change-password`

| Mục      | Giá trị                                                                                 |
| -------- | --------------------------------------------------------------------------------------- |
| Auth     | ✓                                                                                       |
| Role     | `admin`, `giaovien`                                                                     |
| Body     | `ChangePasswordDto`                                                                     |
| Response | `200 OK` – `{ message: string }`                                                        |
| Errors   | 400 (validation), 401 ("Mật khẩu cũ không chính xác"), 404 ("Người dùng không tồn tại") |

**`ChangePasswordDto`** (`src/auth/dto/change-password.dto.ts`):

| Field        | Type   | Required | Validators                                  |
| ------------ | ------ | -------- | ------------------------------------------- |
| `matKhauCu`  | string | ✓        | `@IsString`, `@IsNotEmpty`                  |
| `matKhauMoi` | string | ✓        | `@IsString`, `@IsNotEmpty`, `@MinLength(6)` |

---

### 3.3 Users (7 endpoints)

Controller áp `@UseGuards(AuthGuard, RolesGuard)` ở class-level → tất cả endpoint cần token.

#### `GET /users/me`

| Mục      | Giá trị                                                                     |
| -------- | --------------------------------------------------------------------------- |
| Role     | `admin`, `giaovien`                                                         |
| Response | `200 OK` – `TaiKhoan` (không có `matKhau`) + `giangVien` nested (nếu là GV) |
| Errors   | 401                                                                         |

#### `PATCH /users/me`

| Mục      | Giá trị                         |
| -------- | ------------------------------- |
| Role     | `admin`, `giaovien`             |
| Body     | `UpdateProfileDto`              |
| Response | `200 OK` – profile sau cập nhật |

**`UpdateProfileDto`** (`src/users/dto/update-profile.dto.ts`):

| Field       | Type   | Required | Validators                 |
| ----------- | ------ | -------- | -------------------------- |
| `hoTen`     | string | ✗        | `@IsString`, `@IsOptional` |
| `email`     | string | ✗        | `@IsEmail`, `@IsOptional`  |
| `khoaBoMon` | string | ✗        | `@IsString`, `@IsOptional` |

#### `GET /users`

| Mục      | Giá trị                                          |
| -------- | ------------------------------------------------ |
| Role     | `admin`                                          |
| Query    | `page` (default `"1"`), `limit` (default `"10"`) |
| Response | `{ users: TaiKhoan[], total, page, limit }`      |
| Errors   | 401, 403                                         |

#### `POST /users`

| Mục      | Giá trị                          |
| -------- | -------------------------------- |
| Role     | `admin`                          |
| Body     | `CreateUserDto`                  |
| Response | `201 Created` – TaiKhoan vừa tạo |
| Errors   | 400, 403, 409                    |

**`CreateUserDto`** (`src/users/dto/create-user.dto.ts`):

| Field         | Type   | Required | Validators                                  |
| ------------- | ------ | -------- | ------------------------------------------- |
| `tenDangNhap` | string | ✓        | `@IsString`, `@IsNotEmpty`                  |
| `matKhau`     | string | ✓        | `@IsString`, `@IsNotEmpty`, `@MinLength(6)` |
| `vaiTro`      | enum   | ✓        | `@IsEnum(Role)`, `@IsNotEmpty`              |
| `hoTen`       | string | ✓        | `@IsString`, `@IsNotEmpty`                  |
| `email`       | string | ✓        | `@IsEmail`, `@IsNotEmpty`                   |
| `khoaBoMon`   | string | ✗        | `@IsString`, `@IsOptional`                  |

#### `GET /users/:maTK`

| Mục         | Giá trị                                  |
| ----------- | ---------------------------------------- |
| Role        | `admin`                                  |
| Path params | `maTK` (string – đại diện int trong URL) |
| Response    | `200 OK` – `TaiKhoan`                    |
| Errors      | 401, 403, 404                            |

#### `PATCH /users/:maTK`

| Mục      | Giá trị                     |
| -------- | --------------------------- |
| Role     | `admin`                     |
| Body     | `UpdateUserDto`             |
| Response | `200 OK` – user đã cập nhật |

**`UpdateUserDto`** (`src/users/dto/update-user.dto.ts`):

| Field       | Type   | Required | Validators                     |
| ----------- | ------ | -------- | ------------------------------ |
| `vaiTro`    | enum   | ✗        | `@IsEnum(Role)`, `@IsOptional` |
| `trangThai` | number | ✗        | `@IsNumber`, `@IsOptional`     |
| `hoTen`     | string | ✗        | `@IsString`, `@IsOptional`     |
| `email`     | string | ✗        | `@IsEmail`, `@IsOptional`      |

#### `DELETE /users/:maTK`

| Mục      | Giá trị                                             |
| -------- | --------------------------------------------------- |
| Role     | `admin`                                             |
| Response | `200 OK` – `{ message }`                            |
| Errors   | 401, 403, 404, 409 (xoá chính mình hoặc bị FK chặn) |

---

### 3.4 Subjects (5 endpoints) – Quản lý Môn học

#### `GET /subjects`

| Mục      | Giá trị                                  |
| -------- | ---------------------------------------- |
| Role     | `both`                                   |
| Query    | `page="1"`, `limit="10"`, `search?`      |
| Response | `{ data: MonHoc[], total, page, limit }` |

#### `GET /subjects/:maMon`

| Mục         | Giá trị          |
| ----------- | ---------------- |
| Role        | `both`           |
| Path params | `maMon` (string) |
| Response    | `MonHoc`         |
| Errors      | 404              |

#### `POST /subjects`

| Mục      | Giá trị                       |
| -------- | ----------------------------- |
| Role     | `admin`                       |
| Body     | `CreateSubjectDto`            |
| Response | `201 Created`                 |
| Errors   | 400, 403, 409 (trùng `maMon`) |

**`CreateSubjectDto`** (`src/subjects/dto/create-subject.dto.ts`):

| Field      | Type   | Required | Validators                                    |
| ---------- | ------ | -------- | --------------------------------------------- |
| `maMon`    | string | ✓        | `@IsString`, `@IsNotEmpty`, `@Length(1, 10)`  |
| `tenMon`   | string | ✓        | `@IsString`, `@IsNotEmpty`, `@Length(1, 150)` |
| `soTinChi` | number | ✓        | `@IsInt`, `@Min(1)`                           |

#### `PATCH /subjects/:maMon`

| Mục      | Giá trị            |
| -------- | ------------------ |
| Role     | `admin`            |
| Body     | `UpdateSubjectDto` |
| Response | `200 OK`           |

**`UpdateSubjectDto`**:

| Field      | Type   | Required | Validators                                    |
| ---------- | ------ | -------- | --------------------------------------------- |
| `tenMon`   | string | ✗        | `@IsOptional`, `@IsString`, `@Length(1, 150)` |
| `soTinChi` | number | ✗        | `@IsOptional`, `@IsInt`, `@Min(1)`            |

#### `DELETE /subjects/:maMon`

| Mục      | Giá trị                                            |
| -------- | -------------------------------------------------- |
| Role     | `admin`                                            |
| Response | `200 OK`                                           |
| Errors   | 403, 404, 409 (còn LopHoc/CauHoi/DeThi tham chiếu) |

---

### 3.5 Classes (7 endpoints) – Quản lý Lớp học

#### `GET /classes`

| Mục      | Giá trị                                       |
| -------- | --------------------------------------------- |
| Role     | `both`                                        |
| Query    | `page="1"`, `limit="10"`, `search?`, `maMon?` |
| Response | `{ data: LopHoc[], total, page, limit }`      |

#### `GET /classes/:maLop`

| Mục      | Giá trị                                   |
| -------- | ----------------------------------------- |
| Role     | `both`                                    |
| Response | `LopHoc` kèm `monHoc` và mảng `sinhViens` |

#### `POST /classes`

| Mục    | Giá trị                                                    |
| ------ | ---------------------------------------------------------- |
| Role   | `admin`                                                    |
| Body   | `CreateClassDto`                                           |
| Errors | 400, 403, 404 (`maMon` không tồn tại), 409 (trùng `maLop`) |

**`CreateClassDto`**:

| Field    | Type   | Required | Validators                                    |
| -------- | ------ | -------- | --------------------------------------------- |
| `maLop`  | string | ✓        | `@IsString`, `@IsNotEmpty`, `@Length(1, 10)`  |
| `tenLop` | string | ✓        | `@IsString`, `@IsNotEmpty`, `@Length(1, 100)` |
| `maMon`  | string | ✓        | `@IsString`, `@IsNotEmpty`, `@Length(1, 10)`  |

#### `PATCH /classes/:maLop`

| Mục  | Giá trị          |
| ---- | ---------------- |
| Role | `admin`          |
| Body | `UpdateClassDto` |

**`UpdateClassDto`**:

| Field    | Type   | Required | Validators                                    |
| -------- | ------ | -------- | --------------------------------------------- |
| `tenLop` | string | ✗        | `@IsOptional`, `@IsString`, `@Length(1, 100)` |
| `maMon`  | string | ✗        | `@IsOptional`, `@IsString`, `@Length(1, 10)`  |

#### `DELETE /classes/:maLop`

| Mục    | Giá trị                                               |
| ------ | ----------------------------------------------------- |
| Role   | `admin`                                               |
| Errors | 403, 404, 409 (còn SinhVien hoặc BangDiem tham chiếu) |

#### `POST /classes/:maLop/students`

| Mục      | Giá trị                                     |
| -------- | ------------------------------------------- |
| Role     | `admin`                                     |
| Body     | `AddStudentToClassDto`                      |
| Response | `201 Created` – `SinhVien` vừa thêm         |
| Errors   | 404 (lớp không tồn tại), 409 (trùng `maSV`) |

**`AddStudentToClassDto`** (`src/classes/dto/add-student.dto.ts`):

| Field   | Type   | Required | Validators                                    |
| ------- | ------ | -------- | --------------------------------------------- |
| `maSV`  | string | ✓        | `@IsString`, `@IsNotEmpty`, `@Length(1, 10)`  |
| `hoTen` | string | ✓        | `@IsString`, `@IsNotEmpty`, `@Length(1, 100)` |

#### `DELETE /classes/:maLop/students/:maSV`

| Mục      | Giá trị  |
| -------- | -------- |
| Role     | `admin`  |
| Response | `200 OK` |
| Errors   | 404      |

---

### 3.6 Students (5 endpoints) – Quản lý Sinh viên

#### `GET /students`

| Mục   | Giá trị                                       |
| ----- | --------------------------------------------- |
| Role  | `both`                                        |
| Query | `page="1"`, `limit="10"`, `search?`, `maLop?` |

#### `GET /students/:maSV`

| Role   | Path   |
| ------ | ------ |
| `both` | `maSV` |

#### `POST /students`

| Mục    | Giá trị                                    |
| ------ | ------------------------------------------ |
| Role   | `admin`                                    |
| Body   | `CreateStudentDto`                         |
| Errors | 400, 403, 404 (`maLop` không tồn tại), 409 |

**`CreateStudentDto`**:

| Field   | Type   | Required | Validators                                    |
| ------- | ------ | -------- | --------------------------------------------- |
| `maSV`  | string | ✓        | `@IsString`, `@IsNotEmpty`, `@Length(1, 10)`  |
| `hoTen` | string | ✓        | `@IsString`, `@IsNotEmpty`, `@Length(1, 100)` |
| `maLop` | string | ✓        | `@IsString`, `@IsNotEmpty`, `@Length(1, 10)`  |

#### `PATCH /students/:maSV`

| Mục  | Giá trị            |
| ---- | ------------------ |
| Role | `admin`            |
| Body | `UpdateStudentDto` |

**`UpdateStudentDto`**:

| Field   | Type   | Required | Validators                                    |
| ------- | ------ | -------- | --------------------------------------------- |
| `hoTen` | string | ✗        | `@IsOptional`, `@IsString`, `@Length(1, 100)` |
| `maLop` | string | ✗        | `@IsOptional`, `@IsString`, `@Length(1, 10)`  |

#### `DELETE /students/:maSV`

| Role    | Errors        |
| ------- | ------------- |
| `admin` | 403, 404, 409 |

---

### 3.7 Difficulties (4 endpoints) – Quản lý Độ khó

#### `GET /difficulties`

| Mục      | Giá trị                      |
| -------- | ---------------------------- |
| Role     | `both`                       |
| Response | `DoKho[]` (không phân trang) |

#### `POST /difficulties`

| Mục  | Giá trị               |
| ---- | --------------------- |
| Role | `admin`               |
| Body | `CreateDifficultyDto` |

**`CreateDifficultyDto`**:

| Field      | Type   | Required | Validators                                   |
| ---------- | ------ | -------- | -------------------------------------------- |
| `tenDoKho` | string | ✓        | `@IsString`, `@IsNotEmpty`, `@Length(1, 30)` |

#### `PATCH /difficulties/:id`

| Mục         | Giá trị                       |
| ----------- | ----------------------------- |
| Role        | `admin`                       |
| Path params | `id` (number, `ParseIntPipe`) |
| Body        | `UpdateDifficultyDto`         |

**`UpdateDifficultyDto`**:

| Field      | Type   | Required | Validators                                   |
| ---------- | ------ | -------- | -------------------------------------------- |
| `tenDoKho` | string | ✗        | `@IsOptional`, `@IsString`, `@Length(1, 30)` |

#### `DELETE /difficulties/:id`

| Mục    | Giá trị                               |
| ------ | ------------------------------------- |
| Role   | `admin`                               |
| Errors | 403, 404, 409 (còn CauHoi tham chiếu) |

---

### 3.8 Questions (5 endpoints) – Quản lý Câu hỏi

#### `POST /questions`

| Mục      | Giá trị                                                  |
| -------- | -------------------------------------------------------- |
| Role     | `giaovien`                                               |
| Body     | `CreateQuestionDto`                                      |
| Response | `201 Created` – CauHoi (kèm MonHoc, DoKho, GiangVien)    |
| Errors   | 400, 401, 403 (admin), 404 (maMon/maDoKho không tồn tại) |

Service lấy `maGV` từ `req.user.maGV`; nếu null → `BadRequestException`.

**`CreateQuestionDto`** (`src/questions/dto/create-question.dto.ts`):

| Field     | Type   | Required | Validators                                   |
| --------- | ------ | -------- | -------------------------------------------- |
| `noiDung` | string | ✓        | `@IsString`, `@IsNotEmpty`                   |
| `maMon`   | string | ✓        | `@IsString`, `@IsNotEmpty`, `@Length(1, 10)` |
| `maDoKho` | number | ✓        | `@IsInt`, `@Min(1)`                          |

#### `GET /questions`

| Mục      | Giá trị                                                                    |
| -------- | -------------------------------------------------------------------------- |
| Role     | `both`                                                                     |
| Query    | `page="1"`, `limit="10"`, `maMon?`, `maDoKho?` (chuyển Number), `keyword?` |
| Response | `{ data: CauHoi[], total, page, limit }`                                   |

#### `GET /questions/:id`

| Role   | Path                        |
| ------ | --------------------------- |
| `both` | `id` (number, ParseIntPipe) |

Response kèm `monHoc`, `doKho`, `giangVien`.

#### `PATCH /questions/:id`

| Mục    | Giá trị                                                                            |
| ------ | ---------------------------------------------------------------------------------- |
| Role   | `giaovien`                                                                         |
| Body   | `UpdateQuestionDto`                                                                |
| Errors | 403 (không phải chính chủ – "Chỉ giảng viên đã soạn câu hỏi này mới được sửa/xoá") |

**`UpdateQuestionDto`**:

| Field     | Type   | Required | Validators                                   |
| --------- | ------ | -------- | -------------------------------------------- |
| `noiDung` | string | ✗        | `@IsOptional`, `@IsString`                   |
| `maMon`   | string | ✗        | `@IsOptional`, `@IsString`, `@Length(1, 10)` |
| `maDoKho` | number | ✗        | `@IsOptional`, `@IsInt`, `@Min(1)`           |

#### `DELETE /questions/:id`

| Mục    | Giá trị                                                         |
| ------ | --------------------------------------------------------------- |
| Role   | `giaovien`                                                      |
| Errors | 403 (không chính chủ), 409 (câu đang được dùng trong ≥1 đề thi) |

---

### 3.9 Exams (5 endpoints) – Lập đề thi

#### `POST /exams`

| Mục      | Giá trị                                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| Role     | `giaovien`                                                                                                          |
| Body     | `CreateExamDto`                                                                                                     |
| Response | `201 Created` – DeThi kèm `monHoc`, `giangVien`, `chiTietDeThis`                                                    |
| Errors   | 400 (câu trùng, vượt SoCauToiDa, thoiLuong sai range, câu không cùng môn), 403 (admin), 404 (môn/câu không tồn tại) |

**`CreateExamDto`** (`src/exams/dto/create-exam.dto.ts`):

| Field              | Type     | Required | Validators                                               |
| ------------------ | -------- | -------- | -------------------------------------------------------- |
| `hocKy`            | number   | ✓        | `@IsInt`, `@Min(1)`, `@Max(3)`                           |
| `namHoc`           | string   | ✓        | `@IsString`, `@IsNotEmpty`, `@Matches(/^\d{4}-\d{4}$/)`  |
| `thoiLuong`        | number   | ✓        | `@IsInt`, `@Min(1)`                                      |
| `maMon`            | string   | ✓        | `@IsString`, `@IsNotEmpty`, `@Length(1, 10)`             |
| `danhSachMaCauHoi` | number[] | ✓        | `@IsArray`, `@ArrayMinSize(1)`, `@IsInt({ each: true })` |

Service `exams.service.ts` thực hiện:

1. `validateQuestionList` – không trùng, tồn tại, cùng `maMon`, count ≤ `SoCauToiDa` (RuleEngine, default 5)
2. `validateThoiLuong` – `thoiLuong` ∈ `[ThoiLuongMin, ThoiLuongMax]` (RuleEngine, default 30, 180)
3. Transaction: tạo `DeThi` + nhiều `ChiTietDeThi` (`soCau = index + 1`)

#### `GET /exams`

| Mục   | Giá trị                                                          |
| ----- | ---------------------------------------------------------------- |
| Role  | `both`                                                           |
| Query | `page="1"`, `limit="10"`, `maMon?`, `hocKy?` (Number), `namHoc?` |

#### `GET /exams/:id`

| Role   | Path                |
| ------ | ------------------- |
| `both` | `id` (ParseIntPipe) |

Response kèm `chiTietDeThis[].cauHoi`.

#### `PATCH /exams/:id`

| Mục    | Giá trị                             |
| ------ | ----------------------------------- |
| Role   | `giaovien` (chính chủ)              |
| Body   | `UpdateExamDto`                     |
| Errors | 400 (validation business), 403, 404 |

**`UpdateExamDto`**:

| Field              | Type     | Required | Validators                                                              |
| ------------------ | -------- | -------- | ----------------------------------------------------------------------- |
| `hocKy`            | number   | ✗        | `@IsOptional`, `@IsInt`, `@Min(1)`, `@Max(3)`                           |
| `namHoc`           | string   | ✗        | `@IsOptional`, `@IsString`, `@Matches(/^\d{4}-\d{4}$/)`                 |
| `thoiLuong`        | number   | ✗        | `@IsOptional`, `@IsInt`, `@Min(1)`                                      |
| `danhSachMaCauHoi` | number[] | ✗        | `@IsOptional`, `@IsArray`, `@ArrayMinSize(1)`, `@IsInt({ each: true })` |

#### `DELETE /exams/:id`

| Mục    | Giá trị                                                            |
| ------ | ------------------------------------------------------------------ |
| Role   | `giaovien` (chính chủ)                                             |
| Errors | 403, 404, 409 ("Không thể xoá đề thi: còn N dòng điểm tham chiếu") |

`ChiTietDeThi` được tự động xoá theo `onDelete: Cascade`.

---

### 3.10 Grades (5 endpoints) – Bảng điểm

> **KHÔNG có** `DELETE /grades/:id` (theo §1.5.2 báo cáo).

#### `POST /grades/batch`

| Mục      | Giá trị                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------- |
| Role     | `giaovien`                                                                                     |
| Body     | `CreateGradesBatchDto`                                                                         |
| Response | `201 Created` – `{ count: number, data: BangDiem[] }`                                          |
| Errors   | 400 (trùng SV trong list, SV không thuộc lớp, điểm ngoài range, môn của đề ≠ môn của lớp), 404 |

**`CreateGradesBatchDto`** (`src/grades/dto/create-grades-batch.dto.ts`):

| Field          | Type              | Required | Validators                                                                                      |
| -------------- | ----------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `maLop`        | string            | ✓        | `@IsString`, `@IsNotEmpty`, `@Length(1, 10)`                                                    |
| `maDeThi`      | number            | ✓        | `@IsInt`, `@Min(1)`                                                                             |
| `hocKy`        | number            | ✓        | `@IsInt`, `@Min(1)`, `@Max(3)`                                                                  |
| `namHoc`       | string            | ✓        | `@IsString`, `@Matches(/^\d{4}-\d{4}$/)`                                                        |
| `danhSachDiem` | `GradeEntryDto[]` | ✓        | `@IsArray`, `@ArrayMinSize(1)`, `@ValidateNested({ each: true })`, `@Type(() => GradeEntryDto)` |

**`GradeEntryDto`** (nested):

| Field    | Type   | Required | Validators                                    |
| -------- | ------ | -------- | --------------------------------------------- |
| `maSV`   | string | ✓        | `@IsString`, `@IsNotEmpty`, `@Length(1, 10)`  |
| `diemSo` | number | ✓        | `@IsNumber({ maxDecimalPlaces: 1 })`          |
| `ghiChu` | string | ✗        | `@IsOptional`, `@IsString`, `@Length(0, 255)` |

**Upsert logic**: với mỗi entry, tìm `bangDiem` theo `(maSV, maDeThi, hocKy, namHoc)` – có thì `update(diemSo, ghiChu)`, không thì `create`.

#### `POST /grades`

| Mục      | Giá trị                                                                                             |
| -------- | --------------------------------------------------------------------------------------------------- |
| Role     | `giaovien`                                                                                          |
| Body     | `CreateGradeDto`                                                                                    |
| Response | `201 Created` – BangDiem kèm `sinhVien`, `deThi`                                                    |
| Errors   | 400 (điểm sai, SV không thuộc lớp), 404, 409 ("đã có điểm cho đề thi này. Dùng PATCH để cập nhật.") |

**`CreateGradeDto`** (`src/grades/dto/create-grade.dto.ts`):

| Field     | Type   | Required | Validators                                    |
| --------- | ------ | -------- | --------------------------------------------- |
| `maSV`    | string | ✓        | `@IsString`, `@IsNotEmpty`, `@Length(1, 10)`  |
| `maLop`   | string | ✓        | `@IsString`, `@IsNotEmpty`, `@Length(1, 10)`  |
| `maDeThi` | number | ✓        | `@IsInt`, `@Min(1)`                           |
| `hocKy`   | number | ✓        | `@IsInt`, `@Min(1)`, `@Max(3)`                |
| `namHoc`  | string | ✓        | `@IsString`, `@Matches(/^\d{4}-\d{4}$/)`      |
| `diemSo`  | number | ✓        | `@IsNumber({ maxDecimalPlaces: 1 })`          |
| `ghiChu`  | string | ✗        | `@IsOptional`, `@IsString`, `@Length(0, 255)` |

#### `GET /grades`

| Mục   | Giá trị                                                                               |
| ----- | ------------------------------------------------------------------------------------- |
| Role  | `both`                                                                                |
| Query | `page="1"`, `limit="10"`, `maLop?`, `maDeThi?` (Number), `hocKy?` (Number), `namHoc?` |

#### `GET /grades/:id`

| Role   | Path                |
| ------ | ------------------- |
| `both` | `id` (ParseIntPipe) |

#### `PATCH /grades/:id`

| Mục  | Giá trị          |
| ---- | ---------------- |
| Role | `giaovien`       |
| Body | `UpdateGradeDto` |

**`UpdateGradeDto`**:

| Field    | Type   | Required | Validators                                          |
| -------- | ------ | -------- | --------------------------------------------------- |
| `diemSo` | number | ✗        | `@IsOptional`, `@IsNumber({ maxDecimalPlaces: 1 })` |
| `ghiChu` | string | ✗        | `@IsOptional`, `@IsString`, `@Length(0, 255)`       |

---

### 3.11 Regulations (4 endpoints) – Quy định hệ thống

> **KHÔNG có** `DELETE /regulations/:tenThamSo` (theo §1.5.2).

#### `GET /regulations`

| Role   | Response                       |
| ------ | ------------------------------ |
| `both` | `QuyDinh[]` (không phân trang) |

#### `GET /regulations/:tenThamSo`

| Role   | Path                 |
| ------ | -------------------- |
| `both` | `tenThamSo` (string) |

Errors: 404.

#### `POST /regulations`

| Mục         | Giá trị                                                    |
| ----------- | ---------------------------------------------------------- |
| Role        | `admin`                                                    |
| Body        | `CreateRegulationDto`                                      |
| Side effect | `ruleEngine.invalidate(tenThamSo)` – cache RAM bị xoá ngay |
| Errors      | 400, 403, 409 (trùng `tenThamSo`)                          |

`maTKCapNhat` lấy từ `req.user.sub`.

**`CreateRegulationDto`** (`src/regulations/dto/create-regulation.dto.ts`):

| Field       | Type   | Required | Validators                                    |
| ----------- | ------ | -------- | --------------------------------------------- |
| `tenThamSo` | string | ✓        | `@IsString`, `@IsNotEmpty`, `@MaxLength(50)`  |
| `giaTri`    | string | ✓        | `@IsString`, `@IsNotEmpty`, `@MaxLength(50)`  |
| `moTa`      | string | ✗        | `@IsOptional`, `@IsString`, `@MaxLength(255)` |

#### `PATCH /regulations/:tenThamSo`

| Mục         | Giá trị                            |
| ----------- | ---------------------------------- |
| Role        | `admin`                            |
| Body        | `UpdateRegulationDto`              |
| Side effect | `ruleEngine.invalidate(tenThamSo)` |

**`UpdateRegulationDto`** (`src/regulations/dto/update-regulation.dto.ts`):

| Field    | Type   | Required | Validators                                   |
| -------- | ------ | -------- | -------------------------------------------- |
| `giaTri` | string | ✓        | `@IsString`, `@IsNotEmpty`, `@MaxLength(50)` |

---

### 3.12 Reports (2 endpoints)

#### `GET /reports/exams-by-subject`

| Mục      | Giá trị                                                              |
| -------- | -------------------------------------------------------------------- |
| Role     | `both`                                                               |
| Query    | `namHoc` (required), `hocKy?`                                        |
| Response | Mảng `{ maMon, tenMon, soLuongDeThi, ... }` (aggregate group by môn) |

#### `GET /reports/results-by-class`

| Mục      | Giá trị                                                               |
| -------- | --------------------------------------------------------------------- |
| Role     | `both`                                                                |
| Query    | `namHoc` (required), `hocKy?`, `maMon?`                               |
| Response | Mảng `{ maLop, tenLop, tenMon, siSo, soSVDiThi, diemTrungBinh, ... }` |

---

### 3.13 Export (3 endpoints)

#### `GET /export/exam/:maDeThi/pdf`

| Mục         | Giá trị                                                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Role        | `both`                                                                                                                           |
| Path params | `maDeThi` (number, ParseIntPipe)                                                                                                 |
| Response    | `200 OK`, `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="de-thi-{maDeThi}.pdf"` – `StreamableFile` |
| Errors      | 404                                                                                                                              |

#### `GET /export/exam/:maDeThi/docx`

| Mục         | Giá trị                                                                                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Role        | `both`                                                                                                                                                                 |
| Path params | `maDeThi` (ParseIntPipe)                                                                                                                                               |
| Response    | `200 OK`, `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `Content-Disposition: attachment; filename="de-thi-{maDeThi}.docx"` |

#### `GET /export/grades/pdf`

| Mục      | Giá trị                                                                                 |
| -------- | --------------------------------------------------------------------------------------- |
| Role     | `both`                                                                                  |
| Query    | `maLop` (required), `maDeThi` (required)                                                |
| Response | `200 OK`, `Content-Type: application/pdf`, `filename="bang-diem-{maLop}-{maDeThi}.pdf"` |
| Errors   | 400 (thiếu `maLop`/`maDeThi`), 404                                                      |

---

## 4. Prisma Models

11 model trong `prisma/schema.prisma` (provider `mysql`, naming `@@map` viết HOA).

### 4.1 `GiangVien` → `@@map("GIANGVIEN")`

| Field       | Type    | Modifier                   | Mô tả                  |
| ----------- | ------- | -------------------------- | ---------------------- |
| `maGV`      | String  | `@id @db.VarChar(10)`      | PK – Mã giảng viên     |
| `hoTen`     | String  | `@db.VarChar(100)`         | Họ tên                 |
| `email`     | String  | `@unique @db.VarChar(100)` | Email duy nhất         |
| `khoaBoMon` | String? | `@db.VarChar(100)`         | Khoa/Bộ môn (optional) |

**Relations**:

- `taiKhoan: TaiKhoan?` – 1-1 (optional, ngược chiều `TaiKhoan.giangVien`)
- `cauHois: CauHoi[]` – 1-N
- `deThis: DeThi[]` – 1-N

---

### 4.2 `TaiKhoan` → `@@map("TAIKHOAN")`

| Field         | Type    | Modifier                        | Mô tả                                         |
| ------------- | ------- | ------------------------------- | --------------------------------------------- |
| `maTK`        | Int     | `@id @default(autoincrement())` | PK auto                                       |
| `tenDangNhap` | String  | `@unique @db.VarChar(50)`       | Username                                      |
| `matKhau`     | String  | `@db.VarChar(255)`              | Bcrypt hash                                   |
| `vaiTro`      | String  | `@db.VarChar(20)`               | `"admin"` hoặc `"giaovien"`                   |
| `trangThai`   | Int     | `@default(1)`                   | 1=active, 0=locked                            |
| `maGV`        | String? | `@unique @db.VarChar(10)`       | FK GiangVien (chỉ có khi `vaiTro='giaovien'`) |

**Relations**:

- `giangVien: GiangVien?` – `@relation(fields: [maGV], references: [maGV])`
- `quyDinhs: QuyDinh[]` – `@relation("NguoiCapNhat")` (1-N)

---

### 4.3 `MonHoc` → `@@map("MONHOC")`

| Field      | Type   | Modifier              | Mô tả                     |
| ---------- | ------ | --------------------- | ------------------------- |
| `maMon`    | String | `@id @db.VarChar(10)` | PK – Mã môn (vd: `SE104`) |
| `tenMon`   | String | `@db.VarChar(150)`    | Tên môn                   |
| `soTinChi` | Int    | –                     | Số tín chỉ                |

**Relations**: `cauHois: CauHoi[]`, `deThis: DeThi[]`, `lopHocs: LopHoc[]` (đều 1-N).

---

### 4.4 `DoKho` → `@@map("DOKHO")`

| Field      | Type   | Modifier                        |
| ---------- | ------ | ------------------------------- |
| `maDoKho`  | Int    | `@id @default(autoincrement())` |
| `tenDoKho` | String | `@unique @db.VarChar(30)`       |

**Relations**: `cauHois: CauHoi[]`.

Seed mặc định: `Dễ`, `Trung Bình`, `Phức Tạp`, `Khó` (theo QĐ1).

---

### 4.5 `CauHoi` → `@@map("CAUHOI")`

| Field      | Type     | Modifier                                     |
| ---------- | -------- | -------------------------------------------- |
| `maCauHoi` | Int      | `@id @default(autoincrement())`              |
| `noiDung`  | String   | `@db.Text`                                   |
| `ngayTao`  | DateTime | `@default(now())`                            |
| `maMon`    | String   | `@db.VarChar(10)` – FK MonHoc                |
| `maDoKho`  | Int      | – FK DoKho                                   |
| `maGV`     | String   | `@db.VarChar(10)` – FK GiangVien (ownership) |

**Relations**:

- `monHoc`, `doKho`, `giangVien` (N-1)
- `chiTietDeThis: ChiTietDeThi[]` (1-N)

---

### 4.6 `DeThi` → `@@map("DETHI")`

| Field       | Type     | Modifier                              |
| ----------- | -------- | ------------------------------------- |
| `maDeThi`   | Int      | `@id @default(autoincrement())`       |
| `hocKy`     | Int      | `@db.TinyInt`                         |
| `namHoc`    | String   | `@db.VarChar(9)` (format `YYYY-YYYY`) |
| `thoiLuong` | Int      | – (phút)                              |
| `ngayTao`   | DateTime | `@default(now())`                     |
| `maMon`     | String   | `@db.VarChar(10)` – FK MonHoc         |
| `maGV`      | String   | `@db.VarChar(10)` – FK GiangVien      |

**Relations**: `monHoc`, `giangVien` (N-1); `chiTietDeThis`, `bangDiems` (1-N).

---

### 4.7 `ChiTietDeThi` → `@@map("CHITIETDETHI")` – junction

| Field      | Type | Modifier                              |
| ---------- | ---- | ------------------------------------- |
| `maDeThi`  | Int  | – PK composite                        |
| `maCauHoi` | Int  | – PK composite                        |
| `soCau`    | Int  | `@db.TinyInt` – thứ tự câu (1,2,3...) |

**Constraints**: `@@id([maDeThi, maCauHoi])`

**Relations** (cả 2 `onDelete: Cascade`):

- `deThi: DeThi @relation(fields: [maDeThi], references: [maDeThi], onDelete: Cascade)`
- `cauHoi: CauHoi @relation(fields: [maCauHoi], references: [maCauHoi], onDelete: Cascade)`

---

### 4.8 `LopHoc` → `@@map("LOPHOC")`

| Field    | Type   | Modifier                      |
| -------- | ------ | ----------------------------- |
| `maLop`  | String | `@id @db.VarChar(10)`         |
| `tenLop` | String | `@db.VarChar(100)`            |
| `maMon`  | String | `@db.VarChar(10)` – FK MonHoc |

**Relations**: `monHoc` (N-1); `sinhViens`, `bangDiems` (1-N).

---

### 4.9 `SinhVien` → `@@map("SINHVIEN")`

| Field   | Type   | Modifier                      |
| ------- | ------ | ----------------------------- |
| `maSV`  | String | `@id @db.VarChar(10)`         |
| `hoTen` | String | `@db.VarChar(100)`            |
| `maLop` | String | `@db.VarChar(10)` – FK LopHoc |

**Relations**: `lopHoc` (N-1); `bangDiems` (1-N).

---

### 4.10 `BangDiem` → `@@map("BANGDIEM")`

| Field        | Type    | Modifier                         |
| ------------ | ------- | -------------------------------- |
| `maBangDiem` | Int     | `@id @default(autoincrement())`  |
| `hocKy`      | Int     | `@db.TinyInt`                    |
| `namHoc`     | String  | `@db.VarChar(9)`                 |
| `diemSo`     | Decimal | `@db.Decimal(4, 1)` (0.0 – 10.0) |
| `ghiChu`     | String? | `@db.VarChar(255)`               |
| `maSV`       | String  | `@db.VarChar(10)` – FK SinhVien  |
| `maLop`      | String  | `@db.VarChar(10)` – FK LopHoc    |
| `maDeThi`    | Int     | – FK DeThi                       |

**Relations**: `sinhVien`, `lopHoc`, `deThi` (đều N-1).

---

### 4.11 `QuyDinh` → `@@map("QUYDINH")`

| Field         | Type     | Modifier                                         |
| ------------- | -------- | ------------------------------------------------ |
| `maQuyDinh`   | Int      | `@id @default(autoincrement())`                  |
| `tenThamSo`   | String   | `@unique @db.VarChar(50)`                        |
| `giaTri`      | String   | `@db.VarChar(50)` (string, parse number khi cần) |
| `moTa`        | String?  | `@db.VarChar(255)`                               |
| `ngayCapNhat` | DateTime | `@default(now())`                                |
| `maTKCapNhat` | Int      | – FK TaiKhoan                                    |

**Relations**: `nguoiCapNhat: TaiKhoan @relation("NguoiCapNhat", fields: [maTKCapNhat], references: [maTK])`.

---

## 5. Business Rules

### 5.1 RuleEngineService (`src/regulations/rule-engine.service.ts`)

| Mục                | Giá trị                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| Cache TTL          | **60 giây** (60 000 ms)                                                                          |
| API                | `get(tenThamSo, defaultValue?)`, `getNumber(tenThamSo, defaultValue?)`, `invalidate(tenThamSo?)` |
| Invalidate trigger | `regulations.service.create` và `regulations.service.update` đều gọi `invalidate(tenThamSo)`     |
| Lỗi không default  | `InternalServerErrorException("Quy định '{tên}' không tồn tại trong hệ thống")`                  |

**5 tham số mặc định** (seed):

| `tenThamSo`    | Default | Kiểu       | Ràng buộc cross-param |
| -------------- | ------- | ---------- | --------------------- |
| `SoCauToiDa`   | `5`     | int        | ≥ 1                   |
| `ThoiLuongMin` | `30`    | int (phút) | < `ThoiLuongMax`      |
| `ThoiLuongMax` | `180`   | int (phút) | > `ThoiLuongMin`      |
| `DiemMin`      | `0`     | number     | < `DiemMax`           |
| `DiemMax`      | `10`    | number     | > `DiemMin`           |

### 5.2 Question ownership (`src/questions/questions.service.ts`)

- `PATCH /questions/:id`, `DELETE /questions/:id`: so sánh `question.maGV === currentUser.maGV`. Sai → `ForbiddenException("Chỉ giảng viên đã soạn câu hỏi này mới được sửa/xoá")`.
- `DELETE` thêm check: nếu `chiTietDeThi.count({ where: { maCauHoi } }) > 0` → `ConflictException` ("câu đang được sử dụng trong N đề thi").

### 5.3 Exam validation (`src/exams/exams.service.ts`)

`validateQuestionList(danhSachMaCauHoi, maMon)`:

1. Không có ID trùng trong array → BadRequest.
2. `length ≤ SoCauToiDa` (qua RuleEngine).
3. Tất cả `maCauHoi` tồn tại → nếu thiếu, BadRequest liệt kê.
4. Tất cả câu cùng `maMon` → nếu sai, BadRequest.

`validateThoiLuong(thoiLuong)`: `thoiLuong ∈ [ThoiLuongMin, ThoiLuongMax]`.

`create()` chạy validate xong → **transaction** tạo `DeThi` + nhiều `ChiTietDeThi` (`soCau = index + 1`).

`PATCH`, `DELETE`: ownership như Question. `DELETE` check `bangDiem.count > 0` → 409.

### 5.4 Grade validation (`src/grades/grades.service.ts`)

- `validateScore(diemSo)`: `diemSo ∈ [DiemMin, DiemMax]` (RuleEngine).
- SV phải thuộc `maLop` (check `sinhVien.maLop`).
- Đề thi phải cùng môn với lớp (cross-check `deThi.maMon === lopHoc.maMon`).

**Batch upsert**:

- Không cho `maSV` trùng trong cùng `danhSachDiem`.
- Mỗi entry: tìm `bangDiem` theo `(maSV, maDeThi, hocKy, namHoc)` – có → `update(diemSo, ghiChu)`, không → `create`.
- Toàn bộ chạy trong 1 transaction.

**Single create**: nếu đã có record `(maSV, maDeThi, hocKy, namHoc)` → 409 "Dùng PATCH để cập nhật".

### 5.5 Cascade behavior

| Khi xoá                                     | Hành vi DB                                       | Service handler                                   |
| ------------------------------------------- | ------------------------------------------------ | ------------------------------------------------- |
| `DeThi`                                     | `ChiTietDeThi` xoá tự động (`onDelete: Cascade`) | Service chặn nếu `BangDiem.count > 0` (409)       |
| `CauHoi`                                    | `ChiTietDeThi` xoá tự động                       | Service chặn nếu câu đang dùng trong đề thi (409) |
| `MonHoc`, `LopHoc`, `SinhVien`, `GiangVien` | NO ACTION (Prisma sẽ throw FK error)             | Service nên catch và trả 409                      |

### 5.6 Auth & user

- Bcrypt rounds 10, JWT access 15m / refresh 7d.
- Signin trả 401 nếu `trangThai = 0` ("Tài khoản đã bị khóa").
- Auto-gen `maGV = 'GV' + (count+1).padStart(2,'0')` khi signup GV.
- `/users/me` trả profile (đã loại `matKhau`) kèm `giangVien` nested.

---

## 6. Phụ lục

### 6.1 Ma trận quyền (Role × Resource)

| Resource                  | Admin                  | Giảng viên             |
| ------------------------- | ---------------------- | ---------------------- |
| Tài khoản (users)         | CRUD (full)            | Xem/sửa `/me`          |
| Môn học                   | CRUD                   | Xem                    |
| Lớp học (+ add/remove SV) | CRUD                   | Xem                    |
| Sinh viên                 | CRUD                   | Xem                    |
| Độ khó                    | CRUD                   | Xem                    |
| Quy định                  | Thêm + Sửa (KHÔNG Xoá) | Xem                    |
| Câu hỏi                   | Xem                    | CRUD chính chủ         |
| Đề thi                    | Xem                    | CRUD chính chủ         |
| Bảng điểm                 | Xem                    | Thêm + Sửa (KHÔNG Xoá) |
| Báo cáo                   | Xem                    | Xem                    |
| Export PDF/DOCX           | Có                     | Có                     |

### 6.2 Quy ước tên field

Tất cả field viết tiếng Việt không dấu, camelCase:

- Khoá: `maTK`, `maGV`, `maMon`, `maLop`, `maSV`, `maCauHoi`, `maDeThi`, `maDoKho`, `maBangDiem`, `maQuyDinh`
- Dữ liệu: `tenDangNhap`, `matKhau`, `vaiTro`, `trangThai`, `hoTen`, `email`, `khoaBoMon`, `tenMon`, `soTinChi`, `tenLop`, `tenDoKho`, `noiDung`, `ngayTao`, `hocKy`, `namHoc`, `thoiLuong`, `soCau`, `diemSo`, `ghiChu`, `tenThamSo`, `giaTri`, `moTa`, `ngayCapNhat`

### 6.3 Default Regulations (seed)

| `tenThamSo`    | `giaTri` | `moTa`                           |
| -------------- | -------- | -------------------------------- |
| `SoCauToiDa`   | `5`      | Số câu hỏi tối đa trong 1 đề thi |
| `ThoiLuongMin` | `30`     | Thời lượng thi tối thiểu (phút)  |
| `ThoiLuongMax` | `180`    | Thời lượng thi tối đa (phút)     |
| `DiemMin`      | `0`      | Điểm số tối thiểu                |
| `DiemMax`      | `10`     | Điểm số tối đa                   |

### 6.4 Tài khoản seed mặc định

- `admin` / `admin123`
- `gv_thien` / `123456` (`maGV = GV01`, email `thien@uit.edu.vn`)

### 6.5 Tổng kết số endpoint = 58

```
App         1
Auth        5
Users       7
Subjects    5
Classes     7
Students    5
Difficulties 4
Questions   5
Exams       5
Grades      5
Regulations 4
Reports     2
Export      3
────────── ──
Total      58
```

---

_Cập nhật: 2026-05-19. Sinh ra từ source code; nếu code thay đổi, file này cần đồng bộ._
