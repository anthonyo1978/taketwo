import { test, expect } from "@playwright/test"

test.describe("Dynamic House Listing", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to ensure clean state
    await page.goto("/houses")
    await page.evaluate(() => localStorage.clear())
  })

  test("shows empty state when no houses exist", async ({ page }) => {
    await page.goto("/houses")
    
    // Should show loading skeleton first
    await expect(page.locator(".animate-pulse")).toBeVisible()
    
    // Then show empty state
    await expect(page.getByText("No houses found")).toBeVisible()
    await expect(page.getByText("Get started by creating your first house")).toBeVisible()
    await expect(page.getByRole("link", { name: /create first house/i })).toBeVisible()
  })

  test("shows loading skeleton during API call", async ({ page }) => {
    await page.goto("/houses")
    
    // Should show skeleton loading placeholders
    await expect(page.locator(".animate-pulse")).toBeVisible()
    
    // Should have table headers even during loading
    await expect(page.getByText("House ID")).toBeVisible()
    await expect(page.getByText("Address")).toBeVisible()
    await expect(page.getByText("Status")).toBeVisible()
    
    // Should show multiple skeleton rows
    await expect(page.locator("tbody tr")).toHaveCount(3)
  })

  test("displays created house in dynamic list", async ({ page }) => {
    await page.goto("/houses")
    
    // Wait for empty state to load
    await expect(page.getByText("No houses found")).toBeVisible()
    
    // Create a new house
    await page.getByRole("link", { name: /create first house/i }).click()
    
    // Fill out the house form
    await page.getByLabel(/address line 1/i).fill("123 Dynamic Test Street")
    await page.getByLabel(/unit\/apartment/i).fill("Unit 5A")
    await page.getByLabel(/suburb\/city/i).fill("Melbourne")
    await page.getByLabel(/state/i).selectOption("VIC")
    await page.getByLabel(/postcode/i).fill("3000")
    await page.getByLabel(/go-live date/i).fill("2025-01-15")
    await page.getByLabel(/current resident/i).fill("Alice Johnson")
    await page.getByLabel(/notes/i).fill("Dynamic listing test house")
    
    // Submit form
    await page.getByRole("button", { name: /create house/i }).click()
    
    // Wait for success toast and redirect
    await expect(page.getByText(/house.*created successfully/i)).toBeVisible({ timeout: 10000 })
    await page.waitForURL(/\/houses\/H-\d{4}-\d{3}/, { timeout: 10000 })
    
    // Navigate back to listing
    await page.getByRole("link", { name: /^houses$/i }).first().click()
    
    // Should show loading skeleton briefly
    await expect(page.locator(".animate-pulse")).toBeVisible()
    
    // Should now show the created house in the list
    await expect(page.getByText("Property Listings (1)")).toBeVisible()
    await expect(page.getByText("123 Dynamic Test Street, Unit 5A")).toBeVisible()
    await expect(page.getByText("Melbourne, VIC 3000, AU")).toBeVisible()
    await expect(page.getByText("Alice Johnson")).toBeVisible()
    await expect(page.locator(".bg-green-100")).toBeVisible() // Active status badge
    
    // House ID should be clickable
    const houseLink = page.getByRole("link", { name: /H-\d{4}-\d{3}/ })
    await expect(houseLink).toBeVisible()
    
    // Clicking house ID should navigate to detail page
    await houseLink.click()
    await page.waitForURL(/\/houses\/H-\d{4}-\d{3}/)
    await expect(page.getByText("123 Dynamic Test Street, Unit 5A")).toBeVisible()
  })

  test("list grows dynamically as more houses are added", async ({ page }) => {
    await page.goto("/houses")
    await expect(page.getByText("No houses found")).toBeVisible()
    
    // Create first house
    await page.getByRole("link", { name: /add new house/i }).click()
    await fillHouseForm(page, {
      address: "First House Street",
      suburb: "Brisbane", 
      state: "QLD",
      postcode: "4000",
      resident: "John Doe"
    })
    await page.getByRole("button", { name: /create house/i }).click()
    await page.waitForURL(/\/houses\/H-\d{4}-\d{3}/, { timeout: 10000 })
    
    // Go back to list and verify count
    await page.goto("/houses")
    await expect(page.getByText("Property Listings (1)")).toBeVisible()
    await expect(page.getByText("First House Street")).toBeVisible()
    await expect(page.getByText("John Doe")).toBeVisible()
    
    // Create second house
    await page.getByRole("link", { name: /add new house/i }).click()
    await fillHouseForm(page, {
      address: "Second House Street",
      suburb: "Perth",
      state: "WA", 
      postcode: "6000",
      resident: "Jane Smith"
    })
    await page.getByRole("button", { name: /create house/i }).click()
    await page.waitForURL(/\/houses\/H-\d{4}-\d{3}/, { timeout: 10000 })
    
    // Go back to list and verify both houses
    await page.goto("/houses")
    await expect(page.getByText("Property Listings (2)")).toBeVisible()
    await expect(page.getByText("First House Street")).toBeVisible()
    await expect(page.getByText("Second House Street")).toBeVisible()
    await expect(page.getByText("John Doe")).toBeVisible()
    await expect(page.getByText("Jane Smith")).toBeVisible()
    
    // Create third house
    await page.getByRole("link", { name: /add new house/i }).click()
    await fillHouseForm(page, {
      address: "Third House Street",
      suburb: "Adelaide",
      state: "SA",
      postcode: "5000"
    })
    await page.getByRole("button", { name: /create house/i }).click()
    await page.waitForURL(/\/houses\/H-\d{4}-\d{3}/, { timeout: 10000 })
    
    // Final verification - all three houses
    await page.goto("/houses")
    await expect(page.getByText("Property Listings (3)")).toBeVisible()
    await expect(page.getByText("First House Street")).toBeVisible()
    await expect(page.getByText("Second House Street")).toBeVisible() 
    await expect(page.getByText("Third House Street")).toBeVisible()
  })

  test("status badges display correct colors", async ({ page }) => {
    await page.goto("/houses")
    
    // Create houses with different statuses
    const houses = [
      { address: "Active House", status: "Active" },
      { address: "Vacant House", status: "Vacant" },
      { address: "Maintenance House", status: "Under maintenance" }
    ]
    
    for (const house of houses) {
      await page.getByRole("link", { name: /add new house/i }).click()
      await page.getByLabel(/address line 1/i).fill(house.address)
      await page.getByLabel(/suburb\/city/i).fill("Sydney")
      await page.getByLabel(/state/i).selectOption("NSW")
      await page.getByLabel(/postcode/i).fill("2000")
      await page.getByLabel(/status/i).selectOption(house.status)
      await page.getByLabel(/go-live date/i).fill("2025-01-15")
      
      await page.getByRole("button", { name: /create house/i }).click()
      await page.waitForURL(/\/houses\/H-\d{4}-\d{3}/, { timeout: 10000 })
    }
    
    // Navigate back to list and verify status badge colors
    await page.goto("/houses")
    await expect(page.getByText("Property Listings (3)")).toBeVisible()
    
    // Active = green
    const activeRow = page.locator("tr").filter({ hasText: "Active House" })
    await expect(activeRow.locator(".bg-green-100")).toBeVisible()
    
    // Vacant = yellow  
    const vacantRow = page.locator("tr").filter({ hasText: "Vacant House" })
    await expect(vacantRow.locator(".bg-yellow-100")).toBeVisible()
    
    // Under maintenance = red
    const maintenanceRow = page.locator("tr").filter({ hasText: "Maintenance House" })
    await expect(maintenanceRow.locator(".bg-red-100")).toBeVisible()
  })

  test("handles API errors gracefully with retry", async ({ page }) => {
    // Mock API to fail initially
    await page.route("/api/houses", route => {
      if (route.request().method() === "GET") {
        route.abort()
      } else {
        route.continue()
      }
    })
    
    await page.goto("/houses")
    
    // Should show error message
    await expect(page.getByText("Network error")).toBeVisible()
    await expect(page.getByRole("button", { name: /try again/i })).toBeVisible()
    
    // Remove the route block to simulate recovery
    await page.unroute("/api/houses")
    
    // Click retry button
    await page.getByRole("button", { name: /try again/i }).click()
    
    // Should show loading then empty state
    await expect(page.locator(".animate-pulse")).toBeVisible()
    await expect(page.getByText("No houses found")).toBeVisible()
  })

  test("date formatting displays correctly", async ({ page }) => {
    await page.goto("/houses")
    
    // Create a house
    await page.getByRole("link", { name: /add new house/i }).click()
    await fillHouseForm(page, {
      address: "Date Test House",
      suburb: "Sydney",
      state: "NSW", 
      postcode: "2000"
    })
    await page.getByRole("button", { name: /create house/i }).click()
    await page.waitForURL(/\/houses\/H-\d{4}-\d{3}/, { timeout: 10000 })
    
    // Go back to list
    await page.goto("/houses")
    
    // Verify date column shows formatted date
    const dateCell = page.locator("tr").filter({ hasText: "Date Test House" }).locator("td").nth(4)
    await expect(dateCell).toContainText(/\d{1,2}\/\d{1,2}\/\d{4}/) // MM/DD/YYYY or DD/MM/YYYY format
  })

  test("view links navigate to correct house details", async ({ page }) => {
    await page.goto("/houses")
    
    // Create two houses
    await page.getByRole("link", { name: /add new house/i }).click()
    await fillHouseForm(page, {
      address: "Navigation Test 1",
      suburb: "Sydney",
      state: "NSW",
      postcode: "2000"
    })
    await page.getByRole("button", { name: /create house/i }).click()
    const firstHouseUrl = page.url()
    const firstHouseId = firstHouseUrl.match(/H-\d{4}-\d{3}/)?.[0]
    
    await page.goto("/houses/new")
    await fillHouseForm(page, {
      address: "Navigation Test 2", 
      suburb: "Melbourne",
      state: "VIC",
      postcode: "3000"
    })
    await page.getByRole("button", { name: /create house/i }).click()
    const secondHouseUrl = page.url()
    const secondHouseId = secondHouseUrl.match(/H-\d{4}-\d{3}/)?.[0]
    
    // Go to list
    await page.goto("/houses")
    await expect(page.getByText("Property Listings (2)")).toBeVisible()
    
    // Click View link for first house
    const firstRow = page.locator("tr").filter({ hasText: "Navigation Test 1" })
    await firstRow.getByRole("link", { name: /view/i }).click()
    await page.waitForURL(`/houses/${firstHouseId}`)
    await expect(page.getByText("Navigation Test 1")).toBeVisible()
    
    // Go back and click View link for second house
    await page.goto("/houses")
    const secondRow = page.locator("tr").filter({ hasText: "Navigation Test 2" })
    await secondRow.getByRole("link", { name: /view/i }).click()
    await page.waitForURL(`/houses/${secondHouseId}`)
    await expect(page.getByText("Navigation Test 2")).toBeVisible()
  })

  test("maintains responsive design on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/houses")
    
    // Create a house first
    await page.getByRole("link", { name: /add new house/i }).click()
    await fillHouseForm(page, {
      address: "Mobile Test House",
      suburb: "Sydney",
      state: "NSW",
      postcode: "2000"
    })
    await page.getByRole("button", { name: /create house/i }).click()
    await page.waitForURL(/\/houses\/H-\d{4}-\d{3}/, { timeout: 10000 })
    
    // Go back to list on mobile
    await page.goto("/houses")
    
    // Should show horizontal scroll for table on mobile
    const tableContainer = page.locator(".overflow-x-auto")
    await expect(tableContainer).toBeVisible()
    
    // Header and Add button should still be visible
    await expect(page.getByText("Houses")).toBeVisible()
    await expect(page.getByRole("link", { name: /add new house/i })).toBeVisible()
    
    // Table content should be present
    await expect(page.getByText("Mobile Test House")).toBeVisible()
  })
})

// Helper function to fill house form
async function fillHouseForm(page: any, data: {
  address: string
  suburb: string 
  state: string
  postcode: string
  resident?: string
}) {
  await page.getByLabel(/address line 1/i).fill(data.address)
  await page.getByLabel(/suburb\/city/i).fill(data.suburb)
  await page.getByLabel(/state/i).selectOption(data.state)
  await page.getByLabel(/postcode/i).fill(data.postcode)
  await page.getByLabel(/go-live date/i).fill("2025-01-15")
  
  if (data.resident) {
    await page.getByLabel(/current resident/i).fill(data.resident)
  }
}