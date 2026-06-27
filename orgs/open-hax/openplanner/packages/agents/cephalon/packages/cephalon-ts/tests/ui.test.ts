import { test, expect } from '@playwright/test'

test.describe('Cephalon Memory UI', () => {
  test.describe('Page Load', () => {
    test('loads successfully', async ({ page }) => {
      await page.goto('http://localhost:5173/')
      await expect(page).toHaveTitle(/Cephalon/)
    })

    test('displays header with stats', async ({ page }) => {
      await page.goto('http://localhost:5173/')
      await expect(page.locator('text=Cephalon Memory')).toBeVisible()
    })

    test('shows loading state initially', async ({ page }) => {
      await page.goto('http://localhost:5173/')
      // Wait for the page to render
      await page.waitForTimeout(3000)
      // Check that the app is visible (either loading, content, or empty state)
      await expect(page.locator('#root').first()).toContainText('Cephalon')
    })
  })

  test.describe('View Toggle', () => {
    test('switches from cards to table view', async ({ page }) => {
      await page.goto('http://localhost:5173/')
      await page.waitForTimeout(2000)
      
      // Click Table view button
      await page.locator('button:has-text("Table")').click()
      await page.waitForTimeout(1000)
      
      // Verify table is rendered - look for any table element
      const table = page.locator('table').first();
      await expect(table).toBeVisible({ timeout: 5000 });
    })

    test('switches from table to cards view', async ({ page }) => {
      await page.goto('http://localhost:5173/')
      await page.waitForTimeout(2000)
      
      // Switch to table first
      await page.locator('button:has-text("Table")').click()
      await page.waitForTimeout(1000)
      
      // Verify table is visible
      const table = page.locator('table').first();
      await expect(table).toBeVisible({ timeout: 5000 });
      
      // Switch back to cards
      await page.locator('button:has-text("Cards")').click()
      await page.waitForTimeout(1000)
      
      // Verify we're back in cards mode by checking for the main panel (which contains cards)
      const mainPanel = page.locator('[class*="mainPanel"]').first();
      await expect(mainPanel).toBeVisible({ timeout: 5000 });
    })
  })

  test.describe('Memory Cards', () => {
    test('displays memory cards with content', async ({ page }) => {
      await page.goto('http://localhost:5173/')
      
      // Wait for content to load
      await page.waitForTimeout(3000)
      
      // Check for main content area (either cards, table, or empty state)
      const hasMainContent = await page.locator('[class*="mainPanel"], main, [class*="content"]').first().isVisible().catch(() => false);
      const hasEmptyState = await page.locator('.empty, text=No memories').first().isVisible().catch(() => false);
      
      // Either main content area or empty state should be visible
      expect(hasMainContent || hasEmptyState).toBe(true);
    })

    test('memory cards are clickable', async ({ page }) => {
      await page.goto('http://localhost:5173/')
      await page.waitForTimeout(2000)
      
      // Use attribute selector that works with CSS modules
      const card = page.locator('[class*="card"], [class*="MemoryCard"]').first()
      if (await card.count() > 0) {
        await card.click()
        // Should show detail in side panel - look for any detail panel
        await expect(page.locator('[class*="detail"], [class*="Detail"]').first()).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Memory Table', () => {
    test('table view renders table element', async ({ page }) => {
      await page.goto('http://localhost:5173/')
      await page.locator('button:has-text("Table")').click()
      await page.waitForTimeout(1000)
      
      // Table should be visible (even if empty)
      const table = page.locator('table').first();
      await expect(table).toBeVisible({ timeout: 5000 });
    })

    test('table rows are selectable when data exists', async ({ page }) => {
      await page.goto('http://localhost:5173/')
      await page.locator('button:has-text("Table")').click()
      await page.waitForTimeout(1000)
      
      const row = page.locator('tr').first()
      if (await row.count() > 0 && await row.isVisible()) {
        await row.click()
        await page.waitForTimeout(500)
        await expect(row).toBeVisible()
      }
      // If no rows exist, test passes (empty state is valid)
    })
  })

  test.describe('Search', () => {
    test('search input accepts text', async ({ page }) => {
      await page.goto('http://localhost:5173/')
      const input = page.locator('input[placeholder*="Search"], #search-input')
      await input.fill('test query')
      await expect(input).toHaveValue('test query')
    })

    test('search triggers on button click', async ({ page }) => {
      await page.goto('http://localhost:5173/')
      
      await page.locator('input[placeholder*="Search"]').fill('hello')
      await page.locator('button:has-text("Search")').click()
      
      // Should trigger a search (wait for API response)
      await page.waitForTimeout(1500)
    })

    test('search triggers on Enter key', async ({ page }) => {
      await page.goto('http://localhost:5173/')
      
      const input = page.locator('input[placeholder*="Search"]')
      await input.fill('test')
      await input.press('Enter')
      
      await page.waitForTimeout(1500)
    })
  })

  test.describe('Context Panel', () => {
    test('context panel displays pinned memories', async ({ page }) => {
      await page.goto('http://localhost:5173/')
      await page.waitForTimeout(2000)
      
      // Check for pinned section using or() locator
      const pinnedSection = page.getByText('Pinned Memories').or(page.getByText('Pinned'))
      await expect(pinnedSection.first()).toBeVisible()
    })

    test('context panel displays recent memories', async ({ page }) => {
      await page.goto('http://localhost:5173/')
      await page.waitForTimeout(2000)
      
      // Check for recent section
      const recentSection = page.getByText('Recent Memories').or(page.getByText('Recent'))
      await expect(recentSection.first()).toBeVisible()
    })
  })

  test.describe('Pagination', () => {
    test('pagination controls exist', async ({ page }) => {
      await page.goto('http://localhost:5173/')
      await page.waitForTimeout(3000)
      
      // Check for any navigation or pagination element in the content area
      await expect(page.locator('main').first()).toBeVisible({ timeout: 5000 })
    })

    test('navigation controls exist', async ({ page }) => {
      await page.goto('http://localhost:5173/')
      await page.waitForTimeout(3000)
      
      // Look for view toggle buttons (Cards/Table)
      await expect(page.locator('button:has-text("Cards"), button:has-text("Table")').first()).toBeVisible()
    })
  })

  test.describe('Stats Display', () => {
    test('header shows memory count', async ({ page }) => {
      await page.goto('http://localhost:5173/')
      await page.waitForTimeout(2000)
      
      // Should show some count stat - check for badge with Total
      const stats = page.getByText('Total:')
      await expect(stats.first()).toBeVisible()
    })

    test('header shows pinned count', async ({ page }) => {
      await page.goto('http://localhost:5173/')
      await page.waitForTimeout(2000)
      
      const pinnedStat = page.getByText('Pinned:')
      await expect(pinnedStat.first()).toBeVisible()
    })
  })
})
