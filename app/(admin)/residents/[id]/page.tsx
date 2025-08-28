"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AuditTrail } from "components/residents/AuditTrail"
import { ContractManagementTile } from "components/residents/ContractManagementTile"
import { ResidentBalanceWidget } from "components/residents/ResidentBalanceWidget"
import { StatusManager } from "components/residents/StatusManager"
import { type TabItem, Tabs } from "components/ui/Tabs"
import type { Resident } from "types/resident"

interface ApiResponse {
  success: boolean
  data?: Resident
  error?: string
}

interface ResidentDetailPageProps {
  params: Promise<{ id: string }>
}

export default function ResidentDetailPage({ params }: ResidentDetailPageProps) {
  const [resident, setResident] = useState<Resident | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [residentId, setResidentId] = useState<string>('')

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params
      setResidentId(id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (!residentId) return

    const fetchResident = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/residents/${residentId}`)
        const result: ApiResponse = await response.json()
        
        if (result.success && result.data) {
          setResident(result.data)
          setError(null)
        } else {
          setError(result.error || 'Failed to load resident')
        }
      } catch (err) {
        setError('Network error. Please check your connection and try again.')
        console.error('Error fetching resident:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchResident()
  }, [residentId])

  const retryFetch = () => {
    setError(null)
    if (residentId) {
      const fetchResident = async () => {
        try {
          setLoading(true)
          const response = await fetch(`/api/residents/${residentId}`)
          const result: ApiResponse = await response.json()
          
          if (result.success && result.data) {
            setResident(result.data)
          } else {
            setError(result.error || 'Failed to load resident')
          }
        } catch (err) {
          setError('Network error. Please check your connection and try again.')
          console.error('Error fetching resident:', err)
        } finally {
          setLoading(false)
        }
      }
      fetchResident()
    }
  }

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


  const handleStatusChange = (updatedResident: Resident) => {
    setResident(updatedResident)
  }

  const handleFundingChange = (updatedFunding: Resident['fundingInformation']) => {
    if (resident) {
      setResident({
        ...resident,
        fundingInformation: updatedFunding
      })
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb skeleton */}
          <div className="mb-6">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-64" />
          </div>
          
          {/* Header skeleton */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mb-2" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
            </div>
            <div className="h-10 bg-gray-200 rounded animate-pulse w-32" />
          </div>
          
          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg border p-6">
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-32 mb-4" />
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-6">
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-lg border p-6">
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-24 mb-4" />
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg border p-12 text-center">
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

  if (!resident) {
    return null
  }

  // Tab content components
  const renderOverviewTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
              <p className="text-gray-900">{new Date(resident.dateOfBirth).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Phone</label>
              <p className="text-gray-900">{resident.phone || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900">{resident.email || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">NDIS ID</label>
              <p className="text-gray-900">{resident.ndisId || '-'}</p>
            </div>
          </div>
          
          {/* House Association */}
          <div className="mt-6 pt-6 border-t">
            <label className="block text-sm font-medium text-gray-500 mb-2">Current House</label>
            <Link 
              href={`/houses/${resident.houseId}`}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {resident.houseId}
            </Link>
          </div>
        </div>
        
        {/* Emergency Contact */}
        {resident.emergencyContact && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Emergency Contact</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900">{resident.emergencyContact.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Relationship</label>
                <p className="text-gray-900">{resident.emergencyContact.relationship}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{resident.emergencyContact.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{resident.emergencyContact.email || '-'}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Notes */}
        {resident.detailedNotes && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{resident.detailedNotes}</p>
          </div>
        )}
        
        {/* Preferences */}
        {Object.keys(resident.preferences || {}).some(key => resident.preferences[key as keyof typeof resident.preferences]) && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Preferences</h2>
            <div className="space-y-4">
              {resident.preferences.dietary && resident.preferences.dietary.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Dietary</label>
                  <div className="flex flex-wrap gap-2">
                    {resident.preferences.dietary.map((item, index) => (
                      <span key={index} className="inline-flex px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {resident.preferences.medical && resident.preferences.medical.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Medical</label>
                  <div className="flex flex-wrap gap-2">
                    {resident.preferences.medical.map((item, index) => (
                      <span key={index} className="inline-flex px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {resident.preferences.accessibility && resident.preferences.accessibility.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Accessibility</label>
                  <div className="flex flex-wrap gap-2">
                    {resident.preferences.accessibility.map((item, index) => (
                      <span key={index} className="inline-flex px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {resident.preferences.other && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Other</label>
                  <p className="text-gray-700 text-sm">{resident.preferences.other}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Sidebar */}
      <div className="space-y-6">
        {/* Status Management */}
        <StatusManager 
          resident={resident}
          onStatusChange={handleStatusChange}
        />
        
        {/* Balance Widget */}
        <ResidentBalanceWidget 
          residentId={resident.id}
          onCreateTransaction={() => {
            // TODO: Open transaction creation dialog or navigate to transactions page
            window.open(`/transactions?residentId=${resident.id}`, '_blank')
          }}
        />
      </div>
    </div>
  )

  const renderFundingTab = () => (
    <div className="space-y-6">
      {/* Contract Management - Consolidated Tile */}
      <ContractManagementTile
        residentId={resident.id}
        fundingInfo={resident.fundingInformation}
        onFundingChange={handleFundingChange}
      />
    </div>
  )

  const renderTransactionsTab = () => (
    <div className="space-y-6">
      {/* Balance Overview */}
      <ResidentBalanceWidget 
        residentId={resident.id}
        onCreateTransaction={() => {
          window.open(`/transactions?residentId=${resident.id}`, '_blank')
        }}
      />
      
      {/* Link to Full Transactions */}
      <div className="text-center p-6 bg-gray-50 rounded-lg">
        <p className="text-gray-600 mb-4">
          View and manage all transactions for this resident
        </p>
        <a
          href={`/transactions?residentId=${resident.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Open Transactions Page
        </a>
      </div>
    </div>
  )

  const renderAuditTab = () => (
    <AuditTrail entries={resident.auditTrail} />
  )

  const tabItems: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: '👤',
      content: renderOverviewTab()
    },
    {
      id: 'funding',
      label: 'Funding & Contracts',
      icon: '💰',
      content: renderFundingTab()
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: '💳',
      content: renderTransactionsTab()
    },
    {
      id: 'audit',
      label: 'Activity History',
      icon: '📋',
      content: renderAuditTab()
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/residents" className="text-blue-600 hover:text-blue-800">
              Residents
            </Link>
            <span className="text-gray-400">→</span>
            <span className="text-gray-600">{resident.firstName} {resident.lastName}</span>
          </div>
        </nav>
        
        {/* Header */}
        <div className="bg-white rounded-lg border shadow-sm p-8 mb-8">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-6">
              {/* Photo */}
              <div className="flex-shrink-0">
                {resident.photoBase64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
                    src={resident.photoBase64}
                    alt={`${resident.firstName} ${resident.lastName}`}
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-4 border-white shadow-lg">
                    <span className="text-white text-3xl font-bold">
                      {resident.firstName.charAt(0)}{resident.lastName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Basic Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-3">
                  <h1 className="text-4xl font-bold text-gray-900">
                    {resident.firstName} {resident.lastName}
                  </h1>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(resident.status)}`}>
                    <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                    {resident.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                  <div>
                    <span className="text-gray-500 block">Resident ID</span>
                    <span className="font-medium text-gray-900">{resident.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Age</span>
                    <span className="font-medium text-gray-900">{calculateAge(resident.dateOfBirth)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Gender</span>
                    <span className="font-medium text-gray-900">{resident.gender}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">NDIS ID</span>
                    <span className="font-medium text-gray-900">{resident.ndisId || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Link
                href={`/residents/${resident.id}/edit`}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>✏️</span>
                <span>Edit Profile</span>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border shadow-sm">
          <Tabs items={tabItems} defaultTab="overview" />
        </div>
      </div>
    </div>
  )
}