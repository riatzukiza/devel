import { test, expect } from "@playwright/test";

import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { startKanbanServer, type StartedKanbanServer } from "../src/server.js";

const writeTask = async (dir: string, index: number): Promise<void> => {
  const uuid = `t-${index}`;
  await writeFile(
    path.join(dir, `${uuid}.md`),
    `---\n` +
      `uuid: ${uuid}\n` +
      `title: Task ${index}\n` +
      `status: incoming\n` +
      `priority: P3\n` +
      `labels: [e2e]\n` +
      `---\n\n` +
      `Body ${index}\n`,
    "utf8"
  );
};

test.describe("kanban UI scrolling", () => {
  let started: StartedKanbanServer;

  test.beforeAll(async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "openhax-kanban-ui-e2e-"));
    const incomingDir = path.join(root, "incoming");
    await mkdir(incomingDir, { recursive: true });

    // enough cards to force internal scroll
    await Promise.all(Array.from({ length: 80 }, (_, i) => writeTask(incomingDir, i + 1)));

    started = await startKanbanServer({
      tasksDir: root,
      host: "127.0.0.1",
      port: 0
    });
  });

  test.afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      started.server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  test("page does not scroll; each column list scrolls", async ({ page }) => {
    await page.goto(started.url, { waitUntil: "networkidle" });

    const getPageScrollTop = async (): Promise<number> =>
      page.evaluate(() => document.scrollingElement?.scrollTop ?? 0);

    // 1) Ensure page is locked
    expect(await getPageScrollTop()).toBe(0);

    await page.locator("body > header").hover();
    await page.mouse.wheel(0, 1200);

    expect(await getPageScrollTop()).toBe(0);

    // 2) Ensure incoming column has an internal scroll container
    const list = page.locator('.col[data-status="incoming"] .list');

    const dims = await list.evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      scrollTop: el.scrollTop
    }));

    expect(dims.scrollHeight).toBeGreaterThan(dims.clientHeight);
    expect(dims.scrollTop).toBe(0);

    // 3) Scroll the list (the list is the scroll container; the page must remain locked)
    // Note: we assert scrollability by mutating scrollTop directly (matches the manual verification we did via JS).
    const afterScrollTop = await list.evaluate((el) => {
      el.scrollTop = 1600;
      return el.scrollTop;
    });

    expect(afterScrollTop).toBeGreaterThan(0);
    expect(await getPageScrollTop()).toBe(0);
  });
});
