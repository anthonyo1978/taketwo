"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "components/ui/Dialog"
import { Input } from "components/ui/Input"
import type { ContractStatus, DrawdownRate, FundingInformation, FundingType } from "types/resident"

interface FundingManagerProps {
  residentId: string
  fundingInfo: FundingInformation[]
  onFundingChange?: (updatedFunding: FundingInformation[]) => void
  editingContract?: FundingInformation | null
}

interface ApiResponse {
  success: boolean
  data?: FundingInformation | FundingInformation[]
  error?: string
  details?: Array<{ message: string }>
}

const fundingFormSchema = z.object({
  type: z.enum(['NDIS', 'Government', 'Private', 'Family', 'Other'] as const),
  amount: z.number()
    .min(0, "Funding amount must be positive")
    .max(999999.99, "Funding amount must be less than $1,000,000")
    .refine(val => Number.isFinite(val), "Invalid funding amount"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  description: z.string()
    .max(200, "Description must be no more than 200 characters")
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().default(true),
  drawdownRate: z.enum(['daily', 'weekly', 'fortnightly', 'monthly'] as const).default('monthly'),
  autoDrawdown: z.boolean().default(true),
  renewalDate: z.coerce.date().optional(),
  supportItemCode: z.string()
    .max(50, "Support item code must be no more than 50 characters")
    .optional()
    .or(z.literal(''))
}).refine(
  (data) => !data.endDate || data.startDate <= data.endDate,
  {
    message: "End date must be after start date",
    path: ["endDate"]
  }
).refine(
  (data) => !data.renewalDate || data.renewalDate > data.startDate,
  {
    message: "Renewal date must be after start date",
    path: ["renewalDate"]
  }
)

type FundingFormData = z.infer<typeof fundingFormSchema>

const fundingTypeOptions: { value: FundingType; label: string; description: string }[] = [
  { value: 'NDIS', label: 'NDIS', description: 'National Disability Insurance Scheme' },
  { value: 'Government', label: 'Government', description: 'Other government assistance' },
  { value: 'Private', label: 'Private', description: 'Private insurance or funding' },
  { value: 'Family', label: 'Family', description: 'Family-provided financial support' },
  { value: 'Other', label: 'Other', description: 'Custom funding source' }
]

const drawdownRateOptions: { value: DrawdownRate; label: string; description: string }[] = [
  { value: 'daily', label: 'Daily', description: 'Funds reduce daily over contract period' },
  { value: 'weekly', label: 'Weekly', description: 'Funds reduce weekly over contract period' },
  { value: 'fortnightly', label: 'Fortnightly', description: 'Funds reduce fortnightly over contract period' },
  { value: 'monthly', label: 'Monthly', description: 'Funds reduce monthly over contract period' }
]

export function FundingManager({ residentId, fundingInfo, onFundingChange, editingContract }: FundingManagerProps) {
  const [showAddForm, setShowAddForm] = useState(!!editingContract)
  const [editingFunding, setEditingFunding] = useState<FundingInformation | null>(editingContract || null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const form = useForm<FundingFormData>({
    resolver: zodResolver(fundingFormSchema),
    defaultValues: editingContract ? {
      type: editingContract.type,
      amount: editingContract.amount,
      startDate: editingContract.startDate,
      endDate: editingContract.endDate,
      description: editingContract.description || '',
      isActive: editingContract.contractStatus === 'Active',
      drawdownRate: editingContract.drawdownRate,
      autoDrawdown: editingContract.autoDrawdown,
      renewalDate: editingContract.renewalDate,
      supportItemCode: editingContract.supportItemCode || ''
    } : {
      type: 'NDIS',
      amount: 0,
      startDate: new Date(),
      isActive: true,
      drawdownRate: 'monthly',
      autoDrawdown: true,
      supportItemCode: ''
    }
  })
  

  // Calculate daily support item cost
  const calculateDailySupportItemCost = (amount: number, startDate: Date, endDate?: Date): number => {
    if (!endDate) return 0 // Cannot calculate without end date
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    if (totalDays <= 0) return 0
    
    return amount / totalDays
  }


  const openAddForm = () => {
    setEditingFunding(null)
    form.reset({
      type: 'NDIS',
      amount: 0,
      startDate: new Date(),
      isActive: true,
      drawdownRate: 'monthly',
      autoDrawdown: true,
      supportItemCode: ''
    })
    setShowAddForm(true)
    setError(null)
  }

  const openEditForm = (funding: FundingInformation) => {
    setEditingFunding(funding)
    form.reset({
      type: funding.type,
      amount: funding.amount,
      startDate: funding.startDate,
      endDate: funding.endDate,
      description: funding.description || '',
      isActive: funding.isActive,
      drawdownRate: funding.drawdownRate,
      autoDrawdown: funding.autoDrawdown,
      renewalDate: funding.renewalDate,
      supportItemCode: funding.supportItemCode || ''
    })
    setShowAddForm(true)
    setError(null)
  }

  const closeForm = () => {
    setShowAddForm(false)
    setEditingFunding(null)
    setError(null)
    form.reset()
  }

  const onSubmit = async (data: FundingFormData) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Calculate daily support item cost
      const dailySupportItemCost = calculateDailySupportItemCost(data.amount, data.startDate, data.endDate)
      
      // Handle contract status based on isActive checkbox
      let contractStatus: ContractStatus = 'Draft'
      if (data.isActive) {
        contractStatus = 'Active'
      } else if (editingFunding) {
        // Keep existing status if unchecking isActive
        contractStatus = editingFunding.contractStatus === 'Active' ? 'Draft' : editingFunding.contractStatus
      }
      
      const submissionData = {
        ...data,
        dailySupportItemCost,
        contractStatus
      }
      
      if (editingFunding || editingContract) {
        const contractToEdit = editingFunding || editingContract!
        // Update existing funding
        const response = await fetch(`/api/residents/${residentId}/funding`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fundingId: contractToEdit.id,
            ...submissionData
          })
        })
        
        const result: ApiResponse = await response.json()
        
        if (result.success && result.data) {
          const updatedFunding = fundingInfo.map(f => 
            f.id === contractToEdit.id ? result.data as FundingInformation : f
          )
          onFundingChange?.(updatedFunding)
          closeForm()
        } else {
          setError(result.error || 'Failed to update funding information')
        }
      } else {
        // Add new funding
        const response = await fetch(`/api/residents/${residentId}/funding`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submissionData)
        })
        
        const result: ApiResponse = await response.json()
        
        if (result.success && result.data) {
          const newFunding = [...fundingInfo, result.data as FundingInformation]
          onFundingChange?.(newFunding)
          closeForm()
        } else {
          setError(result.error || 'Failed to add funding information')
        }
      }
    } catch (error) {
      setError('Network error. Please try again.')
      console.error('Error managing funding:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeFunding = async (fundingId: string) => {
    if (!confirm('Are you sure you want to remove this funding information?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/residents/${residentId}/funding?fundingId=${fundingId}`, {
        method: 'DELETE'
      })
      
      const result: ApiResponse = await response.json()
      
      if (result.success) {
        const updatedFunding = fundingInfo.filter(f => f.id !== fundingId)
        onFundingChange?.(updatedFunding)
      } else {
        alert(result.error || 'Failed to remove funding information')
      }
    } catch (error) {
      alert('Network error. Please try again.')
      console.error('Error removing funding:', error)
    }
  }

  const getFundingTypeColor = (type: FundingType) => {
    const colors = {
      'NDIS': 'bg-blue-100 text-blue-800',
      'Government': 'bg-green-100 text-green-800', 
      'Private': 'bg-purple-100 text-purple-800',
      'Family': 'bg-orange-100 text-orange-800',
      'Other': 'bg-gray-100 text-gray-800'
    }
    return colors[type]
  }

  const formatDateRange = (startDate: Date, endDate?: Date) => {
    const start = new Date(startDate).toLocaleDateString()
    if (endDate) {
      const end = new Date(endDate).toLocaleDateString()
      return `${start} - ${end}`
    }
    return `${start} - Ongoing`
  }

  return (
    <div className="space-y-6">
      {/* Only show the contract list when not editing a specific contract */}
      {!editingContract && (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Add New Contract</h3>
          <button 
            onClick={openAddForm}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Add Contract
          </button>
        </div>
        
        {/* Draft Contracts Only */}
        {fundingInfo.filter(f => f.contractStatus === 'Draft').length > 0 ? (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Draft Contracts</h4>
            {fundingInfo
              .filter(f => f.contractStatus === 'Draft')
              .map(funding => (
                <div key={funding.id} className="space-y-4">
                  <div className={`p-6 rounded-lg border-2 ${
                    funding.contractStatus === 'Active' ? 'border-green-200 bg-green-50' :
                    funding.contractStatus === 'Draft' ? 'border-blue-200 bg-blue-50' :
                    funding.contractStatus === 'Expired' ? 'border-red-200 bg-red-50' :
                    'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getFundingTypeColor(funding.type)}`}>
                          {funding.type}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          funding.contractStatus === 'Draft' ? 'bg-gray-100 text-gray-800' :
                          funding.contractStatus === 'Active' ? 'bg-green-100 text-green-800' :
                          funding.contractStatus === 'Expired' ? 'bg-red-100 text-red-800' :
                          funding.contractStatus === 'Cancelled' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {funding.contractStatus}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditForm(funding)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Edit Contract
                        </button>
                        <button
                          onClick={() => removeFunding(funding.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          ${funding.originalAmount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">Original Amount</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          ${funding.currentBalance.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">Current Balance</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          ${(funding.originalAmount - funding.currentBalance).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">Drawn Down</div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        <span className="font-medium">Period:</span> {formatDateRange(funding.startDate, funding.endDate)}
                      </div>
                      <div>
                        <span className="font-medium">Drawdown Rate:</span> {funding.drawdownRate} 
                        {!funding.autoDrawdown && ' (Manual)'}
                      </div>
                      {funding.description && (
                        <div>
                          <span className="font-medium">Description:</span> {funding.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <p className="text-lg font-medium mb-2">No funding contracts</p>
            <p className="mb-4">Create funding contracts to track financial support and balance drawdown over time.</p>
            <button
              onClick={openAddForm}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Contract
            </button>
          </div>
        )}
      </div>
      )}
      
      {/* Add/Edit Funding Dialog */}
      <Dialog open={showAddForm} onClose={closeForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFunding || editingContract ? 'Edit Funding Contract' : 'Create Funding Contract'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-96 overflow-y-auto">
            {/* Funding Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Funding Type *
              </label>
              <Controller
                name="type"
                control={form.control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {fundingTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label} - {option.description}
                      </option>
                    ))}
                  </select>
                )}
              />
              {form.formState.errors.type && (
                <p className="text-red-600 text-sm mt-1">{form.formState.errors.type.message}</p>
              )}
            </div>
            
            {/* Amount */}
            <div>
              <Input
                label="Amount *"
                type="number"
                step="0.01"
                min="0"
                max="999999.99"
                placeholder="0.00"
                {...form.register("amount", { valueAsNumber: true })}
                error={form.formState.errors.amount?.message}
              />
            </div>
            
            {/* Start Date */}
            <div>
              <Input
                label="Start Date *"
                type="date"
                {...form.register("startDate")}
                error={form.formState.errors.startDate?.message}
              />
            </div>
            
            {/* End Date */}
            <div>
              <Input
                label="End Date (Optional)"
                type="date"
                {...form.register("endDate")}
                error={form.formState.errors.endDate?.message}
              />
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                {...form.register("description")}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes about this funding..."
              />
              {form.formState.errors.description && (
                <p className="text-red-600 text-sm mt-1">{form.formState.errors.description.message}</p>
              )}
            </div>

            {/* Support Item Code */}
            <div>
              <Input
                label="Support Item Code (Optional)"
                placeholder="e.g., 01_011_0107_1_1"
                {...form.register("supportItemCode")}
                error={form.formState.errors.supportItemCode?.message}
              />
              <p className="text-sm text-gray-500 mt-1">
                NDIS support item code for billing and compliance
              </p>
            </div>
            
            {/* Drawdown Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Drawdown Rate *
              </label>
              <Controller
                name="drawdownRate"
                control={form.control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {drawdownRateOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label} - {option.description}
                      </option>
                    ))}
                  </select>
                )}
              />
              {form.formState.errors.drawdownRate && (
                <p className="text-red-600 text-sm mt-1">{form.formState.errors.drawdownRate.message}</p>
              )}
            </div>

            {/* Renewal Date */}
            <div>
              <Input
                label="Renewal Date (Optional)"
                type="date"
                {...form.register("renewalDate")}
                error={form.formState.errors.renewalDate?.message}
              />
              <p className="text-xs text-gray-500 mt-1">
                Set a reminder date for contract renewal
              </p>
            </div>

            {/* Contract Settings */}
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700">Contract Settings</h4>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...form.register("autoDrawdown")}
                  id="autoDrawdown"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoDrawdown" className="ml-2 block text-sm text-gray-900">
                  Enable automatic balance drawdown over time
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...form.register("isActive")}
                  id="isActive"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  This contract is currently active
                </label>
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-800 text-sm">{error}</div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={closeForm}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting 
                  ? (editingFunding || editingContract ? 'Updating...' : 'Creating...')
                  : (editingFunding || editingContract ? 'Update Contract' : 'Create Contract')
                }
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}