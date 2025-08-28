import { test, expect } from "@playwright/test"

test.describe("Residents UI - Simple Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage
    await page.goto("/residents")
    await page.evaluate(() => localStorage.clear())
  })

  test("Add New Resident button exists and is clickable", async ({ page }) => {
    await page.goto("/residents")
    
    // Wait for page to load
    await page.waitForLoadState("networkidle")
    
    // Verify page renders correctly
    await expect(page.locator("h1")).toContainText("All Residents")
    
    // Verify Add New Resident button exists
    const addButton = page.locator("button:has-text('Add New Resident')")
    await expect(addButton).toBeVisible()
    
    // Click the button and verify modal opens
    await addButton.click()
    
    // Wait for modal to appear (look for modal title specifically)
    await expect(page.locator("h3:has-text('Add New Resident')")).toBeVisible()
    
    // Verify form fields are present
    await expect(page.locator("text=First Name")).toBeVisible()
    await expect(page.locator("text=Last Name")).toBeVisible()
    await expect(page.locator("text=Select House")).toBeVisible()
    
    // Verify the close functionality
    const cancelButton = page.locator("button:has-text('Cancel')")
    await cancelButton.click()
    
    // Modal should close - check that modal title is gone
    await expect(page.locator("h3:has-text('Add New Resident')")).not.toBeVisible()
  })

  test("residents table shows existing data", async ({ page }) => {
    await page.goto("/residents")
    
    // Wait for page to load
    await page.waitForLoadState("networkidle")
    
    // Wait a bit more for API calls
    await page.waitForTimeout(1000)
    
    // Look for either data or empty state
    const hasData = await page.locator("table tbody tr").count()
    
    if (hasData > 0) {
      // If we have data, verify table structure
      await expect(page.locator("table")).toBeVisible()
      await expect(page.locator("th:has-text('Name')")).toBeVisible()
      await expect(page.locator("th:has-text('House')")).toBeVisible()
    } else {
      // If no data, verify empty state
      await expect(page.locator("text=No residents found")).toBeVisible()
    }
  })

  test("form validation works for house selection", async ({ page }) => {
    // First create a house to select from
    await page.goto("/houses/new")
    await page.fill('input[name="address1"]', "123 Test Street")
    await page.fill('input[name="suburb"]', "Melbourne")
    await page.selectOption('select[name="state"]', "VIC")
    await page.fill('input[name="postcode"]', "3000")
    await page.selectOption('select[name="status"]', "Active")
    await page.fill('input[name="goLiveDate"]', "2024-01-01")
    await page.click('button[type="submit"]')
    
    // Wait for redirect
    await page.waitForURL("/houses")
    
    // Go to residents page  
    await page.goto("/residents")
    await page.waitForLoadState("networkidle")
    
    // Click Add New Resident
    await page.click("button:has-text('Add New Resident')")
    
    // Fill required personal fields but don't select house
    await page.fill('input[name="firstName"]', "Test")
    await page.fill('input[name="lastName"]', "User")
    await page.fill('input[name="dateOfBirth"]', "1990-01-01")
    await page.selectOption('select[name="gender"]', "Male")
    
    // Try to submit without selecting house
    await page.click('button[type="submit"]')
    
    // Verify validation error
    await expect(page.locator("text=Please select a house")).toBeVisible({ timeout: 5000 })
  })
})