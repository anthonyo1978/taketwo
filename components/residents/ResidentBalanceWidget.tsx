"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Button } from "components/Button/Button"
import type { ResidentBalanceSummary, RecentTransactionsSummary, Transaction } from "types/transaction"
import { getResidentBalanceSummary, getRecentTransactionsSummary } from "lib/utils/transaction-storage"

interface ResidentBalanceWidgetProps {
  residentId: string
  onCreateTransaction?: () => void
}

export function ResidentBalanceWidget({ residentId, onCreateTransaction }: ResidentBalanceWidgetProps) {
  const [balanceSummary, setBalanceSummary] = useState<ResidentBalanceSummary | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<RecentTransactionsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = () => {
      try {
        const balance = getResidentBalanceSummary(residentId)
        const recent = getRecentTransactionsSummary(residentId, 5)
        
        setBalanceSummary(balance)
        setRecentTransactions(recent)
      } catch (error) {
        console.error('Error loading resident financial data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [residentId])

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'posted':
        return 'bg-green-100 text-green-800'
      case 'voided':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!balanceSummary) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Balance Summary */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Contract Balances</h3>
          {onCreateTransaction && (
            <Button
              onClick={onCreateTransaction}
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              + New Transaction
            </Button>
          )}
        </div>

        {balanceSummary.activeContracts.length > 0 ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-800">
                  ${balanceSummary.totalAllocated.toLocaleString()}
                </div>
                <div className="text-sm text-green-600">Total Allocated</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-800">
                  ${balanceSummary.totalRemaining.toLocaleString()}
                </div>
                <div className="text-sm text-blue-600">Remaining Balance</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-800">
                  ${balanceSummary.totalSpent.toLocaleString()}
                </div>
                <div className="text-sm text-orange-600">Total Spent</div>
              </div>
            </div>

            {/* Contract Details */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Active Contracts</h4>
              {balanceSummary.activeContracts.map(contract => (
                <div key={contract.contractId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{contract.type}</div>
                    <div className="text-sm text-gray-500">
                      {contract.recentTransactionCount} transactions
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">
                      ${contract.currentBalance.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      of ${contract.originalAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Contracts</h4>
            <p className="text-gray-600 mb-4">This resident doesn't have any active funding contracts.</p>
            <Link
              href={`/residents/${residentId}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Manage Funding
            </Link>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <Link
            href="/transactions"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View All
          </Link>
        </div>

        {recentTransactions && recentTransactions.transactions.length > 0 ? (
          <div className="space-y-3">
            {recentTransactions.transactions.map(transaction => (
              <div key={transaction.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                    <span className="font-medium text-gray-900">{transaction.serviceCode}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {format(new Date(transaction.occurredAt), 'MMM d, yyyy')}
                    {transaction.description && ` • ${transaction.description}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">
                    ${transaction.amount.toFixed(2)}
                  </div>
                  {transaction.note && (
                    <div className="text-sm text-gray-500 truncate max-w-32">
                      {transaction.note}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {recentTransactions.hasMore && (
              <div className="text-center pt-2">
                <Link
                  href={`/transactions?residentId=${residentId}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View all {recentTransactions.totalCount} transactions →
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-8 w-8 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600">No transactions yet</p>
            {onCreateTransaction && (
              <Button
                onClick={onCreateTransaction}
                size="sm"
                className="mt-2"
              >
                Create First Transaction
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}