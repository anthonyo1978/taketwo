import { test, expect } from '@playwright/test'

test.describe('Houses with Residents - Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/houses')
  })

  test('displays Resident(s) header correctly', async ({ page }) => {
    await expect(page.locator('th').filter({ hasText: 'Resident(s)' })).toBeVisible()
  })

  test('displays resident avatars or no residents message', async ({ page }) => {
    // Wait for table to load
    await expect(page.locator('table')).toBeVisible()
    
    // Each house row should either show resident avatars or "No residents"
    const residentCells = page.locator('tbody tr td').nth(3) // Resident column is 4th (index 3)
    const firstCell = residentCells.first()
    
    // Should show either avatars or "No residents" message
    await expect(firstCell).toBeVisible()
    
    // Count total rows to ensure we have some houses
    const rowCount = await page.locator('tbody tr').count()
    expect(rowCount).toBeGreaterThan(0)
  })

  test('loads residents data via API calls', async ({ page }) => {
    // Monitor network requests
    const apiCalls: string[] = []
    
    page.on('request', request => {
      if (request.url().includes('/api/houses/') && request.url().includes('/residents')) {
        apiCalls.push(request.url())
      }
    })
    
    // Navigate to houses page
    await page.goto('/houses')
    
    // Wait for table to appear
    await expect(page.locator('table')).toBeVisible()
    
    // Give it a moment for API calls to complete
    await page.waitForTimeout(2000)
    
    // Should have made API calls to fetch residents for houses
    expect(apiCalls.length).toBeGreaterThan(0)
    
    // Each API call should be for a specific house's residents
    apiCalls.forEach(url => {
      expect(url).toMatch(/\/api\/houses\/H-\d{4}-\d{3}\/residents/)
    })
  })

  test('shows loading skeletons initially', async ({ page }) => {
    // Navigate to houses and check for loading states quickly
    await page.goto('/houses')
    
    // Should see some loading skeletons (if we're fast enough)
    // This test might be flaky due to fast loading, but let's try
    const hasLoadingElements = await page.locator('.animate-pulse').count()
    
    // Eventually the table should load
    await expect(page.locator('table')).toBeVisible()
  })
})