import { expect, test } from '@playwright/test';

/**
 * Smoke tests for the public surfaces. These run without a seeded database,
 * so they only assert on UI that renders regardless of data.
 */

test.describe('landing page', () => {
  test('shows the hero and CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('developers');
    await expect(page.getByRole('link', { name: /create your profile/i })).toBeVisible();
  });

  test('navigates to register', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /get started/i }).first().click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });
});

test.describe('auth pages', () => {
  test('login form validates required fields', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('forgot password page renders', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: /reset your password/i })).toBeVisible();
  });
});

test.describe('protected routes', () => {
  test('unauthenticated users are redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unknown routes show the 404 page', async ({ page }) => {
    await page.goto('/definitely-not-a-page');
    await expect(page).toHaveURL(/\/404/);
    await expect(page.getByText('404')).toBeVisible();
  });
});
