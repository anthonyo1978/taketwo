import { test, expect } from "@playwright/test"

test.describe("Add Resident Feature", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing data
    await page.goto("/houses")
    await page.evaluate(() => {
      localStorage.clear()
    })
  })

  test("admin can add resident to house", async ({ page }) => {
    // First, create a house or navigate to existing house
    await page.goto("/houses/new")
    
    // Fill house form
    await page.fill('input[name="address1"]', "123 Test Street")
    await page.fill('input[name="suburb"]', "Melbourne")
    await page.selectOption('select[name="state"]', "VIC")
    await page.fill('input[name="postcode"]', "3000")
    await page.click('button[type="submit"]')
    
    // Wait for redirect to houses list
    await page.waitForURL("/houses")
    
    // Click on the created house
    await page.click('a[href*="/houses/H-"]')
    
    // Wait for house detail page to load
    await page.waitForSelector('text=Add Resident')
    
    // Click add resident button
    await page.click('text=Add Resident')
    
    // Wait for modal to open
    await page.waitForSelector('text=Add New Resident')
    
    // Fill resident form
    await page.fill('input[name="firstName"]', "John")
    await page.fill('input[name="lastName"]', "Doe")
    await page.fill('input[name="dateOfBirth"]', "1990-01-01")
    await page.selectOption('select[name="gender"]', "Male")
    await page.fill('input[name="phone"]', "0412345678")
    await page.fill('input[name="email"]', "john.doe@example.com")
    await page.fill('input[name="ndisId"]', "12345678")
    await page.fill('textarea[name="notes"]', "Test resident notes")
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Wait for modal to close and resident to appear in table
    await page.waitForSelector('text=John Doe', { timeout: 10000 })
    
    // Verify resident appears in table
    await expect(page.locator("table")).toContainText("John Doe")
    await expect(page.locator("table")).toContainText("Male")
    await expect(page.locator("table")).toContainText("0412345678")
    await expect(page.locator("table")).toContainText("john.doe@example.com")
    await expect(page.locator("table")).toContainText("12345678")
    
    // Verify resident count is displayed
    await expect(page.locator("text=Residents (1)")).toBeVisible()
  })

  test("resident form validates required fields", async ({ page }) => {
    // Navigate to house detail page (assuming H-2024-001 exists)
    await page.goto("/houses/new")
    
    // Create a house first
    await page.fill('input[name="address1"]', "123 Test Street")
    await page.fill('input[name="suburb"]', "Melbourne")
    await page.selectOption('select[name="state"]', "VIC")
    await page.fill('input[name="postcode"]', "3000")
    await page.click('button[type="submit"]')
    
    await page.waitForURL("/houses")
    await page.click('a[href*="/houses/H-"]')
    
    // Click add resident button
    await page.click('text=Add Resident')
    await page.waitForSelector('text=Add New Resident')
    
    // Try to submit without filling required fields
    await page.click('button[type="submit"]')
    
    // Verify validation errors appear
    await expect(page.locator("text=First name is required")).toBeVisible()
    await expect(page.locator("text=Last name is required")).toBeVisible()
  })

  test("resident form validates phone number format", async ({ page }) => {
    await page.goto("/houses/new")
    
    // Create a house
    await page.fill('input[name="address1"]', "123 Test Street")
    await page.fill('input[name="suburb"]', "Melbourne")
    await page.selectOption('select[name="state"]', "VIC")
    await page.fill('input[name="postcode"]', "3000")
    await page.click('button[type="submit"]')
    
    await page.waitForURL("/houses")
    await page.click('a[href*="/houses/H-"]')
    
    await page.click('text=Add Resident')
    await page.waitForSelector('text=Add New Resident')
    
    // Fill required fields
    await page.fill('input[name="firstName"]', "John")
    await page.fill('input[name="lastName"]', "Doe")
    await page.fill('input[name="dateOfBirth"]', "1990-01-01")
    await page.selectOption('select[name="gender"]', "Male")
    
    // Fill invalid phone number
    await page.fill('input[name="phone"]', "invalid-phone")
    
    await page.click('button[type="submit"]')
    
    // Verify phone validation error
    await expect(page.locator("text=Please enter a valid Australian phone number")).toBeVisible()
  })

  test("resident form validates email format", async ({ page }) => {
    await page.goto("/houses/new")
    
    // Create a house
    await page.fill('input[name="address1"]', "123 Test Street")
    await page.fill('input[name="suburb"]', "Melbourne")
    await page.selectOption('select[name="state"]', "VIC")
    await page.fill('input[name="postcode"]', "3000")
    await page.click('button[type="submit"]')
    
    await page.waitForURL("/houses")
    await page.click('a[href*="/houses/H-"]')
    
    await page.click('text=Add Resident')
    await page.waitForSelector('text=Add New Resident')
    
    // Fill required fields
    await page.fill('input[name="firstName"]', "John")
    await page.fill('input[name="lastName"]', "Doe")
    await page.fill('input[name="dateOfBirth"]', "1990-01-01")
    await page.selectOption('select[name="gender"]', "Male")
    
    // Fill invalid email
    await page.fill('input[name="email"]', "invalid-email")
    
    await page.click('button[type="submit"]')
    
    // Verify email validation error
    await expect(page.locator("text=Please enter a valid email address")).toBeVisible()
  })

  test("can cancel resident form", async ({ page }) => {
    await page.goto("/houses/new")
    
    // Create a house
    await page.fill('input[name="address1"]', "123 Test Street")
    await page.fill('input[name="suburb"]', "Melbourne")
    await page.selectOption('select[name="state"]', "VIC")
    await page.fill('input[name="postcode"]', "3000")
    await page.click('button[type="submit"]')
    
    await page.waitForURL("/houses")
    await page.click('a[href*="/houses/H-"]')
    
    await page.click('text=Add Resident')
    await page.waitForSelector('text=Add New Resident')
    
    // Fill some data
    await page.fill('input[name="firstName"]', "John")
    await page.fill('input[name="lastName"]', "Doe")
    
    // Click cancel
    await page.click('text=Cancel')
    
    // Verify modal is closed
    await expect(page.locator("text=Add New Resident")).not.toBeVisible()
    
    // Verify no resident was added
    await expect(page.locator("text=No residents found")).toBeVisible()
  })

  test("shows empty state when no residents", async ({ page }) => {
    await page.goto("/houses/new")
    
    // Create a house
    await page.fill('input[name="address1"]', "123 Test Street")
    await page.fill('input[name="suburb"]', "Melbourne")
    await page.selectOption('select[name="state"]', "VIC")
    await page.fill('input[name="postcode"]', "3000")
    await page.click('button[type="submit"]')
    
    await page.waitForURL("/houses")
    await page.click('a[href*="/houses/H-"]')
    
    // Wait for residents section to load
    await page.waitForSelector('text=Residents')
    
    // Verify empty state message
    await expect(page.locator("text=No residents found")).toBeVisible()
    await expect(page.locator("text=This house doesn't have any residents yet.")).toBeVisible()
  })

  test("can add multiple residents to same house", async ({ page }) => {
    await page.goto("/houses/new")
    
    // Create a house
    await page.fill('input[name="address1"]', "123 Test Street")
    await page.fill('input[name="suburb"]', "Melbourne")
    await page.selectOption('select[name="state"]', "VIC")
    await page.fill('input[name="postcode"]', "3000")
    await page.click('button[type="submit"]')
    
    await page.waitForURL("/houses")
    await page.click('a[href*="/houses/H-"]')
    
    // Add first resident
    await page.click('text=Add Resident')
    await page.waitForSelector('text=Add New Resident')
    
    await page.fill('input[name="firstName"]', "John")
    await page.fill('input[name="lastName"]', "Doe")
    await page.fill('input[name="dateOfBirth"]', "1990-01-01")
    await page.selectOption('select[name="gender"]', "Male")
    
    await page.click('button[type="submit"]')
    await page.waitForSelector('text=John Doe')
    
    // Add second resident
    await page.click('text=Add Resident')
    await page.waitForSelector('text=Add New Resident')
    
    await page.fill('input[name="firstName"]', "Jane")
    await page.fill('input[name="lastName"]', "Smith")
    await page.fill('input[name="dateOfBirth"]', "1985-06-15")
    await page.selectOption('select[name="gender"]', "Female")
    
    await page.click('button[type="submit"]')
    await page.waitForSelector('text=Jane Smith')
    
    // Verify both residents appear in table
    await expect(page.locator("table")).toContainText("John Doe")
    await expect(page.locator("table")).toContainText("Jane Smith")
    await expect(page.locator("text=Residents (2)")).toBeVisible()
  })

  test("shows loading state while adding resident", async ({ page }) => {
    await page.goto("/houses/new")
    
    // Create a house
    await page.fill('input[name="address1"]', "123 Test Street")
    await page.fill('input[name="suburb"]', "Melbourne")
    await page.selectOption('select[name="state"]', "VIC")
    await page.fill('input[name="postcode"]', "3000")
    await page.click('button[type="submit"]')
    
    await page.waitForURL("/houses")
    await page.click('a[href*="/houses/H-"]')
    
    await page.click('text=Add Resident')
    await page.waitForSelector('text=Add New Resident')
    
    // Fill required fields
    await page.fill('input[name="firstName"]', "John")
    await page.fill('input[name="lastName"]', "Doe")
    await page.fill('input[name="dateOfBirth"]', "1990-01-01")
    await page.selectOption('select[name="gender"]', "Male")
    
    // Click submit and immediately check for loading state
    await page.click('button[type="submit"]')
    
    // Due to the 800ms delay in the API, we should see the loading state briefly
    await expect(page.locator("text=Adding...")).toBeVisible({ timeout: 1000 })
  })

  test("displays resident initials when no photo", async ({ page }) => {
    await page.goto("/houses/new")
    
    // Create a house
    await page.fill('input[name="address1"]', "123 Test Street")
    await page.fill('input[name="suburb"]', "Melbourne")
    await page.selectOption('select[name="state"]', "VIC")
    await page.fill('input[name="postcode"]', "3000")
    await page.click('button[type="submit"]')
    
    await page.waitForURL("/houses")
    await page.click('a[href*="/houses/H-"]')
    
    // Add resident without photo
    await page.click('text=Add Resident')
    await page.waitForSelector('text=Add New Resident')
    
    await page.fill('input[name="firstName"]', "John")
    await page.fill('input[name="lastName"]', "Doe")
    await page.fill('input[name="dateOfBirth"]', "1990-01-01")
    await page.selectOption('select[name="gender"]', "Male")
    
    await page.click('button[type="submit"]')
    await page.waitForSelector('text=John Doe')
    
    // Verify initials are displayed instead of photo
    await expect(page.locator("text=JD")).toBeVisible()
  })
})