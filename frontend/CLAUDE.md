@AGENTS.md

# Project: Frontend Quản lý Ra đề & Chấm thi SE104

## Stack

- Next.js 14 App Router + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query (React Query) cho fetch + cache
- React Hook Form + Zod cho validation
- Axios với interceptor cho auth/refresh token

## Tài liệu tham khảo (đọc trước khi code)

- `docs/00-backend-spec.md` — 58 endpoint, 11 model Prisma
- `docs/01-ui-spec.md` — spec 22 màn hình, route, quyền hạn
- `docs/02-wireframe.html` — wireframe HTML đầy đủ, mở bằng browser để xem layout

## Quy ước code

- Component dùng PascalCase, hook dùng camelCase với prefix `use`
- API client tách thành `lib/api/<resource>.ts`, mỗi resource 1 file
- Mọi form validate cả client-side (Zod) và hiển thị lỗi server trả về
- Toast dùng `sonner`, lỗi 401 redirect /login, 403 toast warning

## Phân quyền (QUAN TRỌNG)

- KHÔNG implement role switcher ở UI. Toggle Admin/Giảng viên trong file wireframe chỉ là công cụ demo, KHÔNG phải tính năng thật.
- Role được quyết định 100% từ backend:
  - User đăng nhập → backend trả accessToken chứa `vaiTro` (admin | giaovien)
  - Frontend gọi `GET /users/me` để lấy user info + role
  - Sidebar và các nút Sửa/Xoá render điều kiện theo `useAuth().user.vaiTro`
  - Muốn đổi tài khoản → logout → login lại
- Cho phép user tự đổi role ở client = lỗ hổng bảo mật nghiêm trọng (sửa state trong DevTools là thành Admin).
- Giảng viên chỉ thao tác được trên dữ liệu chính chủ: ẩn nút Sửa/Xoá nếu `record.maGV !== currentUser.maGV`.
- Backend phải có guard verify role ở mọi endpoint nhạy cảm — frontend không bao giờ tin tưởng tuyệt đối.

## API Base URL

- Dev: http://localhost:3001/api
- Lưu accessToken ở memory (Zustand), refreshToken là httpOnly cookie do backend set
