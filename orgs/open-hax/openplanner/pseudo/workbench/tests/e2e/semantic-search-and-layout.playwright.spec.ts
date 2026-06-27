import { test, expect } from './helpers/test-setup';

test.describe('Semantic Search and Side-by-Side Layout', () => {
  test.beforeEach(async ({ app }) => {
    await app.waitForAppLoad();
  });

  test('should show sessions pane side-by-side with editor welcome state', async ({ page }) => {
    await expect(page.locator('.workspace [data-testid="search-results"]').first()).toBeVisible();
    
    await expect(page.locator('.main-area')).toContainText('OpenCode Unified Workbench');
    await expect(page.locator('.main-area')).toContainText('Select a session or file to begin work.');
  });

  test('should show sessions pane side-by-side with open editor', async ({ page, app }) => {
    await page.locator('[data-testid^="workspace-file-"]').first().click();
    
    await expect(page.locator('.editor-pane')).toBeVisible();
    
    await expect(page.locator('.workspace [data-testid="search-results"]').first()).toBeVisible();
    
    const sessionsBox = await page.locator('.workspace [data-testid="search-results"]').first().boundingBox();
    const editorBox = await page.locator('.main-area').boundingBox();
    
    expect(sessionsBox).not.toBeNull();
    expect(editorBox).not.toBeNull();
    
    if (sessionsBox && editorBox) {
      expect(sessionsBox.x).toBeLessThan(editorBox.x);
    }
  });

  test('should toggle sessions pane visibility via command palette', async ({ page, app }) => {
    await expect(page.locator('.workspace [data-testid="search-results"]').first()).toBeVisible();
    
    await app.executeCommand('Toggle Sessions Pane');
    
    await expect(page.locator('.workspace [data-testid="search-results"]').first()).not.toBeVisible();
    
    await app.executeCommand('Toggle Sessions Pane');
    
    await expect(page.locator('.workspace [data-testid="search-results"]').first()).toBeVisible();
  });

  test('should switch to semantic tab and trigger search', async ({ page }) => {
    await page.keyboard.press('Control+k');
    const modal = page.locator('[data-testid="search-surface"]');
    
    await modal.locator('[data-testid="tab-semantic"]').click();
    
    await expect(modal.locator('[data-testid="tab-semantic"]')).toHaveCSS('font-weight', '600');
    
    await modal.locator('[data-testid="search-input"]').fill('test query');
    
    await expect(modal.locator('[data-testid="search-results"]').first()).toBeVisible();
  });

  test('should display text snippet for semantic results in inspector', async ({ page }) => {
    await page.keyboard.press('Control+k');
    const modal = page.locator('[data-testid="search-surface"]');
    
    await modal.locator('[data-testid="tab-sessions"]').click();
    
    const firstResult = modal.locator('[data-testid="result-item"]').first();
    await firstResult.click();
    
    await expect(page.locator('.workspace [data-testid="inspector-pane"]').first()).toBeVisible();
    await expect(page.locator('.workspace [data-testid="inspector-selection-title"]').first()).not.toBeEmpty();
  });
});
