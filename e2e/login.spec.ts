import { test, expect } from "@playwright/test"

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
  })

  test("renders login page correctly", async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Sign in/)

    // Check main heading
    await expect(page.locator("h1")).toContainText("Sign in to your account")

    // Check form elements are present
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible()
  })

  test("displays validation errors for empty fields", async ({ page }) => {
    // Click submit without filling fields
    await page.click('button[type="submit"]')

    // Check validation messages appear
    await expect(page.getByText("Please enter a valid email address")).toBeVisible()
    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible()
  })

  test("displays validation error for invalid email", async ({ page }) => {
    await page.fill('input[name="email"]', "invalid-email")
    await page.fill('input[name="password"]', "validpassword123")
    await page.click('button[type="submit"]')

    await expect(page.getByText("Please enter a valid email address")).toBeVisible()
  })

  test("displays validation error for short password", async ({ page }) => {
    await page.fill('input[name="email"]', "test@example.com")
    await page.fill('input[name="password"]', "short")
    await page.click('button[type="submit"]')

    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible()
  })

  test("successful login with valid credentials", async ({ page }) => {
    // Fill form with valid credentials
    await page.fill('input[name="email"]', "test@example.com")
    await page.fill('input[name="password"]', "password123")

    // Submit form
    await page.click('button[type="submit"]')

    // Check loading state
    await expect(page.getByText("Signing in...")).toBeVisible()

    // Wait for redirect to home page
    await page.waitForURL("/", { timeout: 10000 })
    expect(page.url()).toContain("/")
  })

  test("displays error for invalid credentials", async ({ page }) => {
    // Fill form with invalid credentials
    await page.fill('input[name="email"]', "wrong@example.com")
    await page.fill('input[name="password"]', "wrongpassword")

    // Submit form
    await page.click('button[type="submit"]')

    // Check error message appears - use specific selector to avoid Next.js route announcer
    await expect(page.locator('[role="alert"]:has-text("Invalid credentials")')).toContainText("Invalid credentials")
  })

  test("keyboard navigation works correctly", async ({ page }) => {
    // Start from email field
    await page.keyboard.press("Tab")
    await expect(page.locator('input[name="email"]')).toBeFocused()

    // Move to password field
    await page.keyboard.press("Tab")
    await expect(page.locator('input[name="password"]')).toBeFocused()

    // Move to submit button
    await page.keyboard.press("Tab")
    await expect(page.locator('button[type="submit"]')).toBeFocused()

    // Can submit with Enter
    await page.fill('input[name="email"]', "test@example.com")
    await page.fill('input[name="password"]', "password123")
    await page.locator('button[type="submit"]').focus()
    await page.keyboard.press("Enter")

    // Should redirect
    await page.waitForURL("/", { timeout: 10000 })
  })

  test("form prevents double submission", async ({ page }) => {
    await page.fill('input[name="email"]', "test@example.com")
    await page.fill('input[name="password"]', "password123")

    // Click submit button
    await page.click('button[type="submit"]')

    // Check button is disabled during submission
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
    await expect(page.getByText("Signing in...")).toBeVisible()
  })

  test("shows loading description for screen readers", async ({ page }) => {
    await page.fill('input[name="email"]', "test@example.com")
    await page.fill('input[name="password"]', "password123")

    await page.click('button[type="submit"]')

    // Check screen reader text appears
    await expect(page.getByText("Please wait while we sign you in")).toBeVisible()
  })

  test("error alert is announced to screen readers", async ({ page }) => {
    await page.fill('input[name="email"]', "wrong@example.com")
    await page.fill('input[name="password"]', "wrongpassword")
    await page.click('button[type="submit"]')

    // Check error has proper ARIA role - use specific selector to avoid Next.js route announcer
    const errorAlert = page.locator('[role="alert"]:has-text("Invalid credentials")')
    await expect(errorAlert).toBeVisible()
    await expect(errorAlert).toHaveAttribute("aria-live", "polite")
  })

  test("mobile responsiveness", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Check page still renders correctly on mobile
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible()

    // Form should be responsive on mobile - reduced threshold for mobile
    const form = page.locator("form")
    const formBox = await form.boundingBox()
    expect(formBox?.width).toBeGreaterThan(280) // Should take most of mobile screen width
  })
})
