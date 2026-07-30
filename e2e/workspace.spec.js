import { test, expect } from '@playwright/test';

test.describe('Workspace Onboarding & Operations E2E', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'google-tester@piyushydv.com');
        await page.fill('input[type="password"]', 'Password123!');
        await page.click('button[type="submit"]');
        await page.fill('input[placeholder="Enter 2FA Code"]', '123456');
        await page.click('button[type="submit"]');
    });

    test('should allow creating a new workspace successfully', async ({ page }) => {
        await page.click('[data-testid="create-workspace-btn"]');
        await page.fill('input[placeholder="Workspace Name"]', 'E2E Test Team Workspace');
        await page.fill('textarea[placeholder="Description"]', 'This workspace is created during E2E testing.');
        await page.click('button[type="submit"]');

        // Check if redirected to the new workspace's dashboard page
        await expect(page).toHaveURL(/.*\/workspaces\/.*/);
        await expect(page.locator('h1')).toContainText('E2E Test Team Workspace');
    });

    test('should allow owner to invite members to workspace', async ({ page }) => {
        await page.click('[data-testid="workspace-settings-link"]');
        await page.click('[data-testid="invite-member-btn"]');
        await page.fill('input[placeholder="Member Email"]', 'new-invitee@syncro.com');
        await page.click('button:has-text("Send Invite")');

        await expect(page.locator('text=Invitation sent successfully')).toBeVisible();
    });
});
