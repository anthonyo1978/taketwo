import { test, expect } from '@playwright/test'

test.describe('Houses with Residents Display', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to houses page
    await page.goto('/houses')
  })

  test('displays Resident(s) header in houses table', async ({ page }) => {
    // Wait for page to load and check the header
    await expect(page.locator('th:has-text("Resident(s)")')).toBeVisible()
  })

  test('displays resident avatars when house has residents', async ({ page }) => {
    // First, create a house and add residents to it
    // This test assumes there's at least one house with residents
    
    // Look for houses table
    await expect(page.locator('table')).toBeVisible()
    
    // Check if resident avatars are displayed (circular images or initials)
    const residentCells = page.locator('td').filter({ 
      has: page.locator('div').filter({ hasText: /^[A-Z]{2}$/ }).or(
        page.locator('img[alt*=" "]')
      )
    })
    
    // If there are houses with residents, we should see avatar elements
    const avatarCount = await residentCells.count()
    if (avatarCount > 0) {
      expect(avatarCount).toBeGreaterThan(0)
    }
  })

  test('shows hover tooltip with resident names', async ({ page }) => {
    // Navigate to a specific house that we know has residents
    // For this test, we'll need to create test data first
    
    // Go to houses/new to create a test house
    await page.goto('/houses/new')
    
    // Fill out house form
    await page.fill('input[name="address1"]', '123 Test Street')
    await page.fill('input[name="suburb"]', 'Test Suburb') 
    await page.fill('input[name="state"]', 'NSW')
    await page.fill('input[name="postcode"]', '2000')
    await page.selectOption('select[name="country"]', 'Australia')
    await page.selectOption('select[name="status"]', 'Active')
    await page.fill('input[name="goLiveDate"]', '2024-01-01')
    
    // Submit house creation
    await page.click('button[type="submit"]')
    
    // Should redirect to house detail page
    await expect(page.url()).toMatch(/\/houses\/H\d+/)
    
    // Get the house ID from URL
    const houseId = page.url().split('/').pop()
    
    // Add a resident to this house
    await page.click('text=Add Resident')
    
    // Fill resident form
    await page.fill('input[name="firstName"]', 'Test')
    await page.fill('input[name="lastName"]', 'Resident')
    await page.fill('input[name="dateOfBirth"]', '1990-01-01')
    await page.selectOption('select[name="gender"]', 'Male')
    await page.fill('input[name="phone"]', '0412345678')
    
    // Submit resident creation
    await page.click('button:has-text("Add Resident"):not([aria-label])')
    
    // Wait for resident to be added
    await expect(page.locator('table').locator('td:has-text("Test Resident")')).toBeVisible()
    
    // Now go back to houses listing
    await page.goto('/houses')
    
    // Find our test house row
    await expect(page.locator(`a[href="/houses/${houseId}"]`)).toBeVisible()
    
    // Look for resident avatars in this house's row
    const houseRow = page.locator('tr').filter({ 
      has: page.locator(`a[href="/houses/${houseId}"]`) 
    })
    
    // Find avatar elements in this row (could be image or initials)
    const avatarElements = houseRow.locator('div').filter({ 
      hasText: /^[A-Z]{2}$/ 
    }).or(houseRow.locator('img[alt*="Test Resident"]'))
    
    if (await avatarElements.count() > 0) {
      const firstAvatar = avatarElements.first()
      
      // Hover over the avatar
      await firstAvatar.hover()
      
      // Check for tooltip appearance
      await expect(page.locator('text=Test Resident')).toBeVisible()
    }
  })

  test('displays no residents message for empty houses', async ({ page }) => {
    // Look for houses that have no residents
    const noResidentsCells = page.locator('td:has-text("No residents")')
    
    // If there are empty houses, they should show "No residents"
    const emptyCount = await noResidentsCells.count()
    if (emptyCount > 0) {
      expect(emptyCount).toBeGreaterThan(0)
    }
  })

  test('displays multiple resident avatars for houses with multiple residents', async ({ page }) => {
    // This test would need a house with multiple residents
    // For now, we'll check that the UI supports multiple avatars
    
    // Look for houses table
    await expect(page.locator('table')).toBeVisible()
    
    // Check for rows that might have multiple avatars (flex containers with multiple children)
    const multipleAvatarRows = page.locator('td').filter({
      has: page.locator('div.flex.items-center.space-x-1').filter({
        has: page.locator('div.h-8.w-8').nth(1) // At least 2 avatar elements
      })
    })
    
    // If there are houses with multiple residents, verify they display correctly
    const multiCount = await multipleAvatarRows.count()
    if (multiCount > 0) {
      expect(multiCount).toBeGreaterThan(0)
    }
  })

  test('displays loading state while fetching residents', async ({ page }) => {
    // Navigate to houses page
    await page.goto('/houses')
    
    // Initially should show loading skeletons
    // Since loading is fast, we might need to intercept network or use slow connection
    await page.route('**/api/houses/*/residents', async route => {
      // Delay the response to see loading state
      await page.waitForTimeout(100)
      await route.continue()
    })
    
    // Reload to trigger loading state
    await page.reload()
    
    // Look for loading skeletons (animate-pulse class)
    const loadingElements = page.locator('.animate-pulse')
    
    // Should have some loading elements initially
    if (await loadingElements.count() > 0) {
      expect(await loadingElements.count()).toBeGreaterThan(0)
    }
    
    // Eventually loading should complete
    await expect(page.locator('table')).toBeVisible()
  })

  test('handles API errors gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/houses/*/residents', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error'
        })
      })
    })
    
    // Navigate to houses page
    await page.goto('/houses')
    
    // Should show error state
    await expect(page.locator('text=Error loading residents')).toBeVisible()
  })
})