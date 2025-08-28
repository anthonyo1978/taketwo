import { test, expect } from "@playwright/test"

test.describe("Add New House", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to houses page
    await page.goto("/houses")
  })

  test("displays Add New House button and navigates to form", async ({ page }) => {
    // Check Add New House button is visible
    const addButton = page.getByRole("link", { name: /add new house/i })
    await expect(addButton).toBeVisible()

    // Click button and verify navigation
    await addButton.click()
    await page.waitForURL("/houses/new")
    
    // Verify we're on the new house page
    await expect(page.getByRole("heading", { name: /add new house/i })).toBeVisible()
  })

  test("displays all form fields with correct labels", async ({ page }) => {
    await page.goto("/houses/new")
    
    // Address section
    await expect(page.getByLabel(/address line 1/i)).toBeVisible()
    await expect(page.getByLabel(/unit\/apartment/i)).toBeVisible()
    await expect(page.getByLabel(/suburb\/city/i)).toBeVisible()
    await expect(page.getByLabel(/state/i)).toBeVisible()
    await expect(page.getByLabel(/postcode/i)).toBeVisible()
    await expect(page.getByLabel(/country/i)).toBeVisible()
    
    // Property section
    await expect(page.getByLabel(/status/i)).toBeVisible()
    await expect(page.getByLabel(/go-live date/i)).toBeVisible()
    
    // Additional section
    await expect(page.getByLabel(/current resident/i)).toBeVisible()
    await expect(page.getByLabel(/notes/i)).toBeVisible()
    
    // Buttons
    await expect(page.getByRole("button", { name: /create house/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /clear form/i })).toBeVisible()
  })

  test("shows validation errors for empty required fields", async ({ page }) => {
    await page.goto("/houses/new")
    
    // Try to submit without filling required fields
    await page.getByRole("button", { name: /create house/i }).click()
    
    // Check for validation errors
    await expect(page.getByText(/address must be at least 3 characters/i)).toBeVisible()
    await expect(page.getByText(/suburb\/city is required/i)).toBeVisible()
  })

  test("validates postcode format", async ({ page }) => {
    await page.goto("/houses/new")
    
    // Enter invalid postcode
    await page.getByLabel(/postcode/i).fill("123")
    await page.getByLabel(/postcode/i).blur()
    
    // Should show validation error
    await expect(page.getByText(/postcode must be exactly 4 digits/i)).toBeVisible()
    
    // Fix postcode
    await page.getByLabel(/postcode/i).fill("2000")
    await page.getByLabel(/postcode/i).blur()
    
    // Error should disappear
    await expect(page.getByText(/postcode must be exactly 4 digits/i)).not.toBeVisible()
  })

  test("successfully creates house with valid data - happy path", async ({ page }) => {
    await page.goto("/houses/new")
    
    // Fill in all required fields
    await page.getByLabel(/address line 1/i).fill("123 Test Street")
    await page.getByLabel(/unit\/apartment/i).fill("Apt 2B")
    await page.getByLabel(/suburb\/city/i).fill("Sydney")
    await page.getByLabel(/state/i).selectOption("NSW")
    await page.getByLabel(/postcode/i).fill("2000")
    await page.getByLabel(/country/i).fill("AU")
    await page.getByLabel(/status/i).selectOption("Active")
    await page.getByLabel(/go-live date/i).fill("2024-01-15")
    await page.getByLabel(/current resident/i).fill("John Doe")
    await page.getByLabel(/notes/i).fill("Test house for E2E testing")
    
    // Submit form
    await page.getByRole("button", { name: /create house/i }).click()
    
    // Should show loading state
    await expect(page.getByRole("button", { name: /creating/i })).toBeVisible()
    
    // Wait for success toast
    await expect(page.getByText(/house.*created successfully/i)).toBeVisible({ timeout: 10000 })
    
    // Should redirect to house detail page
    await page.waitForURL(/\/houses\/H-\d{4}-\d{3}/, { timeout: 10000 })
    
    // Verify we're on the detail page with correct data
    await expect(page.getByRole("heading", { name: /123 Test Street, Apt 2B/i })).toBeVisible()
    await expect(page.getByText("Sydney, NSW 2000, AU")).toBeVisible()
    await expect(page.getByText("Active").first()).toBeVisible()
    await expect(page.getByText("John Doe")).toBeVisible()
    await expect(page.getByText("Test house for E2E testing")).toBeVisible()
  })

  test("creates house with minimal required fields only", async ({ page }) => {
    await page.goto("/houses/new")
    
    // Fill in only required fields
    await page.getByLabel(/address line 1/i).fill("456 Minimal Street")
    await page.getByLabel(/suburb\/city/i).fill("Melbourne")
    await page.getByLabel(/state/i).selectOption("VIC")
    await page.getByLabel(/postcode/i).fill("3000")
    await page.getByLabel(/go-live date/i).fill("2024-02-01")
    
    // Submit form
    await page.getByRole("button", { name: /create house/i }).click()
    
    // Wait for success and redirect
    await expect(page.getByText(/house.*created successfully/i)).toBeVisible({ timeout: 10000 })
    await page.waitForURL(/\/houses\/H-\d{4}-\d{3}/, { timeout: 10000 })
    
    // Verify minimal data is displayed
    await expect(page.getByRole("heading", { name: /456 Minimal Street/i })).toBeVisible()
    await expect(page.getByText("Melbourne, VIC 3000, AU")).toBeVisible()
  })

  test("API endpoints work correctly - storage persistence across server/client", async ({ page }) => {
    await page.goto("/houses/new")
    
    // Fill in form data
    await page.getByLabel(/address line 1/i).fill("API Test Street")
    await page.getByLabel(/suburb\/city/i).fill("Test City") 
    await page.getByLabel(/state/i).selectOption("NSW")
    await page.getByLabel(/postcode/i).fill("2000")
    await page.getByLabel(/go-live date/i).fill("2024-01-15")
    
    // Submit form
    await page.getByRole("button", { name: /create house/i }).click()
    
    // Wait for success toast and redirect
    await expect(page.getByText(/house.*created successfully/i)).toBeVisible({ timeout: 10000 })
    await page.waitForURL(/\/houses\/H-\d{4}-\d{3}/, { timeout: 10000 })
    
    // Critical test: ensure we can load the house detail page (tests server-side storage)
    // This validates that the API route can retrieve the house that was just created
    await expect(page.getByRole("heading", { name: /API Test Street/i })).toBeVisible()
    await expect(page.getByText("Test City, NSW 2000, AU")).toBeVisible()
    
    // Additional validation: make direct API call to ensure storage works
    const houseId = page.url().match(/H-\d{4}-\d{3}/)?.[0]
    expect(houseId).toBeTruthy()
    
    // Test the API endpoint directly
    const apiResponse = await page.request.get(`/api/houses/${houseId}`)
    expect(apiResponse.status()).toBe(200)
    
    const apiData = await apiResponse.json()
    expect(apiData.success).toBe(true)
    expect(apiData.data.address1).toBe("API Test Street")
    expect(apiData.data.suburb).toBe("Test City")
  })

  test("generates unique house IDs", async ({ page }) => {
    const houseIds: string[] = []
    
    // Create first house
    await page.goto("/houses/new")
    await page.getByLabel(/address line 1/i).fill("First House Street")
    await page.getByLabel(/suburb\/city/i).fill("Brisbane")
    await page.getByLabel(/state/i).selectOption("QLD")
    await page.getByLabel(/postcode/i).fill("4000")
    await page.getByLabel(/go-live date/i).fill("2024-03-01")
    
    await page.getByRole("button", { name: /create house/i }).click()
    await page.waitForURL(/\/houses\/H-\d{4}-\d{3}/, { timeout: 10000 })
    
    // Extract first house ID
    const firstUrl = page.url()
    const firstId = firstUrl.match(/H-\d{4}-\d{3}/)?.[0]
    expect(firstId).toBeTruthy()
    houseIds.push(firstId!)
    
    // Create second house
    await page.goto("/houses/new")
    await page.getByLabel(/address line 1/i).fill("Second House Street")
    await page.getByLabel(/suburb\/city/i).fill("Perth")
    await page.getByLabel(/state/i).selectOption("WA")
    await page.getByLabel(/postcode/i).fill("6000")
    await page.getByLabel(/go-live date/i).fill("2024-03-02")
    
    await page.getByRole("button", { name: /create house/i }).click()
    await page.waitForURL(/\/houses\/H-\d{4}-\d{3}/, { timeout: 10000 })
    
    // Extract second house ID
    const secondUrl = page.url()
    const secondId = secondUrl.match(/H-\d{4}-\d{3}/)?.[0]
    expect(secondId).toBeTruthy()
    houseIds.push(secondId!)
    
    // Verify IDs are unique
    expect(houseIds[0]).not.toBe(houseIds[1])
    
    // Verify ID format (should be sequential)
    const currentYear = new Date().getFullYear()
    expect(houseIds[0]).toMatch(new RegExp(`H-${currentYear}-\\d{3}`))
    expect(houseIds[1]).toMatch(new RegExp(`H-${currentYear}-\\d{3}`))
  })

  test("clear form button resets all fields", async ({ page }) => {
    await page.goto("/houses/new")
    
    // Fill in some fields
    await page.getByLabel(/address line 1/i).fill("Test Address")
    await page.getByLabel(/unit\/apartment/i).fill("Unit 1")
    await page.getByLabel(/suburb\/city/i).fill("Test City")
    await page.getByLabel(/postcode/i).fill("1234")
    await page.getByLabel(/notes/i).fill("Test notes")
    
    // Click clear button
    await page.getByRole("button", { name: /clear form/i }).click()
    
    // Verify fields are cleared (except defaults)
    await expect(page.getByLabel(/address line 1/i)).toHaveValue("")
    await expect(page.getByLabel(/unit\/apartment/i)).toHaveValue("")
    await expect(page.getByLabel(/suburb\/city/i)).toHaveValue("")
    await expect(page.getByLabel(/postcode/i)).toHaveValue("")
    await expect(page.getByLabel(/notes/i)).toHaveValue("")
    
    // Defaults should remain
    await expect(page.getByLabel(/country/i)).toHaveValue("AU")
    await expect(page.getByLabel(/status/i)).toHaveValue("Active")
  })

  test("cancel link returns to houses list", async ({ page }) => {
    await page.goto("/houses/new")
    
    // Click cancel link
    await page.getByRole("link", { name: /cancel/i }).click()
    
    // Should navigate back to houses list
    await page.waitForURL("/houses")
    await expect(page.getByRole("heading", { name: /^houses$/i })).toBeVisible()
  })

  test("breadcrumb navigation works correctly", async ({ page }) => {
    await page.goto("/houses/new")
    
    // Check breadcrumb is present
    await expect(page.getByText("Houses")).toBeVisible()
    await expect(page.getByText("New House")).toBeVisible()
    
    // Click houses breadcrumb
    await page.getByRole("link", { name: /^houses$/i }).click()
    
    // Should navigate to houses list
    await page.waitForURL("/houses")
    await expect(page.getByRole("heading", { name: /^houses$/i })).toBeVisible()
  })

  test("form accessibility - keyboard navigation", async ({ page }) => {
    await page.goto("/houses/new")
    
    // Test tab navigation through form fields
    await page.keyboard.press("Tab") // Address line 1
    await expect(page.getByLabel(/address line 1/i)).toBeFocused()
    
    await page.keyboard.press("Tab") // Unit
    await expect(page.getByLabel(/unit\/apartment/i)).toBeFocused()
    
    await page.keyboard.press("Tab") // Suburb
    await expect(page.getByLabel(/suburb\/city/i)).toBeFocused()
    
    // Should be able to submit with Enter when form is valid
    await page.getByLabel(/address line 1/i).fill("Keyboard Test Street")
    await page.getByLabel(/suburb\/city/i).fill("Test City")
    await page.getByLabel(/state/i).selectOption("NSW")
    await page.getByLabel(/postcode/i).fill("2000")
    await page.getByLabel(/go-live date/i).fill("2024-04-01")
    
    // Navigate to submit button and activate with Enter
    await page.getByRole("button", { name: /create house/i }).focus()
    await page.keyboard.press("Enter")
    
    // Should submit successfully
    await expect(page.getByText(/house.*created successfully/i)).toBeVisible({ timeout: 10000 })
  })

  test("form handles all Australian states", async ({ page }) => {
    await page.goto("/houses/new")
    
    const states = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"]
    
    // Check all states are available in dropdown
    const stateSelect = page.getByLabel(/state/i)
    for (const state of states) {
      await expect(stateSelect.locator(`option[value="${state}"]`)).toBeAttached()
    }
    
    // Test creating house with each state
    for (let i = 0; i < 3; i++) { // Test first 3 states to keep test reasonable
      const state = states[i]
      
      if (i > 0) {
        await page.goto("/houses/new")
      }
      
      await page.getByLabel(/address line 1/i).fill(`${state} Test Street`)
      await page.getByLabel(/suburb\/city/i).fill(`${state} City`)
      await page.getByLabel(/state/i).selectOption(state)
      await page.getByLabel(/postcode/i).fill("1000")
      await page.getByLabel(/go-live date/i).fill("2024-05-01")
      
      await page.getByRole("button", { name: /create house/i }).click()
      await page.waitForURL(/\/houses\/H-\d{4}-\d{3}/, { timeout: 10000 })
      
      // Verify state is displayed correctly
      await expect(page.getByText(`${state} City, ${state} 1000, AU`)).toBeVisible()
    }
  })
})