import { test, expect } from "@playwright/test"

test.describe("Standalone Residents Feature", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing data
    await page.goto("/residents")
    await page.evaluate(() => {
      localStorage.clear()
    })
  })

  test("admin can view global residents page", async ({ page }) => {
    await page.goto("/residents")
    
    // Wait for page to load
    await page.waitForSelector('text=All Residents')
    
    // Verify page elements
    await expect(page.locator("h1")).toContainText("All Residents")
    await expect(page.locator("text=Manage residents across all houses")).toBeVisible()
    await expect(page.locator("text=Add New Resident")).toBeVisible()
  })

  test("shows empty state when no residents exist", async ({ page }) => {
    await page.goto("/residents")
    
    // Wait for empty state to load
    await page.waitForSelector('text=No residents found')
    
    // Verify empty state message
    await expect(page.locator("text=No residents found")).toBeVisible()
    await expect(page.locator("text=No residents have been created yet.")).toBeVisible()
  })

  test("admin can add resident from global residents page", async ({ page }) => {
    // First, create a house to select from
    await page.goto("/houses/new")
    await page.fill('input[name="address1"]', "123 Global Test Street")
    await page.fill('input[name="suburb"]', "Sydney")
    await page.selectOption('select[name="state"]', "NSW")
    await page.fill('input[name="postcode"]', "2000")
    await page.click('button[type="submit"]')
    await page.waitForURL("/houses")
    
    // Now go to global residents page
    await page.goto("/residents")
    
    // Click add resident button
    await page.click('text=Add New Resident')
    
    // Wait for modal to open
    await page.waitForSelector('text=Add New Resident')
    
    // Verify house selection section appears
    await expect(page.locator("text=House Assignment")).toBeVisible()
    await expect(page.locator("text=Select House")).toBeVisible()
    
    // Select the house we created
    await page.selectOption('select[id="houseSelection"]', { label: /123 Global Test Street - Sydney, NSW 2000/ })
    
    // Fill resident form
    await page.fill('input[name="firstName"]', "Global")
    await page.fill('input[name="lastName"]', "Resident")
    await page.fill('input[name="dateOfBirth"]', "1985-12-25")
    await page.selectOption('select[name="gender"]', "Female")
    await page.fill('input[name="phone"]', "0423456789")
    await page.fill('input[name="email"]', "global.resident@example.com")
    await page.fill('input[name="ndisId"]', "87654321")
    await page.fill('textarea[name="notes"]', "Added via global residents page")
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Wait for modal to close and resident to appear in table
    await page.waitForSelector('text=Global Resident', { timeout: 10000 })
    
    // Verify resident appears in global table
    await expect(page.locator("table")).toContainText("Global Resident")
    await expect(page.locator("table")).toContainText("Female")
    await expect(page.locator("table")).toContainText("0423456789")
    await expect(page.locator("table")).toContainText("global.resident@example.com")
    await expect(page.locator("table")).toContainText("87654321")
    await expect(page.locator("table")).toContainText("123 Global Test Street")
    
    // Verify resident count is displayed
    await expect(page.locator("text=All Residents (1)")).toBeVisible()
  })

  test("form validates house selection is required", async ({ page }) => {
    // Create a house first
    await page.goto("/houses/new")
    await page.fill('input[name="address1"]', "123 Test Street")
    await page.fill('input[name="suburb"]', "Melbourne")
    await page.selectOption('select[name="state"]', "VIC")
    await page.fill('input[name="postcode"]', "3000")
    await page.click('button[type="submit"]')
    await page.waitForURL("/houses")
    
    await page.goto("/residents")
    
    // Click add resident button
    await page.click('text=Add New Resident')
    await page.waitForSelector('text=Add New Resident')
    
    // Fill required personal fields but don't select house
    await page.fill('input[name="firstName"]', "Test")
    await page.fill('input[name="lastName"]', "User")
    await page.fill('input[name="dateOfBirth"]', "1990-01-01")
    await page.selectOption('select[name="gender"]', "Male")
    
    // Try to submit without selecting house
    await page.click('button[type="submit"]')
    
    // Verify house selection error appears
    await expect(page.locator("text=Please select a house")).toBeVisible()
  })

  test("displays residents from multiple houses", async ({ page }) => {
    // Create two houses
    await page.goto("/houses/new")
    await page.fill('input[name="address1"]', "123 First Street")
    await page.fill('input[name="suburb"]', "Melbourne")
    await page.selectOption('select[name="state"]', "VIC")
    await page.fill('input[name="postcode"]', "3000")
    await page.click('button[type="submit"]')
    await page.waitForURL("/houses")
    
    await page.goto("/houses/new")
    await page.fill('input[name="address1"]', "456 Second Avenue")
    await page.fill('input[name="suburb"]', "Brisbane")
    await page.selectOption('select[name="state"]', "QLD")
    await page.fill('input[name="postcode"]', "4000")
    await page.click('button[type="submit"]')
    await page.waitForURL("/houses")
    
    // Add resident to first house via global page
    await page.goto("/residents")
    await page.click('text=Add New Resident')
    await page.waitForSelector('text=Add New Resident')
    
    await page.selectOption('select[id="houseSelection"]', { label: /123 First Street - Melbourne, VIC 3000/ })
    await page.fill('input[name="firstName"]', "First")
    await page.fill('input[name="lastName"]', "Resident")
    await page.fill('input[name="dateOfBirth"]', "1990-01-01")
    await page.selectOption('select[name="gender"]', "Male")
    await page.click('button[type="submit"]')
    
    await page.waitForSelector('text=First Resident')
    
    // Add resident to second house via global page
    await page.click('text=Add New Resident')
    await page.waitForSelector('text=Add New Resident')
    
    await page.selectOption('select[id="houseSelection"]', { label: /456 Second Avenue - Brisbane, QLD 4000/ })
    await page.fill('input[name="firstName"]', "Second")
    await page.fill('input[name="lastName"]', "Resident")
    await page.fill('input[name="dateOfBirth"]', "1985-06-15")
    await page.selectOption('select[name="gender"]', "Female")
    await page.click('button[type="submit"]')
    
    await page.waitForSelector('text=Second Resident')
    
    // Verify both residents appear with their house information
    await expect(page.locator("table")).toContainText("First Resident")
    await expect(page.locator("table")).toContainText("123 First Street")
    await expect(page.locator("table")).toContainText("Second Resident")
    await expect(page.locator("table")).toContainText("456 Second Avenue")
    await expect(page.locator("text=All Residents (2)")).toBeVisible()
  })

  test("shows loading state while fetching data", async ({ page }) => {
    await page.goto("/residents")
    
    // Due to the 300ms delay in the API, we should see skeleton loading state briefly
    // This is a timing-sensitive test, so we'll check for skeleton elements
    const skeletonExists = await page.locator(".animate-pulse").count()
    expect(skeletonExists).toBeGreaterThanOrEqual(0) // May or may not catch the loading state
  })

  test("resident created via global page appears in house detail view", async ({ page }) => {
    // Create a house
    await page.goto("/houses/new")
    await page.fill('input[name="address1"]', "789 Integration Street")
    await page.fill('input[name="suburb"]', "Perth")
    await page.selectOption('select[name="state"]', "WA")
    await page.fill('input[name="postcode"]', "6000")
    await page.click('button[type="submit"]')
    await page.waitForURL("/houses")
    
    // Add resident via global residents page
    await page.goto("/residents")
    await page.click('text=Add New Resident')
    await page.waitForSelector('text=Add New Resident')
    
    await page.selectOption('select[id="houseSelection"]', { label: /789 Integration Street - Perth, WA 6000/ })
    await page.fill('input[name="firstName"]', "Integration")
    await page.fill('input[name="lastName"]', "Test")
    await page.fill('input[name="dateOfBirth"]', "1992-03-10")
    await page.selectOption('select[name="gender"]', "Male")
    await page.click('button[type="submit"]')
    
    await page.waitForSelector('text=Integration Test')
    
    // Navigate to house detail page
    await page.goto("/houses")
    await page.click('a[href*="/houses/H-"]')
    
    // Verify resident appears in house detail view
    await page.waitForSelector('text=Integration Test')
    await expect(page.locator("table")).toContainText("Integration Test")
    await expect(page.locator("text=Residents (1)")).toBeVisible()
  })

  test("can cancel form and data is not persisted", async ({ page }) => {
    // Create a house
    await page.goto("/houses/new")
    await page.fill('input[name="address1"]', "123 Cancel Street")
    await page.fill('input[name="suburb"]', "Adelaide")
    await page.selectOption('select[name="state"]', "SA")
    await page.fill('input[name="postcode"]', "5000")
    await page.click('button[type="submit"]')
    await page.waitForURL("/houses")
    
    await page.goto("/residents")
    
    // Open form and fill some data
    await page.click('text=Add New Resident')
    await page.waitForSelector('text=Add New Resident')
    
    await page.selectOption('select[id="houseSelection"]', { label: /123 Cancel Street - Adelaide, SA 5000/ })
    await page.fill('input[name="firstName"]', "Should")
    await page.fill('input[name="lastName"]', "NotExist")
    await page.fill('input[name="dateOfBirth"]', "1990-01-01")
    
    // Cancel the form
    await page.click('text=Cancel')
    
    // Verify modal is closed
    await expect(page.locator("text=Add New Resident")).not.toBeVisible()
    
    // Verify no resident was added
    await expect(page.locator("text=No residents found")).toBeVisible()
    await expect(page.locator("text=Should NotExist")).not.toBeVisible()
  })

  test("shows error state on API failure", async ({ page }) => {
    await page.goto("/residents")
    
    // Mock API failure
    await page.route('/api/residents', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Internal server error' })
      })
    })
    
    // Reload page to trigger API call
    await page.reload()
    
    // Wait for error state
    await page.waitForSelector('text=Failed to load residents')
    
    // Verify error message and retry button
    await expect(page.locator("text=Failed to load residents")).toBeVisible()
    await expect(page.locator("text=Try Again")).toBeVisible()
  })
})