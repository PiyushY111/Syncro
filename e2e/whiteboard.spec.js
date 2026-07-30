import { test, expect } from '@playwright/test';

test.describe('Whiteboard Vector Canvas E2E', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'google-tester@piyushydv.com');
        await page.fill('input[type="password"]', 'Password123!');
        await page.click('button[type="submit"]');
        await page.fill('input[placeholder="Enter 2FA Code"]', '123456');
        await page.click('button[type="submit"]');
        
        await page.click('[data-testid="whiteboard-nav-link"]');
    });

    test('should render canvas and create dynamic sticky notes', async ({ page }) => {
        // Confirm whiteboard canvas is rendered
        await expect(page.locator('canvas')).toBeVisible();

        // Click whiteboard toolbar item for notes
        await page.click('[data-testid="toolbar-sticky-note"]');
        
        // Click on the canvas workspace to drop a sticky note node
        const canvas = page.locator('canvas');
        await canvas.click({ position: { x: 200, y: 200 } });

        // Verify sticky note input appears and fill it
        await page.fill('textarea[placeholder="Type inside node..."]', 'E2E Architecture Draft');
        await page.press('textarea[placeholder="Type inside node..."]', 'Escape');

        // Verify sticky note text is printed on the board
        await expect(page.locator('text=E2E Architecture Draft')).toBeVisible();
    });

    test('should allow exporting whiteboard canvas as SVG', async ({ page }) => {
        // Trigger SVG compiler export
        await page.click('[data-testid="export-svg-btn"]');
        
        // Wait for file download event and verify
        const downloadPromise = page.waitForEvent('download');
        await page.click('[data-testid="confirm-export-btn"]');
        const download = await downloadPromise;
        
        expect(download.suggestedFilename()).toContain('.svg');
    });
});
