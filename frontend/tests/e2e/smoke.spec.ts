import { test, expect, type ConsoleMessage } from '@playwright/test';

test.describe('smoke', () => {
  test('unauthenticated visit to / redirects to /login', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      errors.push(err.message);
    });

    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();
    await expect(page).toHaveURL(/\/login(\?.*)?$/);

    const noisy = errors.filter((e) => !/favicon/i.test(e) && !/404/i.test(e));
    expect(noisy, `unexpected console errors: ${noisy.join('\n')}`).toEqual([]);
  });
});
