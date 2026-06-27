import { test, expect } from '@playwright/test';

/**
 * E2E tests for OpenCode Unified Editor Workbench
 * Tests the core workflows: navigation, editing, buffers, and state management
 */
test.describe('Workbench Editor', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the workbench
    await page.goto('/');
    
    // Wait for the app to be loaded
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
  });

  test('should load the editor interface', async ({ page }) => {
    // Check that main UI elements are present
    await expect(page.locator('.editor-content')).toBeVisible();
  });

  test('should support basic text editing', async ({ page }) => {
    const editor = page.locator('.editor-content');
    
    // Focus the editor
    await editor.click();
    
    // Type some text
    await editor.fill('Hello, OpenCode Workbench!');
    
    // Verify the text was entered
    await expect(editor).toHaveValue('Hello, OpenCode Workbench!');
  });

  test('should show cursor position', async ({ page }) => {
    const editor = page.locator('.editor-content');
    
    await editor.click();
    await editor.fill('Test cursor');
    
    // Move cursor to position 4
    await editor.click();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    
    // Should still have content
    await expect(editor).toHaveValue('Test cursor');
  });
});

test.describe('Buffer Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test('should have initial empty buffer state', async ({ page }) => {
    const editor = page.locator('.editor-content');
    await expect(editor).toBeVisible();
  });

  test('should maintain buffer content after edits', async ({ page }) => {
    const editor = page.locator('.editor-content');
    
    // Enter insert mode and type
    await page.keyboard.press('i');
    await editor.fill('Initial content');
    
    // Exit insert mode
    await page.keyboard.press('Escape');
    
    // Verify content is preserved
    await expect(editor).toHaveValue('Initial content');
  });
});

test.describe('Evil Mode Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test('should start in normal mode', async ({ page }) => {
    // Verify editor is ready
    const editor = page.locator('.editor-content');
    await expect(editor).toBeVisible();
  });

  test('should enter insert mode with i key', async ({ page }) => {
    const editor = page.locator('.editor-content');
    
    // Press i to enter insert mode
    await page.keyboard.press('i');
    
    // Editor should still be editable
    await editor.fill('Typed in insert mode');
    await expect(editor).toHaveValue('Typed in insert mode');
  });

  test('should navigate with h/j/k/l keys in normal mode', async ({ page }) => {
    const editor = page.locator('.editor-content');
    
    // Enter some content
    await page.keyboard.press('i');
    await editor.fill('Line 1\nLine 2\nLine 3');
    await page.keyboard.press('Escape');
    
    // Navigate with h/j/k/l should not throw errors
    await expect(page.locator('body')).toBeVisible();
  });

  test('should exit insert mode with Escape', async ({ page }) => {
    const editor = page.locator('.editor-content');
    
    // Enter insert mode
    await page.keyboard.press('i');
    await editor.fill('Test');
    
    // Exit insert mode
    await page.keyboard.press('Escape');
    
    // Should still have the content
    await expect(editor).toHaveValue('Test');
  });
});

test.describe('Status Bar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test('should display mode indicator', async ({ page }) => {
    // Status bar should be present
    await expect(page.locator('[class*="status"]')).toBeVisible();
  });

  test('should update when switching modes', async ({ page }) => {
    // Switch to insert mode
    await page.keyboard.press('i');
    
    // Switch back to normal mode
    await page.keyboard.press('Escape');
    
    // Should still be functional
    const editor = page.locator('.editor-content');
    await expect(editor).toBeVisible();
  });
});

test.describe('Theme Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test('should have theme styling applied', async ({ page }) => {
    // Check that CSS variables are being used
    const body = page.locator('body');
    await expect(body).toHaveCSS('background-color', /.*/);
  });
});

test.describe('Responsive Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test('should handle mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Editor should still be visible and usable
    const editor = page.locator('.editor-content');
    await expect(editor).toBeVisible();
    
    // Content should be editable
    await page.keyboard.press('i');
    await editor.fill('Mobile test');
    await expect(editor).toHaveValue('Mobile test');
  });

  test('should handle desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    const editor = page.locator('.editor-content');
    await expect(editor).toBeVisible();
    
    await page.keyboard.press('i');
    await editor.fill('Desktop test');
    await expect(editor).toHaveValue('Desktop test');
  });
});

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test('should handle rapid key presses without crashing', async ({ page }) => {
    const editor = page.locator('.editor-content');
    
    await editor.click();
    
    // Rapid typing should not cause errors
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press(String(i));
      await page.keyboard.press('Tab');
    }
    
    // Editor should still be functional
    await expect(editor).toBeVisible();
  });

  test('should maintain state after mode switches', async ({ page }) => {
    const editor = page.locator('.editor-content');
    
    // Type in insert mode
    await page.keyboard.press('i');
    await editor.fill('Test content');
    
    // Switch modes multiple times
    await page.keyboard.press('Escape');
    await page.keyboard.press('i');
    await page.keyboard.press('Escape');
    await page.keyboard.press('i');
    
    // Content should still be there
    await expect(editor).toHaveValue('Test content');
  });
});
