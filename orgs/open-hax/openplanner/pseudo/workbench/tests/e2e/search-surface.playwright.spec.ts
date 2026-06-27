import { test, expect, TestUtils } from './helpers/test-setup';

test.describe('Search Surface Integration', () => {
  test.beforeEach(async ({ app }) => {
    await app.waitForAppLoad();
  });

  test('should open search surface with Ctrl+K', async ({ page }) => {
    await page.keyboard.press('Control+k');

    const modal = page.locator('[data-testid="search-surface"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('[data-testid="search-input"]')).toBeFocused();
  });

  test('should switch tabs', async ({ page }) => {
    await page.keyboard.press('Control+k');

    const modal = page.locator('[data-testid="search-surface"]');
    await modal.locator('[data-testid="tab-docs"]').click();
    
    await expect(modal.locator('[data-testid="search-results"]')).toContainText('Getting Started');
  });

  test('should show errors first in sessions tab', async ({ page }) => {
    await page.keyboard.press('Control+k');

    const modal = page.locator('[data-testid="search-surface"]');
    await modal.locator('[data-testid="tab-sessions"]').click();

    const firstError = modal.locator('[data-testid="result-error"]').first();
    
    await expect(firstError).toBeVisible();
    await expect(firstError).toContainText('Failed to connect to server');
  });
});
