import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should show registration form validation errors', async ({ page }) => {
        await page.goto('/register');
        await page.click('button[type="submit"]');
        
        // Assert validator notices or alert prompts appear
        await expect(page.locator('text=required')).toBeVisible();
    });

    test('should block login with incorrect credentials', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'wrong-user@syncro.com');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        await expect(page.locator('text=invalid credentials')).toBeVisible();
    });

    test('should log in google-tester directly without 2FA prompt', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'google-tester@piyushydv.com');
        await page.fill('input[type="password"]', 'Password123!');
        await page.click('button[type="submit"]');

        // Check that user is logged in directly and redirected to workspace/dashboard without 2FA
        await expect(page.locator('input[placeholder="Enter 2FA Code"]')).not.toBeVisible();
    });

    test('should prompt for 2FA on correct credentials for standard users', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'standard-user@syncro.com');
        await page.fill('input[type="password"]', 'Password123!');
        await page.click('button[type="submit"]');

        // Check if 2FA code input is displayed
        await expect(page.locator('input[placeholder="Enter 2FA Code"]')).toBeVisible();
    });
});
