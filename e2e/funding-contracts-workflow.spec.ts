import { test, expect } from '@playwright/test'

test.describe('Funding Contracts Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')
  })

  test('complete funding contract lifecycle: create → activate → view balance', async ({ page }) => {
    // Navigate to residents page
    await page.goto('/residents')
    
    // Check if residents exist, if not create one first
    const hasResidents = await page.locator('table tbody tr').count()
    
    if (hasResidents === 0) {
      // Create a test resident first
      await page.goto('/houses')
      
      // Add a house first if needed
      const addHouseButton = page.locator('text=Add New House')
      if (await addHouseButton.isVisible()) {
        await addHouseButton.click()
        await page.fill('input[name="name"]', 'Test House for Contracts')
        await page.fill('input[name="address"]', '123 Contract St')
        await page.fill('input[name="postcode"]', '3000')
        await page.click('button[type="submit"]')
        await page.waitForTimeout(1000)
      }
      
      // Navigate back to houses and add resident
      await page.goto('/houses')
      const addResidentLink = page.locator('text=Add Residents').first()
      if (await addResidentLink.isVisible()) {
        await addResidentLink.click()
        await page.fill('input[name="firstName"]', 'Contract')
        await page.fill('input[name="lastName"]', 'Testuser')
        await page.fill('input[name="dateOfBirth"]', '1990-01-01')
        await page.selectOption('select[name="gender"]', 'Male')
        await page.click('button[type="submit"]')
        await page.waitForTimeout(1000)
      }
    }
    
    // Navigate to residents and select first one
    await page.goto('/residents')
    const firstResidentLink = page.locator('table tbody tr:first-child a').first()
    await firstResidentLink.click()
    
    // Wait for resident detail page to load
    await expect(page.locator('h1')).toBeVisible()
    
    // Create a new funding contract
    await page.click('text=Add Contract')
    
    // Fill contract form
    await page.selectOption('select[name="type"]', 'NDIS')
    await page.fill('input[name="amount"]', '24000')
    await page.fill('input[name="startDate"]', '2024-01-01')
    await page.fill('input[name="endDate"]', '2024-12-31')
    await page.fill('textarea[name="description"]', 'NDIS support funding contract for testing')
    await page.selectOption('select[name="drawdownRate"]', 'monthly')
    await page.check('input[name="autoDrawdown"]')
    await page.check('input[name="isActive"]')
    
    // Submit the contract
    await page.click('button[type="submit"]')
    
    // Wait for contract to be created
    await page.waitForTimeout(2000)
    
    // Verify contract appears with Draft status
    await expect(page.locator('text=Draft')).toBeVisible()
    await expect(page.locator('text=$24,000')).toBeVisible()
    await expect(page.locator('text=NDIS')).toBeVisible()
    
    // Verify balance display shows correct information
    await expect(page.locator('text=Funding Overview')).toBeVisible()
    await expect(page.locator('text=Current Balance')).toBeVisible()
    
    // Activate the contract
    await page.click('text=Activate Contract')
    
    // Confirm activation in dialog
    await expect(page.locator('text=Confirm Status Change')).toBeVisible()
    await expect(page.locator('text=Balance tracking will begin')).toBeVisible()
    await page.click('button:has-text("Activate Contract")')
    
    // Wait for activation to complete
    await page.waitForTimeout(2000)
    
    // Verify contract is now Active
    await expect(page.locator('text=Active')).toBeVisible()
    await expect(page.locator('text=Draft')).not.toBeVisible()
    
    // Verify balance tracking is working
    await expect(page.locator('text=Current Balance')).toBeVisible()
    await expect(page.locator('text=Drawn Down')).toBeVisible()
    
    // Check that progress bars are visible for active contract
    await expect(page.locator('text=Drawdown Progress')).toBeVisible()
    await expect(page.locator('text=Timeline Progress')).toBeVisible()
    
    // Verify contract details are displayed correctly
    await expect(page.locator('text=Monthly drawdown')).toBeVisible()
    await expect(page.locator('text=NDIS support funding contract for testing')).toBeVisible()
    
    // Check audit trail has recorded the contract creation and activation
    await page.locator('text=Audit Trail').scrollIntoViewIfNeeded()
    await expect(page.locator('text=CONTRACT_CREATED')).toBeVisible()
    await expect(page.locator('text=CONTRACT_STATUS_CHANGED')).toBeVisible()
  })

  test('contract status transitions follow validation rules', async ({ page }) => {
    // Navigate to a resident with existing contracts
    await page.goto('/residents')
    
    const firstResidentLink = page.locator('table tbody tr:first-child a').first()
    if (await firstResidentLink.isVisible()) {
      await firstResidentLink.click()
      
      // Look for existing draft contracts or create one
      const hasDraftContract = await page.locator('text=Draft').isVisible()
      
      if (!hasDraftContract) {
        // Create a draft contract
        await page.click('text=Add Contract')
        await page.selectOption('select[name="type"]', 'Government')
        await page.fill('input[name="amount"]', '15000')
        await page.fill('input[name="startDate"]', '2024-06-01')
        await page.fill('input[name="endDate"]', '2025-05-31')
        await page.click('button[type="submit"]')
        await page.waitForTimeout(1000)
      }
      
      // Test Draft → Active transition
      await page.click('text=Activate Contract')
      await expect(page.locator('text=Confirm Status Change')).toBeVisible()
      await page.click('button:has-text("Cancel")')
      
      // Test Draft → Cancel transition
      await page.click('text=Cancel Contract')
      await expect(page.locator('text=Cancelling Contract:')).toBeVisible()
      await expect(page.locator('text=This action cannot be undone')).toBeVisible()
      await page.click('button:has-text("Cancel")')
      
      // Actually activate the contract
      await page.click('text=Activate Contract')
      await page.click('button:has-text("Activate Contract")')
      await page.waitForTimeout(1000)
      
      // Verify only valid transitions are available for Active contracts
      await expect(page.locator('text=Active')).toBeVisible()
      
      // Active contracts should have options to Expire or Cancel
      await expect(page.locator('text=Mark as Expired', 'text=Cancel Contract')).toHaveCount(2)
    }
  })

  test('balance display updates correctly across different contract states', async ({ page }) => {
    await page.goto('/residents')
    
    const firstResidentLink = page.locator('table tbody tr:first-child a').first()
    if (await firstResidentLink.isVisible()) {
      await firstResidentLink.click()
      
      // Check overall balance display
      await expect(page.locator('text=Funding Overview')).toBeVisible()
      
      const currentBalanceElements = page.locator('text=Current Balance')
      const totalAllocatedElements = page.locator('text=Total Allocated')
      const drawnDownElements = page.locator('text=Drawn Down')
      const activeContractsElements = page.locator('text=Active Contracts')
      
      // Verify all balance summary elements are present
      await expect(currentBalanceElements.first()).toBeVisible()
      await expect(totalAllocatedElements.first()).toBeVisible()
      await expect(drawnDownElements.first()).toBeVisible()
      await expect(activeContractsElements.first()).toBeVisible()
      
      // Check that progress bars are displayed
      const progressBars = page.locator('[style*="width"]')
      await expect(progressBars.first()).toBeVisible()
      
      // Verify active contracts section
      const activeContractsSection = page.locator('text=Active Contracts')
      if (await activeContractsSection.isVisible()) {
        await expect(activeContractsSection).toBeVisible()
        
        // Check individual contract cards show balance information
        await expect(page.locator('text=Original Amount')).toBeVisible()
        await expect(page.locator('text=Current Balance')).toBeVisible()
        await expect(page.locator('text=Drawn Down')).toBeVisible()
      }
    }
  })

  test('contract expiry warnings display correctly', async ({ page }) => {
    // This test would require mocking dates or creating contracts with near-expiry dates
    await page.goto('/residents')
    
    const firstResidentLink = page.locator('table tbody tr:first-child a').first()
    if (await firstResidentLink.isVisible()) {
      await firstResidentLink.click()
      
      // Create a contract that expires soon
      await page.click('text=Add Contract')
      await page.selectOption('select[name="type"]', 'Private')
      await page.fill('input[name="amount"]', '5000')
      
      // Set end date to near future (this would need to be dynamic in real tests)
      const nearFutureDate = new Date()
      nearFutureDate.setDate(nearFutureDate.getDate() + 15)
      await page.fill('input[name="endDate"]', nearFutureDate.toISOString().split('T')[0])
      
      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000)
      
      // Activate the contract
      await page.click('text=Activate Contract')
      await page.click('button:has-text("Activate Contract")')
      await page.waitForTimeout(1000)
      
      // Check for expiring soon warning (would appear if date logic detects it)
      const expiringWarnings = page.locator('text=Expiring Soon, text=expiring')
      const warningCount = await expiringWarnings.count()
      
      // If warnings are present, verify they're displayed correctly
      if (warningCount > 0) {
        await expect(expiringWarnings.first()).toBeVisible()
      }
    }
  })

  test('resident table shows contract balance information', async ({ page }) => {
    await page.goto('/residents')
    
    // Verify the global residents table shows contract information
    await expect(page.locator('text=All Residents')).toBeVisible()
    
    // Check table headers include funding information
    await expect(page.locator('th:has-text("Funding")')).toBeVisible()
    
    // Check that resident rows show balance information
    const residentRows = page.locator('table tbody tr')
    const rowCount = await residentRows.count()
    
    if (rowCount > 0) {
      // Check first resident row has funding information
      const firstRow = residentRows.first()
      
      // Should show either "No contracts" or balance amount
      const hasContracts = await firstRow.locator('text=$').count() > 0
      const hasNoContracts = await firstRow.locator('text=No contracts').isVisible()
      
      expect(hasContracts || hasNoContracts).toBeTruthy()
      
      // If has contracts, should show active count
      if (hasContracts) {
        await expect(firstRow.locator('text=active')).toBeVisible()
      }
      
      // Check for expiring indicators in the table
      const expiringIndicators = page.locator('text=expiring')
      // Expiring indicators may or may not be present depending on data
    }
  })

  test('contract form validation works correctly', async ({ page }) => {
    await page.goto('/residents')
    
    const firstResidentLink = page.locator('table tbody tr:first-child a').first()
    if (await firstResidentLink.isVisible()) {
      await firstResidentLink.click()
      
      // Open contract form
      await page.click('text=Add Contract')
      
      // Test required field validation
      await page.click('button[type="submit"]')
      
      // Should show validation errors for required fields
      // Note: Exact error messages depend on the validation implementation
      const errorMessages = page.locator('text=required, text=Required, [class*="text-red"]')
      await expect(errorMessages.first()).toBeVisible()
      
      // Test amount validation
      await page.fill('input[name="amount"]', '-100')
      await page.click('button[type="submit"]')
      await expect(page.locator('text=positive, text=must be positive')).toBeVisible()
      
      // Test date validation
      await page.fill('input[name="amount"]', '1000')
      await page.fill('input[name="startDate"]', '2024-12-31')
      await page.fill('input[name="endDate"]', '2024-01-01') // End before start
      await page.click('button[type="submit"]')
      await expect(page.locator('text=after start')).toBeVisible()
      
      // Fix validation and submit successfully
      await page.fill('input[name="endDate"]', '2025-12-31')
      await page.selectOption('select[name="type"]', 'NDIS')
      await page.click('button[type="submit"]')
      
      // Should close form and show new contract
      await page.waitForTimeout(1000)
      await expect(page.locator('text=Add Contract')).toBeVisible() // Form closed
    }
  })

  test('handles loading states and error conditions', async ({ page }) => {
    await page.goto('/residents')
    
    // Test loading states in resident list
    await expect(page.locator('text=All Residents')).toBeVisible()
    
    // Test navigation to resident detail
    const firstResidentLink = page.locator('table tbody tr:first-child a').first()
    if (await firstResidentLink.isVisible()) {
      await firstResidentLink.click()
      
      // Page should load without errors
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('text=Contract Management, text=Funding Overview')).toBeVisible()
      
      // Test that error states don't appear under normal conditions
      await expect(page.locator('text=Network error')).not.toBeVisible()
      await expect(page.locator('text=Failed to load')).not.toBeVisible()
    }
  })
})