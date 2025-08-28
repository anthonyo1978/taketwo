import { Toaster } from "react-hot-toast"

import { AdminSidebar } from "components/admin/AdminSidebar"
import { AdminGuard } from "components/auth/AdminGuard"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminGuard>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <AdminSidebar />
        
        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            {children}
          </div>
        </main>
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#363636',
            },
            success: {
              duration: 4000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 6000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </AdminGuard>
  )
}