import { test, expect } from "@playwright/test"

test.describe("Admin Sidebar Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard page
    await page.goto("/dashboard")
  })

  test("displays sidebar with all navigation items", async ({ page }) => {
    // Check sidebar is visible
    const sidebar = page.locator("aside")
    await expect(sidebar).toBeVisible()

    // Check all navigation items are present
    await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /houses/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /billing/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /reports/i })).toBeVisible()
    await expect(page.getByRole("link", { name: /settings/i })).toBeVisible()
  })

  test("shows admin panel logo that links to dashboard", async ({ page }) => {
    const logoLink = page.getByRole("link", { name: /admin panel/i })
    await expect(logoLink).toBeVisible()
    await expect(logoLink).toHaveAttribute("href", "/dashboard")
  })

  test("navigates to different pages and shows active states", async ({ page }) => {
    // Dashboard should be active initially
    const dashboardLink = page.getByRole("link", { name: /dashboard/i })
    await expect(dashboardLink).toHaveAttribute("aria-current", "page")

    // Navigate to Houses
    await page.getByRole("link", { name: /houses/i }).click()
    await page.waitForURL("/houses")
    
    // Houses should now be active
    const housesLink = page.getByRole("link", { name: /houses/i })
    await expect(housesLink).toHaveAttribute("aria-current", "page")
    
    // Dashboard should no longer be active
    await expect(dashboardLink).not.toHaveAttribute("aria-current", "page")

    // Check page content loaded
    await expect(page.getByRole("heading", { name: /houses/i })).toBeVisible()
  })

  test("navigates through all admin pages", async ({ page }) => {
    const pages = [
      { name: /houses/i, url: "/houses", heading: /houses/i },
      { name: /billing/i, url: "/billing", heading: /billing/i },
      { name: /reports/i, url: "/reports", heading: /reports/i },
      { name: /settings/i, url: "/settings", heading: /settings/i },
      { name: /dashboard/i, url: "/dashboard", heading: /dashboard/i },
    ]

    for (const pageInfo of pages) {
      await page.getByRole("link", { name: pageInfo.name }).click()
      await page.waitForURL(pageInfo.url)
      
      // Check active state
      const activeLink = page.getByRole("link", { name: pageInfo.name })
      await expect(activeLink).toHaveAttribute("aria-current", "page")
      
      // Check page content loaded
      await expect(page.getByRole("heading", { name: pageInfo.heading })).toBeVisible()
    }
  })

  test("collapses and expands sidebar with button", async ({ page }) => {
    // Initial state should be expanded (show labels)
    await expect(page.getByText("Admin Panel")).toBeVisible()
    
    // Find and click collapse button
    const collapseButton = page.getByRole("button", { name: /collapse sidebar/i })
    await expect(collapseButton).toBeVisible()
    await collapseButton.click()

    // Should be collapsed (no labels visible)
    await expect(page.getByText("Admin Panel")).not.toBeVisible()
    
    // Button should now say "expand"
    const expandButton = page.getByRole("button", { name: /expand sidebar/i })
    await expect(expandButton).toBeVisible()

    // Click to expand again
    await expandButton.click()
    
    // Should be expanded again
    await expect(page.getByText("Admin Panel")).toBeVisible()
    await expect(page.getByRole("button", { name: /collapse sidebar/i })).toBeVisible()
  })

  test("persists collapsed state across page reloads", async ({ page }) => {
    // Collapse the sidebar
    const collapseButton = page.getByRole("button", { name: /collapse sidebar/i })
    await collapseButton.click()
    
    // Verify collapsed
    await expect(page.getByText("Admin Panel")).not.toBeVisible()

    // Reload the page
    await page.reload()
    
    // Should still be collapsed
    await expect(page.getByText("Admin Panel")).not.toBeVisible()
    await expect(page.getByRole("button", { name: /expand sidebar/i })).toBeVisible()
  })

  test("persists collapsed state across different admin pages", async ({ page }) => {
    // Collapse the sidebar
    const collapseButton = page.getByRole("button", { name: /collapse sidebar/i })
    await collapseButton.click()
    
    // Navigate to different pages
    await page.getByRole("link", { name: /houses/i }).click()
    await page.waitForURL("/houses")
    
    // Should still be collapsed
    await expect(page.getByText("Admin Panel")).not.toBeVisible()
    
    // Navigate to another page
    await page.getByRole("link", { name: /billing/i }).click()
    await page.waitForURL("/billing")
    
    // Should still be collapsed
    await expect(page.getByText("Admin Panel")).not.toBeVisible()
  })

  test("has keyboard navigation support", async ({ page }) => {
    // Focus first navigation item
    await page.keyboard.press("Tab")
    
    // Should be able to navigate through items with Tab
    const dashboardLink = page.getByRole("link", { name: /dashboard/i })
    await expect(dashboardLink).toBeFocused()
    
    // Navigate to next item
    await page.keyboard.press("Tab")
    const housesLink = page.getByRole("link", { name: /houses/i })
    await expect(housesLink).toBeFocused()
    
    // Should be able to activate with Enter
    await page.keyboard.press("Enter")
    await page.waitForURL("/houses")
    
    // Check we navigated correctly
    await expect(page.getByRole("heading", { name: /houses/i })).toBeVisible()
  })

  test("shows tooltips in collapsed mode", async ({ page }) => {
    // Collapse the sidebar
    const collapseButton = page.getByRole("button", { name: /collapse sidebar/i })
    await collapseButton.click()
    
    // Hover over a navigation item
    const housesLink = page.getByRole("link", { name: /houses/i })
    await housesLink.hover()
    
    // Tooltip should appear (we'll check for the tooltip content)
    // Note: This might need adjustment based on how Radix UI tooltips are implemented
    await expect(page.getByText("Houses")).toBeVisible()
  })

  test("shows user menu section", async ({ page }) => {
    await expect(page.getByText("Admin User")).toBeVisible()
    await expect(page.getByText("admin@example.com")).toBeVisible()
  })

  test("sidebar has proper ARIA labels", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: /primary navigation/i })
    await expect(nav).toBeVisible()
    
    // Collapse button should have proper ARIA label
    const collapseButton = page.getByRole("button", { name: /collapse sidebar/i })
    await expect(collapseButton).toBeVisible()
  })

  test("maintains focus management when collapsing/expanding", async ({ page }) => {
    // Focus the collapse button
    const collapseButton = page.getByRole("button", { name: /collapse sidebar/i })
    await collapseButton.focus()
    await expect(collapseButton).toBeFocused()
    
    // Click to collapse
    await collapseButton.click()
    
    // The expand button should now be focused
    const expandButton = page.getByRole("button", { name: /expand sidebar/i })
    await expect(expandButton).toBeFocused()
  })
})