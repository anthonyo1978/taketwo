"use client"

import { format } from "date-fns"
import { 
  calculateBalanceSummary, 
  getContractCompletionPercentage, 
  getDrawdownRateDescription,
  isContractExpiringSoon 
} from "lib/utils/funding-calculations"
import type { FundingInformation } from "types/resident"

interface FundingBalanceDisplayProps {
  contracts: FundingInformation[]
  showDetailedView?: boolean
}

interface ContractBalanceCardProps {
  contract: FundingInformation
  showProgressBar?: boolean
  showTimelineIndicator?: boolean
}

function ContractBalanceCard({ contract, showProgressBar = true, showTimelineIndicator = true }: ContractBalanceCardProps) {
  const completionPercentage = getContractCompletionPercentage(contract)
  const isExpiring = isContractExpiringSoon(contract)
  const drawnDown = contract.originalAmount - contract.currentBalance
  const drawnDownPercentage = contract.originalAmount > 0 ? (drawnDown / contract.originalAmount) * 100 : 0

  const getStatusColor = (status: string) => {
    const colors = {
      'Draft': 'border-gray-300 bg-gray-50',
      'Active': 'border-green-300 bg-green-50',
      'Expired': 'border-red-300 bg-red-50',
      'Cancelled': 'border-orange-300 bg-orange-50',
      'Renewed': 'border-blue-300 bg-blue-50'
    }
    return colors[status as keyof typeof colors] || 'border-gray-300 bg-gray-50'
  }

  const formatDateRange = (startDate: Date, endDate?: Date) => {
    const start = format(new Date(startDate), 'MMM d, yyyy')
    if (endDate) {
      const end = format(new Date(endDate), 'MMM d, yyyy')
      return `${start} - ${end}`
    }
    return `${start} - Ongoing`
  }

  return (
    <div className={`p-4 rounded-lg border-2 ${getStatusColor(contract.contractStatus)}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${{
            'NDIS': 'bg-blue-100 text-blue-800',
            'Government': 'bg-green-100 text-green-800',
            'Private': 'bg-purple-100 text-purple-800',
            'Family': 'bg-orange-100 text-orange-800',
            'Other': 'bg-gray-100 text-gray-800'
          }[contract.type]}`}>
            {contract.type}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${{
            'Draft': 'bg-gray-100 text-gray-800',
            'Active': 'bg-green-100 text-green-800',
            'Expired': 'bg-red-100 text-red-800',
            'Cancelled': 'bg-orange-100 text-orange-800',
            'Renewed': 'bg-blue-100 text-blue-800'
          }[contract.contractStatus]}`}>
            {contract.contractStatus}
          </span>
          {isExpiring && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
              ⚠️ Expiring Soon
            </span>
          )}
        </div>
      </div>

      {/* Balance Information */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            ${contract.originalAmount.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Original</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            ${contract.currentBalance.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Current</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            ${drawnDown.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Drawn Down</div>
        </div>
      </div>

      {/* Progress Bar */}
      {showProgressBar && contract.contractStatus === 'Active' && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Drawdown Progress</span>
            <span>{drawnDownPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-orange-500 h-3 rounded-full transition-all duration-500" 
              style={{ width: `${drawnDownPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Timeline Indicator */}
      {showTimelineIndicator && contract.endDate && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Timeline Progress</span>
            <span>{completionPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                completionPercentage >= 100 ? 'bg-red-500' : 
                completionPercentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, completionPercentage)}%` }}
            />
          </div>
        </div>
      )}

      {/* Contract Details */}
      <div className="text-xs text-gray-600 space-y-1">
        <div>
          <span className="font-medium">Period:</span> {formatDateRange(contract.startDate, contract.endDate)}
        </div>
        {contract.drawdownRate && (
          <div>
            <span className="font-medium">Drawdown:</span> {getDrawdownRateDescription(contract.drawdownRate)}
          </div>
        )}
        {contract.description && (
          <div>
            <span className="font-medium">Notes:</span> {contract.description}
          </div>
        )}
        {contract.parentContractId && (
          <div className="text-blue-600">
            <span className="font-medium">Renewed from:</span> Contract {contract.parentContractId}
          </div>
        )}
      </div>
    </div>
  )
}

export function FundingBalanceDisplay({ contracts, showDetailedView = true }: FundingBalanceDisplayProps) {
  const balanceSummary = calculateBalanceSummary(contracts)
  const activeContract = contracts.find(c => c.contractStatus === 'Active') // Only one active contract
  const expiredContracts = contracts.filter(c => c.contractStatus === 'Expired')
  
  // Calculate elapsed time percentage for active contract
  const getElapsedTimePercentage = (contract: FundingInformation): number => {
    if (!contract.endDate) return 0
    const now = new Date()
    const startDate = new Date(contract.startDate)
    const endDate = new Date(contract.endDate)
    const totalDuration = endDate.getTime() - startDate.getTime()
    const elapsed = now.getTime() - startDate.getTime()
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
  }
  
  // Calculate days remaining
  const getDaysRemaining = (contract: FundingInformation): number => {
    if (!contract.endDate) return 0
    const now = new Date()
    const endDate = new Date(contract.endDate)
    return Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  }

  if (contracts.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Funding Contracts</h3>
          <p className="text-gray-500 mb-4">Get started by adding funding contracts to track financial support.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Funding Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-800">
              ${balanceSummary.totalOriginal.toLocaleString()}
            </div>
            <div className="text-sm text-green-600">Total Allocated</div>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-800">
              ${balanceSummary.totalCurrent.toLocaleString()}
            </div>
            <div className="text-sm text-blue-600">Remaining Balance</div>
          </div>
          
          <div className="p-4 bg-orange-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-800">
              ${balanceSummary.totalDrawnDown.toLocaleString()}
            </div>
            <div className="text-sm text-orange-600">Drawn Down</div>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-800">
              {activeContract ? getDaysRemaining(activeContract) : 0}
            </div>
            <div className="text-sm text-purple-600">Contract Days Remaining</div>
          </div>
        </div>

        {/* Overall Progress Bars */}
        {balanceSummary.totalOriginal > 0 && activeContract && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Overall Drawdown Progress</span>
                <span>{((balanceSummary.totalDrawnDown / balanceSummary.totalOriginal) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-orange-600 h-4 rounded-full transition-all duration-500" 
                  style={{ width: `${(balanceSummary.totalDrawnDown / balanceSummary.totalOriginal) * 100}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Elapsed Time Progress</span>
                <span>{getElapsedTimePercentage(activeContract).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-yellow-500 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${getElapsedTimePercentage(activeContract)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Contract Display - Only One */}
      {showDetailedView && activeContract && (
        <div className="bg-white rounded-lg border p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Active Contract
          </h4>
          <ContractBalanceCard 
            contract={activeContract}
            showProgressBar={true}
            showTimelineIndicator={true}
          />
        </div>
      )}
      
      {/* Completed Contracts - Collapsed View */}
      {showDetailedView && expiredContracts.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Completed Contracts ({expiredContracts.length})
          </h4>
          <div className="space-y-2">
            {expiredContracts.map(contract => (
              <div key={contract.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                <div>
                  <span className="font-medium">{contract.type}</span>
                  <span className="text-gray-500 ml-2">
                    {formatDateRange(contract.startDate, contract.endDate)}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  ${contract.originalAmount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}