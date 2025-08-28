import { NextRequest } from "next/server"
import { LoginCredentials, LoginResponse } from "lib/types/auth"

export async function POST(request: NextRequest) {
  try {
    // Simulate network delay for realistic testing
    await new Promise((resolve) => setTimeout(resolve, 800))

    const body = (await request.json()) as LoginCredentials

    // Basic validation
    if (!body.email || !body.password) {
      return Response.json({ success: false, error: "Email and password are required" } as LoginResponse, {
        status: 400,
      })
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return Response.json({ success: false, error: "Please enter a valid email address" } as LoginResponse, {
        status: 400,
      })
    }

    // Password length validation
    if (body.password.length < 8) {
      return Response.json({ success: false, error: "Password must be at least 8 characters" } as LoginResponse, {
        status: 400,
      })
    }

    // Mock authentication logic
    // Accept specific credentials for testing, reject others
    const validCredentials = [
      { email: "test@example.com", password: "password123" },
      { email: "admin@example.com", password: "adminpass123" },
      { email: "user@company.com", password: "userpass123" },
    ]

    const isValidCredential = validCredentials.some(
      (cred) => cred.email === body.email && cred.password === body.password
    )

    if (isValidCredential) {
      return Response.json({
        success: true,
        user: {
          id: "user_123",
          email: body.email,
          name: body.email.split("@")[0],
        },
      } as LoginResponse)
    } else {
      // Generic error message to avoid email enumeration
      return Response.json(
        { success: false, error: "Invalid credentials. Please check your email and password." } as LoginResponse,
        { status: 401 }
      )
    }
  } catch (error) {
    console.error("Login API error:", error)
    return Response.json(
      { success: false, error: "An unexpected error occurred. Please try again." } as LoginResponse,
      { status: 500 }
    )
  }
}
