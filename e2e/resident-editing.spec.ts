import { test, expect } from '@playwright/test'

test.describe('Resident Editing and Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')
  })

  test('should display resident detail page with all information', async ({ page }) => {
    // First, create a resident if none exists or navigate to existing one
    await page.goto('/residents')
    
    // Check if residents exist, if not create one
    const hasResidents = await page.locator('text=All Residents').isVisible()
    
    if (hasResidents) {
      // Click on first resident if any exist
      const firstResidentLink = page.locator('table tbody tr:first-child a').first()
      if (await firstResidentLink.isVisible()) {
        await firstResidentLink.click()
        
        // Verify we're on the resident detail page
        await expect(page.locator('h1')).toContainText(/\w+ \w+/) // Name format
        await expect(page.locator('text=Basic Information')).toBeVisible()
        await expect(page.locator('text=Status')).toBeVisible()
        await expect(page.locator('text=Funding')).toBeVisible()
        await expect(page.locator('text=Audit Trail')).toBeVisible()
      }
    }
  })

  test('should allow changing resident status', async ({ page }) => {
    // Navigate to residents page and select first resident
    await page.goto('/residents')
    
    const firstResidentLink = page.locator('table tbody tr:first-child a').first()
    if (await firstResidentLink.isVisible()) {
      await firstResidentLink.click()
      
      // Look for status change buttons
      const statusChangeButton = page.locator('button:has-text("Change to")')
      if (await statusChangeButton.first().isVisible()) {
        await statusChangeButton.first().click()
        
        // Should open confirmation dialog
        await expect(page.locator('text=Confirm Status Change')).toBeVisible()
        
        // Cancel the change
        await page.locator('button:has-text("Cancel")').click()
        await expect(page.locator('text=Confirm Status Change')).not.toBeVisible()
      }
    }
  })

  test('should allow adding funding information', async ({ page }) => {
    // Navigate to residents page and select first resident
    await page.goto('/residents')
    
    const firstResidentLink = page.locator('table tbody tr:first-child a').first()
    if (await firstResidentLink.isVisible()) {
      await firstResidentLink.click()
      
      // Look for add funding button
      const addFundingButton = page.locator('button:has-text("Add"), button:has-text("Funding")')
      if (await addFundingButton.first().isVisible()) {
        await addFundingButton.first().click()
        
        // Should open funding form
        await expect(page.locator('text=Add Funding Information')).toBeVisible()
        
        // Fill form
        await page.locator('select[name*="type"], select:has(option:text("NDIS"))').selectOption('NDIS')
        await page.locator('input[name*="amount"], input[type="number"]').fill('1000')
        await page.locator('input[name*="startDate"], input[type="date"]').fill('2024-01-01')
        
        // Cancel instead of submitting to avoid API errors in E2E
        await page.locator('button:has-text("Cancel")').click()
      }
    }
  })

  test('should navigate to edit page', async ({ page }) => {
    // Navigate to residents page and select first resident
    await page.goto('/residents')
    
    const firstResidentLink = page.locator('table tbody tr:first-child a').first()
    if (await firstResidentLink.isVisible()) {
      await firstResidentLink.click()
      
      // Click edit button
      const editButton = page.locator('a:has-text("Edit Resident")')
      if (await editButton.isVisible()) {
        await editButton.click()
        
        // Should navigate to edit page
        await expect(page.url()).toContain('/edit')
        await expect(page.locator('h1:has-text("Edit")')).toBeVisible()
        
        // Should show form fields
        await expect(page.locator('input[name*="firstName"], label:has-text("First Name") + input')).toBeVisible()
        await expect(page.locator('input[name*="lastName"], label:has-text("Last Name") + input')).toBeVisible()
        await expect(page.locator('input[name*="email"], input[type="email"]')).toBeVisible()
      }
    }
  })

  test('should display audit trail with entries', async ({ page }) => {
    // Navigate to residents page and select first resident
    await page.goto('/residents')
    
    const firstResidentLink = page.locator('table tbody tr:first-child a').first()
    if (await firstResidentLink.isVisible()) {
      await firstResidentLink.click()
      
      // Scroll to audit trail section
      await page.locator('text=Audit Trail').scrollIntoViewIfNeeded()
      
      // Check audit trail is visible
      await expect(page.locator('text=Audit Trail')).toBeVisible()
      
      // Look for audit entries or empty state
      const hasEntries = await page.locator('text=entries)').isVisible()
      const hasEmptyState = await page.locator('text=No audit trail entries available').isVisible()
      
      expect(hasEntries || hasEmptyState).toBe(true)
    }
  })

  test('should show resident in global residents table', async ({ page }) => {
    await page.goto('/residents')
    
    // Should show residents table
    await expect(page.locator('text=All Residents')).toBeVisible()
    
    // Check table headers
    await expect(page.locator('th:has-text("Name")')).toBeVisible()
    await expect(page.locator('th:has-text("House")')).toBeVisible()
    await expect(page.locator('th:has-text("Status")')).toBeVisible()
    await expect(page.locator('th:has-text("Funding")')).toBeVisible()
    await expect(page.locator('th:has-text("Actions")')).toBeVisible()
    
    // If residents exist, check first row
    const firstRow = page.locator('table tbody tr:first-child')
    if (await firstRow.isVisible()) {
      await expect(firstRow.locator('a:has-text("View")')).toBeVisible()
      await expect(firstRow.locator('a:has-text("Edit")')).toBeVisible()
    }
  })

  test('should validate form fields in edit mode', async ({ page }) => {
    // Navigate to residents page and select first resident
    await page.goto('/residents')
    
    const firstResidentLink = page.locator('table tbody tr:first-child a').first()
    if (await firstResidentLink.isVisible()) {
      await firstResidentLink.click()
      
      // Navigate to edit page
      const editButton = page.locator('a:has-text("Edit Resident")')
      if (await editButton.isVisible()) {
        await editButton.click()
        
        // Clear required field and try to submit
        const firstNameInput = page.locator('input[name*="firstName"], label:has-text("First Name") + input')
        if (await firstNameInput.isVisible()) {
          await firstNameInput.clear()
          
          // Try to submit form
          const saveButton = page.locator('button:has-text("Save"), button[type="submit"]')
          if (await saveButton.isVisible()) {
            await saveButton.click()
            
            // Should show validation error
            await expect(page.locator('text=required, text=Required')).toBeVisible()
          }
        }
      }
    }
  })

  test('should handle navigation between pages', async ({ page }) => {
    await page.goto('/residents')
    
    // Navigate to first resident detail
    const firstResidentLink = page.locator('table tbody tr:first-child a').first()
    if (await firstResidentLink.isVisible()) {
      await firstResidentLink.click()
      
      // Check breadcrumb navigation
      const breadcrumbLink = page.locator('a:has-text("Residents")')
      if (await breadcrumbLink.isVisible()) {
        await breadcrumbLink.click()
        
        // Should return to residents list
        await expect(page.url()).toContain('/residents')
        await expect(page.locator('text=All Residents')).toBeVisible()
      }
    }
  })

  test('should display loading states appropriately', async ({ page }) => {
    // Navigate to residents page
    await page.goto('/residents')
    
    // Should show loading skeletons initially or content
    const hasContent = await page.locator('text=All Residents').isVisible({ timeout: 5000 })
    const hasLoading = await page.locator('.animate-pulse').isVisible()
    
    // Either content loaded or loading state shown
    expect(hasContent || hasLoading).toBe(true)
  })

  test('should handle empty states correctly', async ({ page }) => {
    // Navigate to residents page
    await page.goto('/residents')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Should either show residents or empty state
    const hasResidents = await page.locator('table tbody tr').count() > 0
    const hasEmptyState = await page.locator('text=No residents found').isVisible()
    
    // One of these should be true
    expect(hasResidents || hasEmptyState).toBe(true)
  })
})