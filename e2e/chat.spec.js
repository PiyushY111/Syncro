import { test, expect } from '@playwright/test';

test.describe('Real-time Collaborative Chat Sync E2E', () => {
    test('Verify message broadcasting over Socket.IO between users', async ({ playwright }) => {
        const browser = await playwright.chromium.launch();

        // 1. Launch User A (Sender) session
        const contextA = await browser.newContext();
        const pageA = await contextA.newPage();
        await pageA.goto('/login');
        await pageA.fill('input[type="email"]', 'google-tester@piyushydv.com');
        await pageA.fill('input[type="password"]', 'Password123!');
        await pageA.click('button[type="submit"]');

        // Navigate to chat channel
        await pageA.click('[data-testid="channel-general"]');

        // 2. Launch User B (Receiver) session
        const contextB = await browser.newContext();
        const pageB = await contextB.newPage();
        await pageB.goto('/login');
        await pageB.fill('input[type="email"]', 'tester-two@piyushydv.com');
        await pageB.fill('input[type="password"]', 'Password123!');
        await pageB.click('button[type="submit"]');
        await pageB.fill('input[placeholder="Enter 2FA Code"]', '123456');
        await pageB.click('button[type="submit"]');

        // Navigate to same chat channel
        await pageB.click('[data-testid="channel-general"]');

        // 3. User A sends message
        const uniqueMessage = `Hello from User A - timestamp: ${Date.now()}`;
        await pageA.fill('textarea[placeholder="Type a message..."]', uniqueMessage);
        await pageA.press('textarea[placeholder="Type a message..."]', 'Enter');

        // 4. Assert User B receives it instantly
        await expect(pageB.locator(`text=${uniqueMessage}`)).toBeVisible({ timeout: 5000 });

        await contextA.close();
        await contextB.close();
        await browser.close();
    });
});
