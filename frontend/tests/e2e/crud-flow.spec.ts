import { test, expect, type Route, type Page } from '@playwright/test';

const API = 'http://localhost:5001';

interface MonHoc {
  maMon: string;
  tenMon: string;
  soTinChi: number;
}
interface LopHoc {
  maLop: string;
  tenLop: string;
  maMon: string;
}
interface SinhVien {
  maSV: string;
  hoTen: string;
  maLop: string;
}

interface MockState {
  currentUser: ReturnType<typeof adminUser>;
  subjects: MonHoc[];
  classes: LopHoc[];
  students: SinhVien[];
}

function adminUser() {
  return {
    maTK: 1,
    tenDangNhap: 'admin',
    vaiTro: 'admin',
    trangThai: 1,
    maGV: null,
    giangVien: null,
  };
}

async function mockBackend(page: Page): Promise<MockState> {
  const state: MockState = {
    currentUser: adminUser(),
    subjects: [{ maMon: 'CSDL', tenMon: 'Cơ sở dữ liệu', soTinChi: 4 }],
    classes: [],
    students: [],
  };

  function json(route: Route, status: number, body: unknown): Promise<void> {
    return route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  }

  await page.route(`${API}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    const method = req.method();

    if (method === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': 'http://localhost:3000',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        },
      });
    }

    // Auth
    if (path === '/auth/signin' && method === 'POST') {
      const body = (req.postDataJSON?.() ?? {}) as { tenDangNhap?: string; matKhau?: string };
      if (body.tenDangNhap === 'admin' && body.matKhau === 'admin123') {
        return json(route, 200, { accessToken: 'mock-admin-token', userId: 1 });
      }
      return json(route, 401, { statusCode: 401, message: 'Sai thông tin' });
    }
    if (path === '/auth/refresh' && method === 'POST') {
      return json(route, 200, { accessToken: 'r' });
    }
    if (path === '/auth/signout' && method === 'POST') {
      return json(route, 200, { message: 'ok' });
    }

    // Me
    if (path === '/users/me' && method === 'GET') {
      return json(route, 200, state.currentUser);
    }

    // Subjects
    if (path === '/subjects' && method === 'GET') {
      return json(route, 200, {
        data: state.subjects,
        total: state.subjects.length,
        page: 1,
        limit: 10,
      });
    }
    if (path === '/subjects' && method === 'POST') {
      const body = (req.postDataJSON?.() ?? {}) as MonHoc;
      state.subjects.unshift(body);
      return json(route, 201, body);
    }
    const subjectIdMatch = path.match(/^\/subjects\/(.+)$/);
    if (subjectIdMatch && method === 'PATCH') {
      const id = subjectIdMatch[1];
      const body = (req.postDataJSON?.() ?? {}) as Partial<MonHoc>;
      const idx = state.subjects.findIndex((s) => s.maMon === id);
      if (idx === -1) return json(route, 404, { statusCode: 404, message: 'Not found' });
      state.subjects[idx] = { ...state.subjects[idx], ...body };
      return json(route, 200, state.subjects[idx]);
    }
    if (subjectIdMatch && method === 'DELETE') {
      const id = subjectIdMatch[1];
      state.subjects = state.subjects.filter((s) => s.maMon !== id);
      return json(route, 200, { message: 'ok' });
    }

    // Classes
    if (path === '/classes' && method === 'GET') {
      const withMon = state.classes.map((c) => ({
        ...c,
        monHoc: state.subjects.find((s) => s.maMon === c.maMon),
      }));
      return json(route, 200, {
        data: withMon,
        total: withMon.length,
        page: 1,
        limit: 10,
      });
    }
    if (path === '/classes' && method === 'POST') {
      const body = (req.postDataJSON?.() ?? {}) as LopHoc;
      state.classes.unshift(body);
      return json(route, 201, body);
    }
    const classMatch = path.match(/^\/classes\/([^/]+)$/);
    if (classMatch && method === 'GET') {
      const id = classMatch[1];
      const c = state.classes.find((x) => x.maLop === id);
      if (!c) return json(route, 404, { statusCode: 404, message: 'Not found' });
      return json(route, 200, {
        ...c,
        monHoc: state.subjects.find((s) => s.maMon === c.maMon),
        sinhViens: state.students.filter((sv) => sv.maLop === id),
      });
    }
    if (classMatch && method === 'PATCH') {
      const id = classMatch[1];
      const body = (req.postDataJSON?.() ?? {}) as Partial<LopHoc>;
      const idx = state.classes.findIndex((c) => c.maLop === id);
      if (idx === -1) return json(route, 404, { statusCode: 404, message: 'Not found' });
      state.classes[idx] = { ...state.classes[idx], ...body };
      return json(route, 200, state.classes[idx]);
    }
    if (classMatch && method === 'DELETE') {
      const id = classMatch[1];
      state.classes = state.classes.filter((c) => c.maLop !== id);
      state.students = state.students.filter((sv) => sv.maLop !== id);
      return json(route, 200, { message: 'ok' });
    }
    const classStudentMatch = path.match(/^\/classes\/([^/]+)\/students(?:\/([^/]+))?$/);
    if (classStudentMatch && method === 'POST') {
      const maLop = classStudentMatch[1];
      const body = (req.postDataJSON?.() ?? {}) as { maSV: string; hoTen: string };
      const sv: SinhVien = { ...body, maLop };
      state.students.push(sv);
      return json(route, 201, sv);
    }
    if (classStudentMatch && method === 'DELETE') {
      const maLop = classStudentMatch[1];
      const maSV = classStudentMatch[2];
      state.students = state.students.filter((sv) => !(sv.maLop === maLop && sv.maSV === maSV));
      return json(route, 200, { message: 'ok' });
    }

    // Misc lists (dashboard etc)
    if (path === '/students' && method === 'GET') {
      return json(route, 200, { data: [], total: 0, page: 1, limit: 10 });
    }
    if (path === '/questions') return json(route, 200, { data: [], total: 0, page: 1, limit: 10 });
    if (path === '/exams') return json(route, 200, { data: [], total: 0, page: 1, limit: 10 });
    if (path === '/grades') return json(route, 200, { data: [], total: 0, page: 1, limit: 10 });
    if (path === '/reports/exams-by-subject') return json(route, 200, []);
    if (path === '/difficulties') return json(route, 200, []);
    if (path === '/regulations') return json(route, 200, []);

    return json(route, 404, { statusCode: 404, message: 'Not found' });
  });

  return state;
}

test.describe('CRUD flow (subject → class → students)', () => {
  test('admin creates subject + class + students, then cleans up', async ({ page }) => {
    const state = await mockBackend(page);

    await page.goto('/login');
    await page.getByLabel(/tên đăng nhập/i).fill('admin');
    await page.getByLabel(/mật khẩu/i).fill('admin123');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // ── 1. Create subject TEST101
    await page.goto('/subjects');
    await page.getByRole('button', { name: /thêm môn/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(/mã môn/i).fill('TEST101');
    await dialog.getByLabel(/tên môn/i).fill('Môn test 101');
    await dialog.getByLabel(/số tín chỉ/i).fill('3');
    await dialog.getByRole('button', { name: /^lưu$/i }).click();
    await expect(page.getByText('TEST101')).toBeVisible();

    // ── 2. Create class CL101 attached to TEST101
    await page.goto('/classes');
    await page.getByRole('button', { name: /thêm lớp/i }).click();
    const classDlg = page.getByRole('dialog');
    await classDlg.getByLabel(/mã lớp/i).fill('CL101');
    await classDlg.getByLabel(/tên lớp/i).fill('Lớp test 101');
    await classDlg.getByLabel(/môn học/i).click();
    await page.getByRole('option', { name: /TEST101/i }).click();
    await classDlg.getByRole('button', { name: /^lưu$/i }).click();
    await expect(page.getByText('CL101')).toBeVisible();

    // ── 3. Open class detail and add 3 students
    await page
      .getByRole('button', { name: /chi tiết/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/classes\/CL101/);

    for (const [maSV, hoTen] of [
      ['SV001', 'SV Một'],
      ['SV002', 'SV Hai'],
      ['SV003', 'SV Ba'],
    ] as const) {
      await page.getByRole('button', { name: /thêm sv vào lớp/i }).click();
      const dlg = page.getByRole('dialog');
      await dlg.getByLabel(/mã sinh viên/i).fill(maSV);
      await dlg.getByLabel(/họ tên/i).fill(hoTen);
      await dlg.getByRole('button', { name: /^lưu$/i }).click();
      await expect(page.getByText(maSV)).toBeVisible();
    }
    expect(state.students.length).toBe(3);

    // ── 4. Delete 1 student
    const deleteButtons = page.getByRole('button', { name: /^xoá$/i });
    await deleteButtons.first().click();
    await page.getByRole('dialog').getByRole('button', { name: /^xoá$/i }).click();
    await expect(page.getByText('SV001')).not.toBeVisible();

    // ── 5. Cleanup: delete class then subject
    await page.goto('/classes');
    await page.getByRole('button', { name: /^xoá$/i }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: /^xoá$/i }).click();
    await expect(page.getByText('CL101')).not.toBeVisible();

    await page.goto('/subjects');
    // Find the row containing TEST101 and click its Xoá button
    const row = page.getByRole('row', { name: /TEST101/i });
    await row.getByRole('button', { name: /^xoá$/i }).click();
    await page.getByRole('dialog').getByRole('button', { name: /^xoá$/i }).click();
    await expect(page.getByText('TEST101')).not.toBeVisible();
  });
});
