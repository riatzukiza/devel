import { test, expect } from './helpers/test-setup';

test.describe('Task 6 Cephalon Donor Controls', () => {
  test.beforeEach(async ({ app }) => {
    await app.waitForAppLoad();
  });

  test('switch view, paginate, open detail, and inspect sticky panel', async ({ page }) => {
    const mainActivityView = page.locator('.no-buffer [data-testid="activity-view"]');

    await expect(mainActivityView.locator('[data-testid="view-toggle"]')).toBeVisible();
    await expect(mainActivityView.locator('[data-testid="pagination-controls"]')).toBeVisible();

    await mainActivityView.locator('[data-testid="view-toggle-table"]').click();
    await expect(mainActivityView.locator('[data-testid="result-item"]').first()).toBeVisible();

    await mainActivityView.locator('[data-testid="pagination-next"]').click();
    await expect(mainActivityView.locator('[data-testid="pagination-status"]')).toContainText('Page 2 of 2');

    await mainActivityView.locator('[data-testid="result-item"]').first().click();

    await expect(page.locator('[data-testid="inspector-pane"]')).toBeVisible();
    await expect(page.locator('[data-testid="inspector-sticky-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="inspector-detail"]')).toBeVisible();
    await expect(page.locator('[data-testid="inspector-context"]')).toBeVisible();

    await page.keyboard.press('Control+p');
    await expect(page.locator('[data-testid="command-palette"]')).toBeVisible();

    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+k');
    await expect(page.locator('[data-testid="search-surface"]')).toBeVisible();
  });
});
