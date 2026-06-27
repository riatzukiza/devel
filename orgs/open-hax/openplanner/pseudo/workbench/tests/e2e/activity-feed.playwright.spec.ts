import { test, expect, TestUtils } from './helpers/test-setup';

test.describe('Activity Feed & Default View', () => {
  test.beforeEach(async ({ app }) => {
    await app.waitForAppLoad();
  });

  test('should show activity view by default on launch', async ({ page }) => {
    const mainActivityView = page.locator('.workspace [data-testid="activity-view"]').first();
    await expect(mainActivityView).toBeVisible();
    
    await expect(mainActivityView.locator('[data-testid="search-input"]')).toBeVisible();
    
    await expect(mainActivityView.locator('[data-testid="search-tabs"]')).toBeVisible();

    await expect(mainActivityView.locator('[data-testid="view-toggle"]')).toBeVisible();
    await expect(mainActivityView.locator('[data-testid="pagination-controls"]')).toBeVisible();
  });

  test('should display errors first in activity feed', async ({ page }) => {
    const mainActivityView = page.locator('.workspace [data-testid="activity-view"]').first();

    const items = mainActivityView.locator('.result-item');
    await expect(items).toHaveCount(10);
    
    const count = await items.count();
    let foundNonError = false;
    for (let i = 0; i < count; i++) {
      const isError = await items.nth(i).locator('.result-icon').textContent().then(t => t?.includes('🔴'));
      if (foundNonError && isError) {
        throw new Error('Found error item after non-error item - sorting failed');
      }
      if (!isError) foundNonError = true;
    }
  });

  test('should filter activity items', async ({ page }) => {
    const mainActivityView = page.locator('.workspace [data-testid="activity-view"]').first();

    await mainActivityView.locator('[data-testid="filter-error"]').click();
    await page.waitForTimeout(200);
    
    await mainActivityView.locator('[data-testid="filter-info"]').click();
    await page.waitForTimeout(200);

    await mainActivityView.locator('[data-testid="filter-all"]').click();
    await expect(mainActivityView.locator('[data-testid="pagination-controls"]')).toBeVisible();
  });
});
