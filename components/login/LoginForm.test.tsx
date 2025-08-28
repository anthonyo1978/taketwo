import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LoginForm } from "./LoginForm"

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch as jest.MockedFunction<typeof fetch>

// Mock window.location
const mockLocationHref = jest.fn()
Object.defineProperty(window, "location", {
  value: {
    href: "",
    get href() {
      return this._href
    },
    set href(value) {
      mockLocationHref(value)
      this._href = value
    },
  },
  writable: true,
})

describe("LoginForm", () => {
  beforeEach(() => {
    mockFetch.mockClear()
    mockLocationHref.mockClear()
  })

  it("renders login form with email and password fields", () => {
    render(<LoginForm />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument()
  })

  it("displays validation errors for empty fields", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const submitButton = screen.getByRole("button", { name: /sign in/i })
    await user.click(submitButton)

    expect(await screen.findByText("Please enter a valid email address")).toBeInTheDocument()
    expect(await screen.findByText("Password must be at least 8 characters")).toBeInTheDocument()
  })

  it("displays validation error for invalid email format", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole("button", { name: /sign in/i })

    await user.type(emailInput, "invalid-email")
    await user.click(submitButton)

    expect(await screen.findByText("Please enter a valid email address")).toBeInTheDocument()
  })

  it("displays validation error for short password", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole("button", { name: /sign in/i })

    await user.type(emailInput, "test@example.com")
    await user.type(passwordInput, "short")
    await user.click(submitButton)

    expect(await screen.findByText("Password must be at least 8 characters")).toBeInTheDocument()
  })

  it("submits form with valid credentials and calls onSuccess", async () => {
    const mockOnSuccess = jest.fn()
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          user: { id: "123", email: "test@example.com", name: "test" },
        }),
    })

    render(<LoginForm onSuccess={mockOnSuccess} />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole("button", { name: /sign in/i })

    await user.type(emailInput, "test@example.com")
    await user.type(passwordInput, "password123")
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      })
    })

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it("redirects to home page on successful login without onSuccess callback", async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          user: { id: "123", email: "test@example.com", name: "test" },
        }),
    })

    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole("button", { name: /sign in/i })

    await user.type(emailInput, "test@example.com")
    await user.type(passwordInput, "password123")
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockLocationHref).toHaveBeenCalledWith("/")
    })
  })

  it("displays error message for invalid credentials", async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () =>
        Promise.resolve({
          success: false,
          error: "Invalid credentials. Please check your email and password.",
        }),
    })

    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole("button", { name: /sign in/i })

    await user.type(emailInput, "wrong@example.com")
    await user.type(passwordInput, "wrongpassword")
    await user.click(submitButton)

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid credentials. Please check your email and password."
    )
  })

  it("displays network error message when fetch fails", async () => {
    const user = userEvent.setup()

    mockFetch.mockRejectedValueOnce(new Error("Network error"))

    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole("button", { name: /sign in/i })

    await user.type(emailInput, "test@example.com")
    await user.type(passwordInput, "password123")
    await user.click(submitButton)

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Network error. Please check your connection and try again."
    )
  })

  it("shows loading state during submission", async () => {
    const user = userEvent.setup()

    // Mock a delayed response
    mockFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({ success: true }),
              }),
            100
          )
        )
    )

    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole("button", { name: /sign in/i })

    await user.type(emailInput, "test@example.com")
    await user.type(passwordInput, "password123")
    await user.click(submitButton)

    // Check loading state
    expect(screen.getByRole("button")).toHaveTextContent("Signing in...")
    expect(screen.getByRole("button")).toBeDisabled()
    expect(screen.getByText("Please wait while we sign you in")).toBeInTheDocument()
  })

  it("clears previous error when submitting again", async () => {
    const user = userEvent.setup()

    // First submission fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () =>
        Promise.resolve({
          success: false,
          error: "Invalid credentials",
        }),
    })

    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole("button", { name: /sign in/i })

    await user.type(emailInput, "test@example.com")
    await user.type(passwordInput, "password123")
    await user.click(submitButton)

    // Error should appear
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid credentials")

    // Second submission succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })

    await user.click(submitButton)

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    })
  })
})
