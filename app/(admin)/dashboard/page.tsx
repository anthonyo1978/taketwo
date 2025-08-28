import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Admin dashboard overview",
}

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Houses</p>
                <p className="text-2xl font-bold text-gray-900">1,234</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Active Listings</p>
                <p className="text-2xl font-bold text-gray-900">856</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">$45,678</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900">23</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="size-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">NH</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">New house added: 123 Main St</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="size-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-green-600">PD</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Payment processed: $2,500</p>
                  <p className="text-xs text-gray-500">4 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="size-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-orange-600">RG</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Report generated: Monthly Summary</p>
                  <p className="text-xs text-gray-500">6 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}