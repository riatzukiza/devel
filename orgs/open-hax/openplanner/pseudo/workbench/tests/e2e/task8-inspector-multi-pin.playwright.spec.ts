import { test, expect } from './helpers/test-setup';

test.describe('Task 8 Inspector Multi-Pin Compare', () => {
  test.beforeEach(async ({ app }) => {
    await app.waitForAppLoad();
  });

  test('pins A/B/C and compares independent inspector views', async ({ page }) => {
    const mainActivityView = page.locator('.no-buffer [data-testid="activity-view"]');

    const entityA = mainActivityView.locator('[data-select-testid="result-select-error-1"]');
    const entityB = mainActivityView.locator('[data-select-testid="result-select-error-4"]');

    await entityA.click();
    await expect(page.getByTestId('inspector-selection-title')).toContainText('Failed to connect to server');
    await page.getByTestId('inspector-pin-action').click();

    await entityB.click();
    await expect(page.getByTestId('inspector-selection-title')).toContainText('Compilation failed');
    await page.getByTestId('inspector-pin-action').click();

    await mainActivityView.getByTestId('pagination-next').click();

    const entityC = mainActivityView.locator('[data-select-testid="result-select-info-2"]');
    await entityC.click();
    await expect(page.getByTestId('inspector-selection-title')).toContainText('Project initialized');
    await page.getByTestId('inspector-pin-action').click();

    const compareTabs = page.locator('[data-testid^="inspector-compare-tab-"]');
    await expect(compareTabs).toHaveCount(3);
    await expect(page.getByTestId('inspector-compare-cards')).toBeVisible();

    await page.getByTestId('inspector-compare-tab-error-1').click();
    await expect(page.getByTestId('inspector-detail')).toContainText('Failed to connect to server');
    await expect(page.getByTestId('inspector-context')).toContainText('Compilation failed');

    await page.getByTestId('inspector-compare-tab-error-4').click();
    await expect(page.getByTestId('inspector-detail')).toContainText('Compilation failed');
    await expect(page.getByTestId('inspector-context')).toContainText('Failed to connect to server');

    await page.getByTestId('inspector-compare-tab-info-2').click();
    await expect(page.getByTestId('inspector-detail')).toContainText('Project initialized');
    await expect(page.getByTestId('inspector-context')).toContainText('Dependencies installed');
  });
});
