# Changelog — Frontend SE104

Toàn bộ tiến trình xây dựng frontend chia thành 5 phase, mỗi phase 1 commit.

## v1.0.0 — 2026-05-21

### Phase 1 — Setup & foundation

- Next.js 16 App Router + TypeScript strict + Tailwind 4
- shadcn/ui + @base-ui/react primitives
- TanStack Query, Zustand auth store, Axios interceptor + token refresh
- MSW mock layer cho dev khi backend chưa sẵn
- Vitest + Testing Library + Playwright skeleton

### Phase 2 — Auth, dashboard, profile (commit `c9be7b6`)

- `/login` (RHF + Zod, password show/hide, error handling)
- `/dashboard` (4 stat cards + biểu đồ exams-by-subject + 2 recent lists)
- `/profile` + modal đổi mật khẩu, sidebar collapse, role label

### Phase 3 — CRUD 6 danh mục (commit `f6a898f`)

- Pattern chung: `useCrudResource`, `ResourcePage`, `DataTable`, `FormModal`
- Subjects, classes (+ chi tiết SV), students, difficulties, regulations, admin/users
- Phân trang server-side, search debounced 300ms, toast & xử lý lỗi 401/403/409

### Phase 4 — Nghiệp vụ

- **4a** Questions module + shared foundation (commit `99e2bec`)
- **4b** Exams module với QuestionPicker, ràng buộc theo QuyDinh (commit `10b9071`)
- **4c** Grades module với batch input + CSV import (commit `1c991da`)

### Phase 5 — Reports, error pages, polish, final QA (commit pending)

- `/reports/exams-by-subject` — filter namHoc + hocKy, bar chart HK1/HK2,
  bảng có cột Tổng (bold), nút "In báo cáo" + CSS `@media print`
- `/reports/results-by-class` — 4 stat cards (SV dự thi, Điểm TB, Tỉ lệ đạt,
  Tổng lớp), bảng chi tiết, filter môn học
- `app/not-found.tsx`, `app/error.tsx`, refresh `app/403/page.tsx`
- Axios interceptor: 401 → `/login`, 403 GET → `/403`, 403 mutation → toast
- Polish UX: DataTable skeleton thay spinner, empty state có icon + action,
  FormModal có spinner trong submit button, Toaster top-right + closeButton +
  duration 3s, AppShell có drawer mobile (sidebar collapse), Esc đóng drawer
- Final clean: knip 0 unused, depcheck 0 unused, console.log 0, `any` 0,
  gỡ `@radix-ui/*` + `tailwindcss-animate` (dùng @base-ui và tw-animate-css)
- E2E `tests/e2e/full-acceptance.spec.ts` — 6 kịch bản kiểm chứng theo UI spec §I
- README.md ở root, docs/CHANGELOG.md (file này)

## Kết quả cuối

- 32 test files, 177 tests pass
- ESLint: 0 error, 0 warning
- TypeScript strict: 0 error
- knip: 0 unused export, file, hay dependency
- depcheck: 0 missing/unused dependency
- 25 routes built thành công (Next 16 / Turbopack)
