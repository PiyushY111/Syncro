import { test, expect } from '@playwright/test';

test.describe('Task Pipeline & Boards E2E', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'google-tester@piyushydv.com');
        await page.fill('input[type="password"]', 'Password123!');
        await page.click('button[type="submit"]');

        await page.click('[data-testid="project-tasks-link"]');
    });

    test('should allow creating a task with priorities and type details', async ({ page }) => {
        await page.click('[data-testid="create-task-btn"]');
        await page.fill('input[placeholder="Task Title"]', 'Test E2E Kanban Automation');
        await page.selectOption('select[name="type"]', 'Feature');
        await page.selectOption('select[name="priority"]', 'High');
        await page.click('button[type="submit"]');

        // Verify task appears on Kanban board
        await expect(page.locator('text=Test E2E Kanban Automation')).toBeVisible();
    });

    test('should allow dragging and dropping tasks to change stages', async ({ page }) => {
        // Drag task card from TODO column to IN_PROGRESS column
        const sourceCard = page.locator('[data-testid="task-card"]').first();
        const targetColumn = page.locator('[data-testid="kanban-column-in-progress"]');

        await sourceCard.dragTo(targetColumn);

        // Verify the board has updated the task stage status
        await expect(targetColumn.locator('[data-testid="task-card"]')).toBeVisible();
    });

    test('should open task details modal and publish comments', async ({ page }) => {
        await page.click('[data-testid="task-card"]');
        
        // Assert task description modal is active
        await expect(page.locator('[data-testid="task-details-modal"]')).toBeVisible();

        // Write and submit a task comment
        await page.fill('input[placeholder="Add a comment..."]', 'E2E Validation check on task comments.');
        await page.click('[data-testid="submit-comment-btn"]');

        // Verify comment is printed in the task activity feed
        await expect(page.locator('text=E2E Validation check on task comments.')).toBeVisible();
    });
});
