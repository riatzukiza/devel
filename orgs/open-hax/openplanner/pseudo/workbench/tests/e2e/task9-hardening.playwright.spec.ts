import { test, expect } from './helpers/test-setup';

test.describe('Task 9 Hardening: performance, reliability, rollback', () => {
  test.beforeEach(async ({ app }) => {
    await app.waitForAppLoad();
  });

  test('inspector open interaction stays within latency target', async ({ page }) => {
    const mainActivityView = page.locator('.no-buffer [data-testid="activity-view"]');

    const firstSelectionStart = Date.now();
    await mainActivityView.locator('[data-select-testid="result-select-error-1"]').click();
    await expect(page.getByTestId('inspector-selection-title')).toContainText('Failed to connect to server');
    const firstSelectionLatencyMs = Date.now() - firstSelectionStart;

    const secondSelectionStart = Date.now();
    await mainActivityView.locator('[data-select-testid="result-select-error-4"]').click();
    await expect(page.getByTestId('inspector-selection-title')).toContainText('Compilation failed');
    const secondSelectionLatencyMs = Date.now() - secondSelectionStart;

    const worstObservedLatencyMs = Math.max(firstSelectionLatencyMs, secondSelectionLatencyMs);
    expect(worstObservedLatencyMs).toBeLessThan(350);
  });

  test('pane API error stays non-blocking and retry restores context', async ({ page }) => {
    await page.evaluate(() => {
      const nextFlags = { ...(window as any).__OPENCODE_TEST_FLAGS__, failInspectorContext: true };
      (window as any).__OPENCODE_TEST_FLAGS__ = nextFlags;
    });

    await page.locator('.no-buffer [data-select-testid="result-select-error-1"]').click();

    await expect(page.getByTestId('inspector-pane-error')).toBeVisible();
    await expect(page.getByTestId('inspector-pane-error-retry')).toBeVisible();
    await expect(page.getByTestId('inspector-detail')).toContainText('Failed to connect to server');

    await page.evaluate(() => {
      const nextFlags = { ...(window as any).__OPENCODE_TEST_FLAGS__, failInspectorContext: false };
      (window as any).__OPENCODE_TEST_FLAGS__ = nextFlags;
    });

    await page.getByTestId('inspector-pane-error-retry').click();

    await expect(page.getByTestId('inspector-pane-error')).toBeHidden();
    await expect(page.getByTestId('inspector-context')).toContainText('Compilation failed');
  });

  test('feature flag disable rolls seam route back to donor fallback', async ({ page }) => {
    await page.evaluate(() => {
      const nextFlags = { ...(window as any).__OPENCODE_FEATURE_FLAGS__, reactReagentSeam: false };
      (window as any).__OPENCODE_FEATURE_FLAGS__ = nextFlags;
      window.location.hash = '#/react-reagent-spike';
    });

    await expect(page.getByTestId('donor-fallback-route')).toBeVisible();
    await expect(page.getByTestId('donor-fallback-banner')).toContainText('Donor fallback route is active');
    await expect(page.getByTestId('react-host-route')).toHaveCount(0);
    await expect(page.locator('.no-buffer [data-testid="activity-view"]')).toBeVisible();
  });
});
