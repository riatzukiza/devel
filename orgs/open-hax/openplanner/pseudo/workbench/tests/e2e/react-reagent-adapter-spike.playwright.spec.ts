import { expect, test } from '@playwright/test';

const routePath = '/#/react-reagent-spike';

test.describe('React host + Reagent adapter seam spike', () => {
  test('mounts donor panel and demonstrates handoff flow', async ({ page }) => {
    await page.goto(routePath);

    await expect(page.getByTestId('react-host-route')).toBeVisible();
    await expect(page.getByTestId('adapter-ready-state')).toHaveText('ready');
    await expect(page.getByTestId('reagent-donor-panel')).toBeVisible();

    await page.getByTestId('host-count-increment').click();
    await expect(page.getByTestId('host-count-value')).toHaveText('1');
    await expect(page.getByTestId('donor-host-count')).toHaveText('1');

    await page.getByTestId('donor-event-trigger').click();
    await expect(page.getByTestId('host-event-count')).toHaveText('1');

    await page.screenshot({
      path: '/home/err/devel/.sisyphus/evidence/task-1-mount-visible.png',
      fullPage: true,
    });
  });
});
