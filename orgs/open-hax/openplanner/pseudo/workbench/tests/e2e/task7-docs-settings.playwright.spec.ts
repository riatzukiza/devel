import { test, expect } from './helpers/test-setup';

test.describe('Task 7 Docs + Settings Nav Integration', () => {
  test.beforeEach(async ({ app }) => {
    await app.waitForAppLoad();
  });

  test('workflow nav opens docs and settings routes', async ({ page }) => {
    await page.getByTestId('workflow-nav-docs').click();
    await expect(page).toHaveURL(/#\/workflow\/docs$/);
    await expect(page.getByTestId('workflow-docs-route')).toBeVisible();
    await expect(page.getByTestId('workflow-doc-item').first()).toBeVisible();

    await page.getByTestId('workflow-nav-settings').click();
    await expect(page).toHaveURL(/#\/workflow\/settings$/);
    await expect(page.getByTestId('workflow-settings-route')).toBeVisible();
    await expect(page.getByTestId('settings-compact-mode-toggle')).toBeVisible();
  });

  test('settings preference persists across reload', async ({ page }) => {
    await page.getByTestId('workflow-nav-settings').click();

    const toggle = page.getByTestId('settings-compact-mode-toggle');
    const initiallyChecked = await toggle.isChecked();
    const expected = !initiallyChecked;
    await toggle.click();
    await expect(toggle).toBeChecked({ checked: expected });

    await page.reload();
    await page.waitForSelector('#app', { state: 'visible' });
    await page.waitForTimeout(400);

    await expect(page).toHaveURL(/#\/workflow\/settings$/);
    await expect(page.getByTestId('workflow-settings-route')).toBeVisible();
    await expect(toggle).toBeChecked({ checked: expected });
  });
});
