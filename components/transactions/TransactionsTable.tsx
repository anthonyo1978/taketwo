"use client"

import { useState, useEffect, useMemo } from "react"
import { format } from "date-fns"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table"
import { Button } from "components/Button/Button"
import type { 
  Transaction, 
  TransactionFilters, 
  TransactionListResponse 
} from "types/transaction"
import { getResidentsFromStorage } from "lib/utils/resident-storage"
import { getHousesFromStorage } from "lib/utils/house-storage"

interface TransactionsTableProps {
  filters: TransactionFilters
  onCreateTransaction: () => void
}

const columnHelper = createColumnHelper<Transaction & { 
  residentName: string
  houseName: string 
  contractType: string
}>()

export function TransactionsTable({ filters, onCreateTransaction }: TransactionsTableProps) {
  const [data, setData] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'occurredAt', desc: true }
  ])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  })
  const [totalCount, setTotalCount] = useState(0)
  const [selectedAction, setSelectedAction] = useState<'post' | 'void' | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  // Get lookup data
  const residents = getResidentsFromStorage()
  const houses = getHousesFromStorage()

  // Create lookup maps
  const residentLookup = useMemo(() => 
    new Map(residents.map(r => [r.id, r])), 
    [residents]
  )
  const houseLookup = useMemo(() => 
    new Map(houses.map(h => [h.id, h])), 
    [houses]
  )
  const contractLookup = useMemo(() => {
    const map = new Map()
    residents.forEach(resident => {
      resident.fundingInformation.forEach(contract => {
        map.set(contract.id, { ...contract, residentId: resident.id })
      })
    })
    return map
  }, [residents])

  // Enhance data with lookup information
  const enhancedData = useMemo(() => {
    return data.map(tx => {
      const resident = residentLookup.get(tx.residentId)
      const contract = contractLookup.get(tx.contractId)
      const house = resident ? houseLookup.get(resident.houseId) : null

      return {
        ...tx,
        residentName: resident ? `${resident.firstName} ${resident.lastName}` : 'Unknown',
        houseName: house?.name || 'Unknown',
        contractType: contract?.type || 'Unknown'
      }
    })
  }, [data, residentLookup, houseLookup, contractLookup])

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      searchParams.set('page', (pagination.pageIndex + 1).toString())
      searchParams.set('pageSize', pagination.pageSize.toString())

      // Add filters
      if (filters.dateRange) {
        searchParams.set('dateFrom', filters.dateRange.from.toISOString())
        searchParams.set('dateTo', filters.dateRange.to.toISOString())
      }
      if (filters.residentIds?.length) {
        searchParams.set('residentIds', filters.residentIds.join(','))
      }
      if (filters.contractIds?.length) {
        searchParams.set('contractIds', filters.contractIds.join(','))
      }
      if (filters.houseIds?.length) {
        searchParams.set('houseIds', filters.houseIds.join(','))
      }
      if (filters.statuses?.length) {
        searchParams.set('statuses', filters.statuses.join(','))
      }
      if (filters.serviceCode) {
        searchParams.set('serviceCode', filters.serviceCode)
      }
      if (filters.search) {
        searchParams.set('search', filters.search)
      }

      // Add sorting
      if (sorting.length > 0) {
        const sort = sorting[0]
        searchParams.set('sortField', sort.id)
        searchParams.set('sortDirection', sort.desc ? 'desc' : 'asc')
      }

      const response = await fetch(`/api/transactions?${searchParams}`)
      const result = await response.json()

      if (result.success) {
        const listResponse = result.data as TransactionListResponse
        setData(listResponse.transactions)
        setTotalCount(listResponse.total)
      } else {
        setError(result.error || 'Failed to load transactions')
      }
    } catch (err) {
      setError('Network error. Please check your connection.')
      console.error('Error fetching transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when filters, pagination, or sorting changes
  useEffect(() => {
    fetchTransactions()
  }, [filters, pagination, sorting])

  // Table columns
  const columns = useMemo<ColumnDef<typeof enhancedData[0]>[]>(() => [
    // Selection column
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      ),
      enableSorting: false,
      size: 50,
    },
    // Date column
    columnHelper.accessor('occurredAt', {
      id: 'occurredAt',
      header: 'Date',
      cell: (info) => format(new Date(info.getValue()), 'MMM d, yyyy'),
      size: 120,
    }),
    // Resident column
    columnHelper.accessor('residentName', {
      id: 'residentName',
      header: 'Resident',
      size: 150,
    }),
    // House column
    columnHelper.accessor('houseName', {
      id: 'houseName',
      header: 'House',
      size: 120,
    }),
    // Contract column
    columnHelper.accessor('contractType', {
      id: 'contractType',
      header: 'Contract',
      size: 100,
    }),
    // Service Code column
    columnHelper.accessor('serviceCode', {
      id: 'serviceCode',
      header: 'Service',
      size: 120,
    }),
    // Quantity column
    columnHelper.accessor('quantity', {
      id: 'quantity',
      header: 'Qty',
      cell: (info) => info.getValue().toLocaleString(),
      size: 80,
    }),
    // Unit Price column
    columnHelper.accessor('unitPrice', {
      id: 'unitPrice',
      header: 'Unit Price',
      cell: (info) => `$${info.getValue().toFixed(2)}`,
      size: 100,
    }),
    // Amount column
    columnHelper.accessor('amount', {
      id: 'amount',
      header: 'Amount',
      cell: (info) => `$${info.getValue().toFixed(2)}`,
      size: 100,
    }),
    // Status column
    columnHelper.accessor('status', {
      id: 'status',
      header: 'Status',
      cell: (info) => {
        const status = info.getValue()
        const colorMap = {
          draft: 'bg-gray-100 text-gray-800',
          posted: 'bg-green-100 text-green-800',
          voided: 'bg-red-100 text-red-800',
        }
        return (
          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${colorMap[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )
      },
      size: 100,
    }),
    // Note column
    columnHelper.accessor('note', {
      id: 'note',
      header: 'Note',
      cell: (info) => info.getValue() || '-',
      size: 200,
    }),
    // Actions column
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewTransaction(row.original.id)}
          >
            View
          </Button>
          {row.original.status === 'draft' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditTransaction(row.original.id)}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePostTransaction(row.original.id)}
                className="text-green-600 hover:text-green-700"
              >
                Post
              </Button>
            </>
          )}
          {row.original.status === 'posted' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVoidTransaction(row.original.id)}
              className="text-red-600 hover:text-red-700"
            >
              Void
            </Button>
          )}
        </div>
      ),
      enableSorting: false,
      size: 200,
    },
  ], [])

  const table = useReactTable({
    data: enhancedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      pagination,
    },
  })

  // Action handlers
  const handleViewTransaction = (id: string) => {
    // TODO: Implement view transaction
    console.log('View transaction:', id)
  }

  const handleEditTransaction = (id: string) => {
    // TODO: Implement edit transaction
    console.log('Edit transaction:', id)
  }

  const handlePostTransaction = async (id: string) => {
    try {
      const response = await fetch(`/api/transactions/${id}/post`, {
        method: 'POST',
      })
      const result = await response.json()
      
      if (result.success) {
        await fetchTransactions() // Refresh the table
      } else {
        setError(result.error || 'Failed to post transaction')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Error posting transaction:', err)
    }
  }

  const handleVoidTransaction = async (id: string) => {
    const reason = window.prompt('Please provide a reason for voiding this transaction:')
    if (!reason) return

    try {
      const response = await fetch(`/api/transactions/${id}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const result = await response.json()
      
      if (result.success) {
        await fetchTransactions() // Refresh the table
      } else {
        setError(result.error || 'Failed to void transaction')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Error voiding transaction:', err)
    }
  }

  // Bulk operations
  const handleBulkOperation = async (action: 'post' | 'void') => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    const transactionIds = selectedRows.map(row => row.original.id)
    
    if (transactionIds.length === 0) {
      alert('Please select transactions to ' + action)
      return
    }

    let reason = ''
    if (action === 'void') {
      reason = window.prompt('Please provide a reason for voiding these transactions:') || ''
      if (!reason) return
    }

    setBulkLoading(true)
    try {
      const response = await fetch('/api/transactions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionIds,
          action,
          reason: reason || undefined
        }),
      })
      const result = await response.json()
      
      if (result.success) {
        setRowSelection({})
        await fetchTransactions() // Refresh the table
      } else {
        setError(result.error || `Failed to ${action} transactions`)
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error(`Error ${action}ing transactions:`, err)
    } finally {
      setBulkLoading(false)
    }
  }

  // CSV Export
  const handleExport = async () => {
    try {
      const searchParams = new URLSearchParams()
      
      // Add current filters
      if (filters.dateRange) {
        searchParams.set('dateFrom', filters.dateRange.from.toISOString())
        searchParams.set('dateTo', filters.dateRange.to.toISOString())
      }
      // ... add other filters
      
      const selectedRows = table.getFilteredSelectedRowModel().rows
      if (selectedRows.length > 0) {
        const transactionIds = selectedRows.map(row => row.original.id)
        searchParams.set('transactionIds', transactionIds.join(','))
      }

      window.open(`/api/transactions/export?${searchParams}`, '_blank')
    } catch (err) {
      setError('Failed to export transactions')
      console.error('Error exporting transactions:', err)
    }
  }

  const selectedCount = Object.keys(rowSelection).length

  if (loading && data.length === 0) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Table Header with Bulk Actions */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">
            Transactions ({totalCount.toLocaleString()})
          </h2>
          {selectedCount > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedCount} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkOperation('post')}
                disabled={bulkLoading}
              >
                Bulk Post
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkOperation('void')}
                disabled={bulkLoading}
              >
                Bulk Void
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExport}>
            Export CSV
          </Button>
          <Button onClick={onCreateTransaction}>
            + Create
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="mt-2"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    style={{ width: header.getSize() }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center space-x-1">
                      <span>
                        {header.isPlaceholder
                          ? null
                          : typeof header.column.columnDef.header === 'string'
                          ? header.column.columnDef.header
                          : header.column.columnDef.header?.(header.getContext())}
                      </span>
                      <span className="text-gray-400">
                        {header.column.getIsSorted() === 'desc' 
                          ? '↓' 
                          : header.column.getIsSorted() === 'asc' 
                          ? '↑' 
                          : ''}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {enhancedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
                    <p className="text-gray-400 mb-4">Get started by creating your first transaction</p>
                    <Button onClick={onCreateTransaction}>
                      Create Transaction
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {typeof cell.column.columnDef.cell === 'function'
                        ? cell.column.columnDef.cell(cell.getContext())
                        : cell.getValue() as React.ReactNode}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <div className="text-sm text-gray-700">
            Showing {pagination.pageIndex * pagination.pageSize + 1} to{' '}
            {Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalCount)} of{' '}
            {totalCount} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}