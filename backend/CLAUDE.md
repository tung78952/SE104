# Hướng dẫn cho Claude Code

Đây là backend cho đồ án **SE104 - Hệ thống Quản lý Ra đề và Chấm thi** (Đại học UIT).
File `BACKEND_PLAN.md` ở thư mục gốc của repo chứa kế hoạch chi tiết cần thực hiện.

## Quy tắc tối quan trọng

### Ngôn ngữ
- **Code và tên file**: tiếng Anh (NestJS convention)
- **Tên field trong DTO/database**: **tiếng Việt không dấu** theo Prisma schema có sẵn (`maMon`, `tenMon`, `hocKy`, `namHoc`, `noiDung`, `thoiLuong`, `diemSo`, ...)
- **Message lỗi/trả về cho người dùng**: **tiếng Việt có dấu** ("Môn học không tồn tại", "Số câu hỏi vượt quá quy định", ...)
- **Comment**: tiếng Việt cho logic nghiệp vụ, tiếng Anh cho kỹ thuật
- **Tên bảng trong DB**: VIẾT HOA không dấu (đã có sẵn qua `@@map("MONHOC")`)

### Pattern phải tuân theo
Khi tạo module mới, **bắt buộc** follow pattern của các module đã có:
- `src/subjects/` (CRUD đơn giản + tìm kiếm phân trang)
- `src/classes/` (CRUD + nested resource)
- `src/students/` (CRUD đơn giản)

KHÔNG ĐƯỢC:
- Đổi style của các module hiện có (ngay cả khi thấy chưa hoàn hảo)
- Tự ý thêm thư viện ngoài (TypeORM, GraphQL, Redis, v.v.)
- Đổi cấu trúc thư mục
- Thay đổi schema Prisma đã có (chỉ thêm migration mới nếu thực sự cần)
- Xóa hoặc sửa code đã chạy được (chỉ thêm)

### Pattern bắt buộc cho mỗi module mới
```
src/<module-name>/
├── <module-name>.module.ts
├── <module-name>.controller.ts
├── <module-name>.service.ts
└── dto/
    ├── create-*.dto.ts
    └── update-*.dto.ts
```

Sau khi tạo xong module:
1. Đăng ký module vào `src/app.module.ts`
2. Build kiểm tra lỗi: `npm run build`
3. Đề xuất curl/Postman test case để verify

## Phân quyền (RẤT QUAN TRỌNG)

Mỗi endpoint **phải có** `@UseGuards(AuthGuard, RolesGuard)` và `@Roles(...)`:
- Endpoint chỉ Admin: `@Roles('admin')`
- Endpoint Admin và Giảng viên: `@Roles('admin', 'giaovien')`
- Endpoint công khai (chỉ signin/signup): bỏ guard

Quy ước phân quyền (theo Chương 1 Mục 1.5 của báo cáo):
- **Admin**: quản lý tài khoản, môn học, lớp học, quy định
- **Giảng viên**: soạn câu hỏi, lập đề thi, nhập điểm (chỉ thao tác trên dữ liệu mình tạo trừ khi có chỉ định khác)
- **Cả hai**: tra cứu, xem báo cáo

## Quy tắc nghiệp vụ (KHÔNG hard-code)

Tất cả các con số dưới đây đọc từ bảng `QuyDinh` qua `RuleEngineService` — không bao giờ hard-code trong code:

| Tham số | Giá trị mặc định | Phục vụ QĐ |
|---|---|---|
| `SoCauToiDa` | 5 | QĐ2 (số câu tối đa trong đề) |
| `ThoiLuongMin` | 30 | QĐ2 (phút) |
| `ThoiLuongMax` | 180 | QĐ2 (phút) |
| `DiemMin` | 0 | QĐ5 |
| `DiemMax` | 10 | QĐ5 |

Nếu hard-code các giá trị này, **bài bị trừ điểm** vì không khớp với QĐ6 (tính tiến hóa).

## Lệnh chạy thường dùng

```bash
# Khởi động DB
npm run db:up

# Tạo migration mới sau khi sửa schema (nếu cần)
npm run db:migrate

# Generate Prisma Client sau khi sửa schema
npm run db:generate

# Seed dữ liệu mẫu
npm run db:seed

# Chạy dev server (auto-reload)
npm run start:dev

# Build production
npm run build

# Lint
npm run lint
```

## Test

Sau khi xong mỗi module, **tự test** bằng curl trước khi báo xong:

```bash
# 1. Đăng nhập Admin lấy token
curl -X POST http://localhost:5001/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"tenDangNhap":"admin","matKhau":"admin123"}'

# 2. Lấy access_token, gọi endpoint cần test
TOKEN="<paste-here>"
curl http://localhost:5001/<endpoint> \
  -H "Authorization: Bearer $TOKEN"
```

## Khi gặp lỗi/không chắc chắn

- Đọc lại `BACKEND_PLAN.md` để check yêu cầu
- Xem các module đã có (`subjects`, `classes`, `students`) làm tham khảo pattern
- Hỏi người dùng nếu yêu cầu mơ hồ — KHÔNG đoán bừa rồi làm

## Phạm vi công việc

Chỉ làm phần backend. KHÔNG động vào:
- Frontend (nếu có sau này)
- Báo cáo `.docx`
- File schema Prisma cũ (chỉ thêm migration mới nếu cần)
- Các module đã chạy được (`auth`, `users`, `subjects`, `classes`, `students`)
