"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "components/ui/Dialog"
import type { Resident, ResidentStatus } from "types/resident"

interface StatusManagerProps {
  resident: Resident
  onStatusChange?: (updatedResident: Resident) => void
}

interface ApiResponse {
  success: boolean
  data?: Resident
  error?: string
  details?: Array<{ message: string }>
}

const statusTransitions = {
  'Draft': ['Active', 'Deactivated'],
  'Active': ['Deactivated'],
  'Deactivated': ['Active']
} as const

const statusColors = {
  'Draft': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Active': 'bg-green-100 text-green-800 border-green-200', 
  'Deactivated': 'bg-red-100 text-red-800 border-red-200'
}

const statusDescriptions = {
  'Draft': 'Initial resident entry, editing allowed',
  'Active': 'Resident is currently living in house',
  'Deactivated': 'Resident has moved out or been removed'
}

export function StatusManager({ resident, onStatusChange }: StatusManagerProps) {
  const [isChanging, setIsChanging] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<ResidentStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const validTransitions = statusTransitions[resident.status] || []
  
  const handleStatusChangeRequest = (newStatus: ResidentStatus) => {
    setPendingStatus(newStatus)
    setShowConfirmation(true)
    setError(null)
  }
  
  const confirmStatusChange = async () => {
    if (!pendingStatus) return
    
    setIsChanging(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/residents/${resident.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: pendingStatus 
        })
      })
      
      const result: ApiResponse = await response.json()
      
      if (result.success && result.data) {
        onStatusChange?.(result.data)
        setShowConfirmation(false)
        setPendingStatus(null)
      } else {
        setError(result.error || 'Failed to change status')
      }
    } catch (error) {
      setError('Network error. Please try again.')
      console.error('Error changing status:', error)
    } finally {
      setIsChanging(false)
    }
  }
  
  const cancelStatusChange = () => {
    setShowConfirmation(false)
    setPendingStatus(null)
    setError(null)
  }

  const getStatusIcon = (status: ResidentStatus) => {
    switch (status) {
      case 'Draft':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        )
      case 'Active':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'Deactivated':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }
  
  return (
    <>
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Management</h3>
        
        {/* Current Status */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-500 mb-2">Current Status</label>
          <div className={`inline-flex items-center px-3 py-2 rounded-lg border ${statusColors[resident.status]}`}>
            {getStatusIcon(resident.status)}
            <span className="ml-2 font-medium">{resident.status}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {statusDescriptions[resident.status]}
          </p>
        </div>
        
        {/* Status Transitions */}
        {validTransitions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Change Status To:
            </label>
            <div className="space-y-2">
              {validTransitions.map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusChangeRequest(status)}
                  disabled={isChanging}
                  className={`w-full flex items-center px-3 py-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {getStatusIcon(status)}
                  <span className="ml-2 text-gray-700">
                    Change to {status}
                  </span>
                  <svg className="w-4 h-4 ml-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {validTransitions.length === 0 && (
          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
            No status transitions available from {resident.status}
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800 text-sm">{error}</div>
          </div>
        )}
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onClose={cancelStatusChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              Are you sure you want to change {resident.firstName} {resident.lastName}'s status from{' '}
              <span className="font-medium text-gray-900">{resident.status}</span> to{' '}
              <span className="font-medium text-gray-900">{pendingStatus}</span>?
            </p>
            
            {pendingStatus && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="text-sm text-gray-600">
                  <strong>New Status:</strong> {statusDescriptions[pendingStatus]}
                </div>
              </div>
            )}
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="ml-3 text-sm text-yellow-800">
                  This action will be logged in the audit trail and cannot be undone.
                </div>
              </div>
            </div>
            
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-800 text-sm">{error}</div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={cancelStatusChange}
              disabled={isChanging}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmStatusChange}
              disabled={isChanging}
              className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                pendingStatus === 'Deactivated' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isChanging ? 'Changing...' : `Change to ${pendingStatus}`}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}