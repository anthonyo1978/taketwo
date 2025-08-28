"use client"

import { useState } from "react"
import { TransactionsTable } from "components/transactions/TransactionsTable"
import { TransactionFilters } from "components/transactions/TransactionFilters"
import { CreateTransactionDialog } from "components/transactions/CreateTransactionDialog"
import { Button } from "components/Button/Button"
import { type TransactionFilters as TxFilters } from "types/transaction"

export default function TransactionsPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [filters, setFilters] = useState<TxFilters>({})
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
              <p className="text-gray-600 mt-1">
                Manage billing transactions and contract drawdowns
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                + Create Transaction
              </Button>
            </div>
          </div>
        </div>
        
        {/* Filters - Compact */}
        <div className="bg-white rounded-lg border shadow-sm p-4 mb-4">
          <TransactionFilters 
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>
        
        {/* Transactions Table */}
        <div className="bg-white rounded-lg border shadow-sm">
          <TransactionsTable 
            filters={filters}
            onCreateTransaction={() => setShowCreateDialog(true)}
          />
        </div>
        
        {/* Create Transaction Dialog */}
        {showCreateDialog && (
          <CreateTransactionDialog
            onClose={() => setShowCreateDialog(false)}
            onSuccess={() => {
              setShowCreateDialog(false)
              // Table will refresh via its own state management
            }}
          />
        )}
      </div>
    </div>
  )
}