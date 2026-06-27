import { expect, test } from '@playwright/test';

test.describe('Unified Shell Layout & Persistence', () => {
  
  test('renders the multi-pane shell structure', async ({ page }) => {
    await page.goto('/#/');
    
    await expect(page.locator('.shell')).toBeVisible();
    await expect(page.locator('.workflow-nav')).toBeVisible();
    
    const viewportWidth = page.viewportSize()?.width ?? 1200;
    if (viewportWidth >= 820) {
      await expect(page.locator('.left-sidebar')).toBeVisible();
      await expect(page.locator('.workspace [data-testid="activity-view"]').first()).toBeVisible();
    }
    
    await expect(page.locator('.main-area')).toBeVisible();
    
    if (viewportWidth >= 1100) {
      await expect(page.locator('.inspector-pane')).toBeVisible();
    }
    
    await expect(page.locator('.header')).toBeVisible();
    await expect(page.locator('.status-bar')).toBeVisible();
  });

  test('persists pane widths across reloads', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/#/');
    
    const initialWidth = await page.evaluate(() => {
      const el = document.querySelector('.left-sidebar')?.parentElement;
      return el ? getComputedStyle(el).width : null;
    });
    
    if (initialWidth === null) {
      return;
    }
    
    expect(initialWidth).toBe('220px');

    await page.evaluate(() => {
      localStorage.setItem('opencode.workbench.workbench.layout.leftPaneWidth', '280');
    });

    await page.reload();

    const newWidth = await page.evaluate(() => {
      const el = document.querySelector('.left-sidebar')?.parentElement;
      return el ? getComputedStyle(el).width : null;
    });
    expect(newWidth).toBe('280px');
  });

  test('persists route across reloads', async ({ page }) => {
    await page.goto('/#/');
    
    await page.evaluate(() => {
      window.location.hash = '#/test-route';
    });
    
    await page.waitForTimeout(100);
    
    await page.reload();
    
    expect(page.url()).toContain('#/test-route');
    
    await expect(page.locator('.shell')).toBeVisible();
  });

  test('regression: spike route still works and bypasses shell', async ({ page }) => {
    await page.goto('/#/react-reagent-spike');
    
    await expect(page.getByTestId('react-host-route')).toBeVisible();
    await expect(page.getByTestId('reagent-donor-panel')).toBeVisible();
    
    await expect(page.locator('.shell')).not.toBeVisible();
    await expect(page.locator('.workflow-nav')).not.toBeVisible();
  });
});
