import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reports",
  description: "View reports and analytics",
}

export default function ReportsPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Reports</h1>
        
        {/* Report Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 transition-colors cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="size-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sales Analytics</h3>
            <p className="text-gray-600 text-sm mb-4">Track property sales, revenue trends, and performance metrics.</p>
            <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
              View Report →
            </button>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 transition-colors cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="size-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h10a2 2 0 002-2v-3a2 2 0 00-2-2H9a2 2 0 00-2 2v3a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Financial Summary</h3>
            <p className="text-gray-600 text-sm mb-4">Monthly and quarterly financial performance overview.</p>
            <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
              View Report →
            </button>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 transition-colors cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="size-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Insights</h3>
            <p className="text-gray-600 text-sm mb-4">Customer behavior, preferences, and satisfaction metrics.</p>
            <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
              View Report →
            </button>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded">
                    <svg className="size-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Monthly Sales Report - December 2024</p>
                    <p className="text-sm text-gray-500">Generated 2 hours ago • 45 pages</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800">View</button>
                  <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">Download</button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded">
                    <svg className="size-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Q4 2024 Financial Summary</p>
                    <p className="text-sm text-gray-500">Generated yesterday • 28 pages</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800">View</button>
                  <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">Download</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}