"use client"

// Mock admin guard - replace with real authentication when implemented
// This is a placeholder that always allows access for development

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  // TODO: Replace with real authentication check
  // For now, always allow access in development
  const isAdmin = true // Mock: always true
  
  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this area.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Go Back
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}