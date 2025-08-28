import { Metadata } from "next"
import { LoginForm } from "components/login/LoginForm"

export const metadata: Metadata = {
  title: "Sign in - Next.js Enterprise",
  description: "Sign in to your account to access the application",
  robots: "noindex, nofollow", // Prevent indexing of login page
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">Sign in to your account</h1>
          <p className="mt-2 text-sm text-gray-600">Enter your credentials to access the application</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-6 py-8 shadow-lg">
          <LoginForm />
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">For demonstration purposes, use:</p>
          <p className="mt-1 font-mono text-xs text-gray-600">test@example.com / password123</p>
        </div>
      </div>
    </div>
  )
}
