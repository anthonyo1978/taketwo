"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { calculateBalanceSummary } from "lib/utils/funding-calculations"
import type { House } from "types/house"
import type { Resident } from "types/resident"

interface ApiResponse {
  success: boolean
  data?: Resident[]
  error?: string
}

interface HousesApiResponse {
  success: boolean
  data?: House[]
  error?: string
}

interface GlobalResidentTableProps {
  refreshTrigger?: number // Used to trigger re-fetch when new resident added
}

export function GlobalResidentTable({ refreshTrigger }: GlobalResidentTableProps) {
  const [residents, setResidents] = useState<Resident[]>([])
  const [houses, setHouses] = useState<House[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch both residents and houses in parallel
      const [residentsResponse, housesResponse] = await Promise.all([
        fetch('/api/residents'),
        fetch('/api/houses')
      ])
      
      const [residentsResult, housesResult]: [ApiResponse, HousesApiResponse] = await Promise.all([
        residentsResponse.json(),
        housesResponse.json()
      ])
      
      if (residentsResult.success && residentsResult.data) {
        setResidents(residentsResult.data)
      } else {
        setError(residentsResult.error || 'Failed to load residents')
        return
      }

      if (housesResult.success && housesResult.data) {
        setHouses(housesResult.data)
      } else {
        setError(housesResult.error || 'Failed to load houses')
        return
      }
      
      setError(null)
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [refreshTrigger])

  const retryFetch = () => {
    setError(null)
    fetchData()
  }

  // Get house name for a resident
  const getHouseName = (houseId: string): string => {
    const house = houses.find(h => h.id === houseId)
    return house ? house.name : 'Unknown House'
  }

  // Loading state with skeleton table
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Residents</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Photo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  House
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NDIS ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[1, 2, 3].map(i => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-12" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-12" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Error state with retry
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-red-600 text-lg mb-4">{error}</div>
        <button 
          onClick={retryFetch}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Empty state
  if (residents.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No residents found</h3>
        <p className="text-gray-600">No residents have been created yet.</p>
      </div>
    )
  }

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: Date): number => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  // Get status color for badges
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800'
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'Deactivated':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Calculate contract balance summary
  const getContractSummary = (fundingInfo: Resident['fundingInformation']) => {
    if (!fundingInfo || fundingInfo.length === 0) {
      return { totalCurrent: 0, activeContracts: 0, expiringSoon: 0 }
    }
    return calculateBalanceSummary(fundingInfo)
  }

  // Success state - residents table
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          All Residents ({residents.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Photo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                House
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Funding
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Age
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gender
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                NDIS ID
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
            {residents.map((resident) => (
              <tr key={resident.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex-shrink-0 h-10 w-10">
                    {resident.photoBase64 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={resident.photoBase64}
                        alt={`${resident.firstName} ${resident.lastName}`}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 text-sm font-medium">
                          {resident.firstName.charAt(0)}{resident.lastName.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link 
                    href={`/residents/${resident.id}`}
                    className="block hover:bg-blue-50 rounded p-1 -m-1 transition-colors"
                  >
                    <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      {resident.firstName} {resident.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {resident.id}
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link 
                    href={`/houses/${resident.houseId}`}
                    className="block hover:bg-blue-50 rounded p-1 -m-1 transition-colors"
                  >
                    <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      {getHouseName(resident.houseId)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {resident.houseId}
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(resident.status || 'Draft')}`}>
                    {resident.status || 'Draft'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {resident.fundingInformation && resident.fundingInformation.length > 0 ? (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        ${getContractSummary(resident.fundingInformation).totalCurrent.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center space-x-2">
                        <span>
                          {getContractSummary(resident.fundingInformation).activeContracts} active
                        </span>
                        {getContractSummary(resident.fundingInformation).expiringSoon > 0 && (
                          <span className="px-1 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            {getContractSummary(resident.fundingInformation).expiringSoon} expiring
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">No contracts</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {calculateAge(resident.dateOfBirth)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {resident.gender}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {resident.phone || '-'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {resident.email || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {resident.ndisId || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(resident.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-3">
                    <Link 
                      href={`/residents/${resident.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View
                    </Link>
                    <Link 
                      href={`/residents/${resident.id}/edit`}
                      className="text-green-600 hover:text-green-800"
                    >
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}