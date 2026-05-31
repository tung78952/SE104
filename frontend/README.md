# Frontend Quản lý Ra đề & Chấm thi — SE104

Hệ thống quản lý ra đề và chấm thi cho đồ án môn SE104 (Nhập môn Công nghệ Phần mềm,
UIT). Frontend gồm 22 màn hình phục vụ 2 vai trò Admin và Giảng viên, gọi 58 endpoint
REST của backend NestJS đi kèm.

## Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript** strict
- **Tailwind CSS 4** + **shadcn/ui** + **@base-ui/react**
- **TanStack Query** (server-state cache) + **Zustand** (auth state in-memory)
- **React Hook Form** + **Zod** (schema validation đồng bộ client/server)
- **Axios** với interceptor: tự refresh token, 401 → `/login`, 403 GET → `/403`
- **MSW** cho mock backend khi backend chưa sẵn (`src/mocks/handlers.ts`)
- **Vitest** + **Testing Library** + **Playwright** cho unit & e2e
- **Recharts** cho biểu đồ báo cáo

## Yêu cầu môi trường

- Node.js ≥ 20
- npm ≥ 10

## Setup

```bash
npm install
cp .env.example .env.local      # chỉnh NEXT_PUBLIC_API_URL nếu cần
npm run dev                     # http://localhost:3000
```

Mặc định frontend gọi backend ở `http://localhost:5001`. Khi backend chưa chạy, MSW
sẽ chặn các request và trả mock data cố định trong `src/mocks/handlers.ts`, đủ để
demo toàn bộ luồng UI.

## Scripts

| Lệnh                    | Tác dụng                                         |
| ----------------------- | ------------------------------------------------ |
| `npm run dev`           | Dev server (Turbopack, hot reload)               |
| `npm run build`         | Production build                                 |
| `npm run start`         | Chạy bản build                                   |
| `npm run lint`          | ESLint (0 error, 0 warning required)             |
| `npm run typecheck`     | `tsc --noEmit` (strict)                          |
| `npm run test`          | Vitest unit + component                          |
| `npm run test:coverage` | Coverage (mục tiêu ≥ 70%)                        |
| `npm run test:e2e`      | Playwright e2e (smoke, auth, CRUD, 6 acceptance) |
| `npm run format`        | Prettier (write)                                 |
| `npm run format:check`  | Prettier (check)                                 |

## Tài khoản demo (qua MSW)

- `admin / admin123` — vai trò Admin
- `gv_thien / gv12345` — vai trò Giảng viên (sở hữu một số câu hỏi mẫu)

Role do backend trả qua `GET /users/me` quyết định — frontend không có role switcher.
Đổi vai trò = đăng xuất rồi đăng nhập tài khoản khác.

## Cấu trúc thư mục

```
src/
  app/                      # Next.js App Router routes
    (auth/error pages)
    403/                    # 403 forbidden
    admin/users/            # 5  Quản lý Tài khoản
    classes/, subjects/, students/, difficulties/, regulations/
    questions/, exams/, grades/
    reports/                # exams-by-subject, results-by-class
    dashboard/, login/, profile/
    error.tsx               # global error boundary
    not-found.tsx           # 404
  components/
    common/                 # DataTable, FormModal, ResourcePage, ...
    catalog/                # Form components cho 6 catalogs
    questions/, exams/, grades/, profile/
    dashboard/, layout/
    ui/                     # shadcn/ui primitives (Button, Dialog, ...)
  hooks/                    # useCrudResource, usePermission, useExamForm, ...
  lib/
    api/                    # 1 file per resource (typed axios wrappers)
    auth/                   # Zustand auth store
    schemas/                # Zod schemas (auth + catalog + exam + grade)
    utils/                  # csv, download, academic-year
    constants/              # messages, roles, regulations
  mocks/                    # MSW handlers + bootstrap (dev only)
  types/                    # Domain models (TaiKhoan, MonHoc, ...)
tests/
  e2e/                      # Playwright suites
    smoke.spec.ts
    auth-flow.spec.ts
    crud-flow.spec.ts
    full-acceptance.spec.ts # 6 acceptance scenarios per UI spec §I
```

## Phân quyền

- Mọi endpoint sensitive được backend kiểm tra theo `vaiTro` trong JWT.
- Frontend chỉ ẩn nút (Sửa, Xoá, Thêm) theo `usePermission(resource)` —
  giảng viên còn ẩn theo `useIsOwner(record.maGV)`.
- Cho phép user tự đổi role ở client là lỗ hổng nghiêm trọng → không bao giờ làm.

## Tài liệu

- `docs/00-backend-spec.md` — 58 endpoints, 11 Prisma models
- `docs/01-ui-spec.md` — 22 màn hình, route, quyền, kiểm chứng E2E
- `docs/02-wireframe.html` — wireframe HTML đầy đủ
- `docs/CHANGELOG.md` — nhật ký 5 phase phát triển

## Kiểm chứng E2E (6 kịch bản chính, UI spec §I)

`tests/e2e/full-acceptance.spec.ts`:

1. Admin tạo GV `testgv` → logout
2. `testgv` soạn 5 câu hỏi → lập đề thi → xem chi tiết → xuất PDF
3. `testgv` nhập điểm batch → xem `/grades`
4. Admin đổi `SoCauToiDa` 50 → 3 → form lập đề cập nhật giới hạn ngay
5. Hai trang báo cáo hiển thị số liệu khớp
6. `testgv` thử sửa câu hỏi của GV khác → backend 403, UI ẩn nút Sửa

Chạy:

```bash
npx playwright install --with-deps chromium      # lần đầu
npm run test:e2e
```
