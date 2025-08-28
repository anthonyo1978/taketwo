"use client"

import { format } from "date-fns"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "components/ui/Dialog"
import { getContractCompletionPercentage, getValidStatusTransitions, isContractExpiringSoon } from "lib/utils/funding-calculations"
import type { ContractStatus, FundingInformation } from "types/resident"

interface ContractStatusManagerProps {
  contract: FundingInformation
  residentId: string
  onStatusChange?: (updatedContract: FundingInformation) => void
}

interface ApiResponse {
  success: boolean
  data?: FundingInformation
  error?: string
  details?: Array<{ message: string }>
}

const statusColors = {
  'Draft': 'bg-gray-100 text-gray-800',
  'Active': 'bg-green-100 text-green-800',
  'Expired': 'bg-red-100 text-red-800',
  'Cancelled': 'bg-orange-100 text-orange-800',
  'Renewed': 'bg-blue-100 text-blue-800'
}

const statusDescriptions = {
  'Draft': 'Initial contract state, not yet active',
  'Active': 'Contract is active and funds are being drawn down',
  'Expired': 'Contract has reached its end date',
  'Cancelled': 'Contract was cancelled before completion',
  'Renewed': 'Contract was renewed with a new contract'
}

const actionLabels = {
  'Active': 'Activate Contract',
  'Expired': 'Mark as Expired',
  'Cancelled': 'Cancel Contract',
  'Renewed': 'Renew Contract'
}

export function ContractStatusManager({ contract, residentId, onStatusChange }: ContractStatusManagerProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<ContractStatus | null>(null)
  const [isChanging, setIsChanging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const validTransitions = getValidStatusTransitions(contract.contractStatus)
  const completionPercentage = getContractCompletionPercentage(contract)
  const isExpiringSoon = isContractExpiringSoon(contract)
  
  const openConfirmDialog = (newStatus: ContractStatus) => {
    setSelectedStatus(newStatus)
    setShowConfirmDialog(true)
    setError(null)
  }

  const closeConfirmDialog = () => {
    setShowConfirmDialog(false)
    setSelectedStatus(null)
    setError(null)
  }

  const handleStatusChange = async () => {
    if (!selectedStatus) return

    setIsChanging(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/residents/${residentId}/funding/contract`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fundingId: contract.id,
          status: selectedStatus
        })
      })
      
      const result: ApiResponse = await response.json()
      
      if (result.success && result.data) {
        onStatusChange?.(result.data)
        closeConfirmDialog()
      } else {
        setError(result.error || 'Failed to update contract status')
      }
    } catch (error) {
      setError('Network error. Please try again.')
      console.error('Error updating contract status:', error)
    } finally {
      setIsChanging(false)
    }
  }

  const formatDateRange = (startDate: Date, endDate?: Date) => {
    const start = format(new Date(startDate), 'MMM d, yyyy')
    if (endDate) {
      const end = format(new Date(endDate), 'MMM d, yyyy')
      return `${start} - ${end}`
    }
    return `${start} - Ongoing`
  }

  const getStatusIcon = (status: ContractStatus) => {
    const icons = {
      'Draft': '📝',
      'Active': '✅',
      'Expired': '⏰',
      'Cancelled': '❌',
      'Renewed': '🔄'
    }
    return icons[status] || '❓'
  }

  return (
    <>
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Contract Status</h3>
          {isExpiringSoon && (
            <div className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
              Expiring Soon
            </div>
          )}
        </div>
        
        {/* Current Status Display */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${statusColors[contract.contractStatus]}`}>
              <span>{getStatusIcon(contract.contractStatus)}</span>
              <span>{contract.contractStatus}</span>
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">
            {statusDescriptions[contract.contractStatus]}
          </p>
          
          <div className="text-sm text-gray-700 space-y-1">
            <div>
              <span className="font-medium">Contract Period:</span> {formatDateRange(contract.startDate, contract.endDate)}
            </div>
            <div>
              <span className="font-medium">Original Amount:</span> ${contract.originalAmount.toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Current Balance:</span> ${contract.currentBalance.toLocaleString()}
            </div>
            {contract.contractStatus === 'Active' && contract.endDate && (
              <div>
                <span className="font-medium">Completion:</span> {completionPercentage.toFixed(1)}%
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Status Transition Actions */}
        {validTransitions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Available Actions:</h4>
            <div className="grid grid-cols-1 gap-2">
              {validTransitions.map(status => (
                <button
                  key={status}
                  onClick={() => openConfirmDialog(status)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getStatusIcon(status)}</span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {actionLabels[status] || `Change to ${status}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {statusDescriptions[status]}
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-400 group-hover:text-gray-600">
                      →
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {validTransitions.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <div className="text-sm">No status changes available for {contract.contractStatus} contracts.</div>
          </div>
        )}
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={closeConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
          </DialogHeader>
          
          {selectedStatus && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">{getStatusIcon(selectedStatus)}</span>
                  <div>
                    <div className="font-medium text-blue-900">
                      {actionLabels[selectedStatus] || `Change to ${selectedStatus}`}
                    </div>
                    <div className="text-sm text-blue-700">
                      {statusDescriptions[selectedStatus]}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>
                  Change contract status from <span className="font-medium">{contract.contractStatus}</span> to <span className="font-medium">{selectedStatus}</span>?
                </p>
                
                {selectedStatus === 'Active' && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium">Activating Contract:</p>
                    <ul className="text-green-700 text-sm mt-1 space-y-1">
                      <li>• Balance tracking will begin</li>
                      <li>• Automatic drawdown will start (if enabled)</li>
                      <li>• Contract timeline will be enforced</li>
                    </ul>
                  </div>
                )}
                
                {selectedStatus === 'Cancelled' && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 font-medium">Cancelling Contract:</p>
                    <p className="text-red-700 text-sm mt-1">
                      This action cannot be undone. The contract will be permanently cancelled.
                    </p>
                  </div>
                )}
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-800 text-sm">{error}</div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeConfirmDialog}
                  disabled={isChanging}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusChange}
                  disabled={isChanging}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isChanging && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>
                    {isChanging 
                      ? 'Changing...'
                      : actionLabels[selectedStatus] || `Change to ${selectedStatus}`
                    }
                  </span>
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}