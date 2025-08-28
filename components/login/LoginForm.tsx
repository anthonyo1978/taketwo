"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "components/Button/Button"
import { Input } from "components/ui/Input"
import { LoginCredentials, LoginResponse } from "lib/types/auth"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export interface LoginFormProps {
  onSuccess?: () => void
  className?: string
}

export function LoginForm({ onSuccess, className }: LoginFormProps) {
  const [loginError, setLoginError] = useState<string>("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginCredentials) => {
    setLoginError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = (await response.json()) as LoginResponse

      if (response.ok && result.success) {
        // Call success callback or redirect
        if (onSuccess) {
          onSuccess()
        } else {
          // Default redirect to home page
          window.location.href = "/"
        }
      } else {
        setLoginError(result.error || "Login failed. Please try again.")
      }
    } catch (error) {
      console.error("Login error:", error)
      setLoginError("Network error. Please check your connection and try again.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-6 ${className || ""}`} noValidate>
      <div className="space-y-4">
        <Input
          {...register("email")}
          id="email"
          type="email"
          label="Email"
          placeholder="Enter your email"
          error={errors.email?.message}
          autoComplete="username"
          required
          aria-describedby={errors.email ? "email-error" : undefined}
        />

        <Input
          {...register("password")}
          id="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
          error={errors.password?.message}
          autoComplete="current-password"
          required
          aria-describedby={errors.password ? "password-error" : undefined}
        />
      </div>

      {loginError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
          aria-live="polite"
        >
          {loginError}
        </div>
      )}

      <Button
        type="submit"
        intent="primary"
        size="lg"
        disabled={isSubmitting}
        className="w-full"
        aria-describedby={isSubmitting ? "loading-description" : undefined}
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>

      {isSubmitting && (
        <div id="loading-description" className="sr-only" aria-live="polite">
          Please wait while we sign you in
        </div>
      )}
    </form>
  )
}
