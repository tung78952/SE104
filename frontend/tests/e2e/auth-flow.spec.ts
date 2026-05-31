import { test, expect, type Route, type Page } from '@playwright/test';

const API = 'http://localhost:5001';

interface MockState {
  currentUser: ReturnType<typeof adminUser>;
}

function adminUser() {
  return {
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
}

async function mockBackend(page: Page): Promise<void> {
  const state: MockState = { currentUser: adminUser() };

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

    // CORS preflight
    if (method === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': 'http://localhost:3000',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        },
      });
      return;
    }

    // Auth
    if (path === '/auth/signin' && method === 'POST') {
      const body = (req.postDataJSON?.() ?? {}) as { tenDangNhap?: string; matKhau?: string };
      if (body.matKhau === 'wrongpw') {
        return json(route, 401, { statusCode: 401, message: 'Mật khẩu không đúng' });
      }
      if (body.tenDangNhap === 'admin' && body.matKhau === 'admin123') {
        return json(route, 200, { accessToken: 'mock-admin-token', userId: 1 });
      }
      return json(route, 401, { statusCode: 401, message: 'Sai thông tin' });
    }

    if (path === '/auth/signout' && method === 'POST') {
      return json(route, 200, { message: 'ok' });
    }

    if (path === '/auth/refresh' && method === 'POST') {
      return json(route, 200, { accessToken: 'mock-refreshed-token' });
    }

    if (path === '/auth/change-password' && method === 'PATCH') {
      const body = (req.postDataJSON?.() ?? {}) as { matKhauCu?: string; matKhauMoi?: string };
      if (body.matKhauCu !== 'admin123') {
        return json(route, 400, {
          statusCode: 400,
          message: 'Mật khẩu cũ không chính xác',
        });
      }
      return json(route, 200, { message: 'ok' });
    }

    // Users
    if (path === '/users/me' && method === 'GET') {
      return json(route, 200, state.currentUser);
    }

    if (path === '/users/me' && method === 'PATCH') {
      const body = (req.postDataJSON?.() ?? {}) as Record<string, string>;
      const u = state.currentUser;
      if (u.giangVien) {
        u.giangVien = {
          ...u.giangVien,
          hoTen: body.hoTen ?? u.giangVien.hoTen,
          email: body.email ?? u.giangVien.email,
          khoaBoMon: body.khoaBoMon ?? u.giangVien.khoaBoMon,
        };
      }
      return json(route, 200, state.currentUser);
    }

    // Lists for dashboard
    if (path === '/subjects') return json(route, 200, { data: [], total: 12, page: 1, limit: 1 });
    if (path === '/classes') return json(route, 200, { data: [], total: 34, page: 1, limit: 1 });
    if (path === '/questions')
      return json(route, 200, { data: [], total: 1284, page: 1, limit: 1 });
    if (path === '/exams') return json(route, 200, { data: [], total: 58, page: 1, limit: 1 });
    if (path === '/students') return json(route, 200, { data: [], total: 847, page: 1, limit: 1 });
    if (path === '/grades') return json(route, 200, { data: [], total: 2103, page: 1, limit: 1 });

    if (path === '/reports/exams-by-subject') {
      return json(route, 200, [
        { maMon: 'CSDL', tenMon: 'Cơ sở dữ liệu', soLuongDeThi: 12 },
        { maMon: 'MMT', tenMon: 'Mạng máy tính', soLuongDeThi: 9 },
      ]);
    }

    return json(route, 404, { statusCode: 404, message: 'Not found' });
  });
}

test.describe('Auth flow (login → dashboard → profile → change pw → logout)', () => {
  test('full happy path returns to /login after signout', async ({ page }) => {
    await mockBackend(page);

    // ── 1. Login
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel(/tên đăng nhập/i).fill('admin');
    await page.getByLabel(/mật khẩu/i).fill('admin123');
    await page.getByRole('button', { name: /đăng nhập/i }).click();

    // ── 2. Lands on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId('dashboard-stats')).toBeVisible();
    await expect(page.getByTestId('dashboard-stats')).toContainText('12');
    await expect(page.getByTestId('dashboard-stats')).toContainText('58');

    // ── 3. Navigate to profile via sidebar
    await page
      .getByRole('link', { name: /^Hồ sơ cá nhân/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/profile/);

    await expect(page.getByTestId('profile-tenDangNhap')).toContainText('admin');
    await expect(page.getByTestId('profile-vaiTro')).toContainText(/quản trị/i);
    await expect(page.getByLabel(/họ và tên/i)).toHaveValue(/Nguyễn Minh Tuấn/);

    // ── 4. Open Change Password modal
    await page.getByRole('button', { name: /đổi mật khẩu/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Mismatch → inline validation, no submit
    await page.getByLabel(/mật khẩu hiện tại/i).fill('admin123');
    await page.getByLabel(/^mật khẩu mới/i).fill('newSecret9');
    await page.getByLabel(/xác nhận mật khẩu mới/i).fill('different9');
    await page.getByRole('button', { name: /cập nhật/i }).click();
    await expect(page.getByText(/không khớp/i)).toBeVisible();

    // Fix confirm & submit
    await page.getByLabel(/xác nhận mật khẩu mới/i).fill('newSecret9');
    await page.getByRole('button', { name: /cập nhật/i }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    // ── 5. Logout from sidebar
    await page.getByRole('button', { name: /đăng xuất/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('login with wrongpw shows error and stays on /login', async ({ page }) => {
    await mockBackend(page);
    await page.goto('/login');
    await page.getByLabel(/tên đăng nhập/i).fill('admin');
    await page.getByLabel(/mật khẩu/i).fill('wrongpw');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await expect(page.getByText(/không đúng/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
