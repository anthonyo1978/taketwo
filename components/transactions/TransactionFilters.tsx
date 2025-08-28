"use client"

import { useState, useEffect } from "react"
import { Button } from "components/Button/Button"
import { Input } from "components/ui/Input"
import type { TransactionFilters as TxFilters } from "types/transaction"
import { getResidentsFromStorage } from "lib/utils/resident-storage"
import { getHousesFromStorage } from "lib/utils/house-storage"

interface TransactionFiltersProps {
  filters: TxFilters
  onFiltersChange: (filters: TxFilters) => void
}

export function TransactionFilters({ filters, onFiltersChange }: TransactionFiltersProps) {
  const [localFilters, setLocalFilters] = useState<TxFilters>(filters)
  const [residents] = useState(() => getResidentsFromStorage())
  const [houses] = useState(() => getHousesFromStorage())

  // Update local filters when external filters change
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleFilterChange = (key: keyof TxFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleDateRangeChange = (field: 'from' | 'to', value: string) => {
    const date = value ? new Date(value) : undefined
    const dateRange = localFilters.dateRange || { from: new Date(), to: new Date() }
    
    const newDateRange = { ...dateRange, [field]: date }
    if (newDateRange.from && newDateRange.to) {
      handleFilterChange('dateRange', newDateRange)
    } else if (!value) {
      handleFilterChange('dateRange', undefined)
    }
  }

  const clearFilters = () => {
    const emptyFilters: TxFilters = {}
    setLocalFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }

  const hasActiveFilters = Object.keys(localFilters).some(key => {
    const value = localFilters[key as keyof TxFilters]
    // Skip serviceCode and search since they're removed from UI
    if (key === 'serviceCode' || key === 'search') return false
    return value !== undefined && value !== null && 
           (Array.isArray(value) ? value.length > 0 : true)
  })

  return (
    <div className="space-y-3">
      {/* Compact single-row filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <h3 className="text-sm font-medium text-gray-900">Filters:</h3>
        
        {/* Date Range - Compact */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">From:</label>
          <Input
            type="date"
            value={localFilters.dateRange?.from ? 
              localFilters.dateRange.from.toISOString().split('T')[0] : ''}
            onChange={(e) => handleDateRangeChange('from', e.target.value)}
            className="w-36 h-8"
          />
          <label className="text-sm text-gray-600">To:</label>
          <Input
            type="date"
            value={localFilters.dateRange?.to ? 
              localFilters.dateRange.to.toISOString().split('T')[0] : ''}
            onChange={(e) => handleDateRangeChange('to', e.target.value)}
            className="w-36 h-8"
          />
        </div>

        {/* Status Filter - Compact */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Status:</label>
          <select
            className="px-3 py-1 border border-gray-300 rounded text-sm h-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={localFilters.statuses?.[0] || ''}
            onChange={(e) => 
              handleFilterChange('statuses', e.target.value ? [e.target.value] : undefined)
            }
          >
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="posted">Posted</option>
            <option value="voided">Voided</option>
          </select>
        </div>

        {/* Resident Filter - Compact */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Resident:</label>
          <select
            className="px-3 py-1 border border-gray-300 rounded text-sm h-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={localFilters.residentIds?.[0] || ''}
            onChange={(e) => 
              handleFilterChange('residentIds', e.target.value ? [e.target.value] : undefined)
            }
          >
            <option value="">All</option>
            {residents.map(resident => (
              <option key={resident.id} value={resident.id}>
                {resident.firstName} {resident.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* House Filter - Compact */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">House:</label>
          <select
            className="px-3 py-1 border border-gray-300 rounded text-sm h-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={localFilters.houseIds?.[0] || ''}
            onChange={(e) => 
              handleFilterChange('houseIds', e.target.value ? [e.target.value] : undefined)
            }
          >
            <option value="">All</option>
            {houses.map(house => (
              <option key={house.id} value={house.id}>
                {house.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clear All Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700 h-8 px-3 text-sm"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Summary - More Compact */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1">
          {localFilters.dateRange && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
              {localFilters.dateRange.from.toLocaleDateString()} - {localFilters.dateRange.to.toLocaleDateString()}
              <button
                onClick={() => handleFilterChange('dateRange', undefined)}
                className="ml-1 inline-flex items-center justify-center w-3 h-3 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600 focus:outline-none"
              >
                ×
              </button>
            </span>
          )}
          
          {localFilters.statuses?.length && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
              {localFilters.statuses[0]}
              <button
                onClick={() => handleFilterChange('statuses', undefined)}
                className="ml-1 inline-flex items-center justify-center w-3 h-3 rounded-full text-green-400 hover:bg-green-200 hover:text-green-600 focus:outline-none"
              >
                ×
              </button>
            </span>
          )}
          
          {localFilters.residentIds?.length && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
              {residents.find(r => r.id === localFilters.residentIds![0])?.firstName}
              <button
                onClick={() => handleFilterChange('residentIds', undefined)}
                className="ml-1 inline-flex items-center justify-center w-3 h-3 rounded-full text-purple-400 hover:bg-purple-200 hover:text-purple-600 focus:outline-none"
              >
                ×
              </button>
            </span>
          )}
          
          {localFilters.houseIds?.length && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
              {houses.find(h => h.id === localFilters.houseIds![0])?.name}
              <button
                onClick={() => handleFilterChange('houseIds', undefined)}
                className="ml-1 inline-flex items-center justify-center w-3 h-3 rounded-full text-orange-400 hover:bg-orange-200 hover:text-orange-600 focus:outline-none"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}