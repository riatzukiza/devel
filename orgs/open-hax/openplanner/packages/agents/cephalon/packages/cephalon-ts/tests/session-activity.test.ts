import { test, expect } from '@playwright/test'

test.describe('Session + Activity Default View', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/memories/count', async route => {
      await route.fulfill({ json: { count: 10 } })
    })

    await page.route('**/api/memories/context', async route => {
      await route.fulfill({ json: { recent: [], pinned: [], sessionCount: 2, totalCount: 10 } })
    })

    await page.route('**/api/sessions/stats', async route => {
      await route.fulfill({ json: [
        { id: 'session-1', memoryCount: 5, lastActivity: Date.now(), priorityClass: 'interactive', credits: 100 },
        { id: 'session-2', memoryCount: 5, lastActivity: Date.now() - 10000, priorityClass: 'background', credits: 50 }
      ]})
    })

    await page.route('**/api/memories/list*', async route => {
      const memories = [
        {
          id: 'm1',
          timestamp: Date.now() - 1000,
          sessionId: 'session-1',
          role: 'user',
          kind: 'message',
          content: { text: 'Normal message 1' },
          retrieval: { pinned: false },
          source: { type: 'discord' },
          cephalonId: 'c1'
        },
        {
          id: 'm2',
          timestamp: Date.now() - 500,
          sessionId: 'session-1',
          role: 'system',
          kind: 'error',
          content: { text: 'Error message' },
          retrieval: { pinned: false },
          source: { type: 'system' },
          cephalonId: 'c1'
        },
        {
          id: 'm3',
          timestamp: Date.now(),
          sessionId: 'session-1',
          role: 'assistant',
          kind: 'message',
          content: { text: 'Normal message 2' },
          retrieval: { pinned: false },
          source: { type: 'discord' },
          cephalonId: 'c1'
        }
      ]
      await route.fulfill({ json: { memories, total: 3, offset: 0, limit: 20 } })
    })

    // Navigate to the app
    // Assuming the app runs on localhost:5173 (Vite default)
    await page.goto('http://localhost:5173/')
  })

  test('should show Sessions and Activity by default', async ({ page }) => {
    // Check for Session List
    await expect(page.getByText('Active Sessions')).toBeVisible()
    await expect(page.getByText('session-1')).toBeVisible()

    // Check for Activity Feed (Memories)
    await expect(page.getByText('Normal message 1')).toBeVisible()
  })

  test('should prioritize errors in the feed', async ({ page }) => {
    // Wait for memories to load
    await expect(page.getByText('Error message')).toBeVisible()

    // Get all memory cards text
    const cards = page.getByTestId('memory-card')
    const firstCardText = await cards.first().textContent()
    
    // The error message should be first, even though it's older than m3
    expect(firstCardText).toContain('Error message')
  })

  test('should filter by error', async ({ page }) => {
    // Click Errors filter
    await page.getByRole('button', { name: 'Errors' }).click()

    // Check that only error is visible
    await expect(page.getByText('Error message')).toBeVisible()
    await expect(page.getByText('Normal message 1')).toBeHidden()
    await expect(page.getByText('Normal message 2')).toBeHidden()
  })

  test('should filter by session', async ({ page }) => {
    // Click on session-1
    await page.getByText('session-1').click()
    
    // Since all mocked memories are session-1, they should all be visible
    // But let's verify the selection state
    const sessionBtn = page.getByText('session-1').locator('..').locator('..')
    await expect(sessionBtn).toHaveClass(/selected/)
  })
})
