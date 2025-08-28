"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ResidentAvatars } from "components/residents/ResidentAvatars"
import type { House } from "types/house"

interface ApiResponse {
  success: boolean
  data?: House[]
  error?: string
}

export default function HousesPage() {
  const [houses, setHouses] = useState<House[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHouses = async () => {
      try {
        const response = await fetch('/api/houses')
        const result: ApiResponse = await response.json()
        
        if (result.success && result.data) {
          setHouses(result.data)
        } else {
          setError(result.error || 'Failed to load houses')
        }
      } catch (err) {
        setError('Network error. Please check your connection and try again.')
        console.error('Error fetching houses:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHouses()
  }, [])

  const retryFetch = () => {
    setError(null)
    setLoading(true)
    
    const fetchHouses = async () => {
      try {
        const response = await fetch('/api/houses')
        const result: ApiResponse = await response.json()
        
        if (result.success && result.data) {
          setHouses(result.data)
        } else {
          setError(result.error || 'Failed to load houses')
        }
      } catch (err) {
        setError('Network error. Please check your connection and try again.')
        console.error('Error fetching houses:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHouses()
  }

  // Loading state with skeleton table
  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Houses</h1>
            <Link
              href="/houses/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New House
            </Link>
          </div>
          
          {/* Skeleton Loading Table */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Property Listings</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      House ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resident(s)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[1, 2, 3].map(i => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-1">
                          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-12" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state with retry
  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Houses</h1>
            <Link
              href="/houses/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New House
            </Link>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="text-red-600 text-lg mb-4">{error}</div>
            <button 
              onClick={retryFetch}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (houses.length === 0) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Houses</h1>
            <Link
              href="/houses/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New House
            </Link>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No houses found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first house.</p>
            <Link 
              href="/houses/new"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create First House
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Success state - dynamic table
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Houses</h1>
          <Link
            href="/houses/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New House
          </Link>
        </div>
        
        {/* Dynamic Houses Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Property Listings ({houses.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    House ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resident(s)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {houses.map((house) => (
                  <tr key={house.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        href={`/houses/${house.id}`}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        {house.id}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {house.address1}{house.unit && `, ${house.unit}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {house.suburb}, {house.state} {house.postcode}, {house.country}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        house.status === 'Active' 
                          ? 'bg-green-100 text-green-800'
                          : house.status === 'Vacant'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {house.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ResidentAvatars houseId={house.id} maxDisplay={4} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(house.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link 
                        href={`/houses/${house.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}