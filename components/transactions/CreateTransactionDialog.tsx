"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "components/ui/Dialog"
import { Button } from "components/Button/Button"
import { Input } from "components/ui/Input"
import { getResidentsFromStorage } from "lib/utils/resident-storage"
import { getHousesFromStorage } from "lib/utils/house-storage"
import { getTransactionBalancePreview } from "lib/utils/transaction-storage"
import { COMMON_SERVICE_CODES } from "types/transaction"
import type { TransactionCreateInput, TransactionBalancePreview } from "types/transaction"

// Form schema
const createTransactionSchema = z.object({
  residentId: z.string().min(1, "Please select a resident"),
  contractId: z.string().min(1, "Please select a contract"),
  occurredAt: z.coerce.date(),
  serviceCode: z.string().min(1, "Please select a service code"),
  description: z.string().optional(),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().nonnegative("Unit price must be non-negative"),
  amount: z.number().nonnegative().optional(),
  note: z.string().optional()
})

type FormData = z.infer<typeof createTransactionSchema>

interface CreateTransactionDialogProps {
  onClose: () => void
  onSuccess: () => void
}

export function CreateTransactionDialog({ onClose, onSuccess }: CreateTransactionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [balancePreview, setBalancePreview] = useState<TransactionBalancePreview | null>(null)
  const [residents] = useState(() => getResidentsFromStorage())
  const [houses] = useState(() => getHousesFromStorage())

  const form = useForm<FormData>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      occurredAt: new Date(),
      quantity: 1,
      unitPrice: 0,
    }
  })

  const watchedValues = form.watch()
  const selectedResident = residents.find(r => r.id === watchedValues.residentId)
  const selectedContract = selectedResident?.fundingInformation.find(c => c.id === watchedValues.contractId)

  // Get available contracts for selected resident (only active contracts)
  const availableContracts = selectedResident?.fundingInformation.filter(c => c.contractStatus === 'Active') || []

  // Calculate amount when quantity or unit price changes
  useEffect(() => {
    if (watchedValues.quantity && watchedValues.unitPrice) {
      const calculatedAmount = watchedValues.quantity * watchedValues.unitPrice
      form.setValue('amount', calculatedAmount)
    }
  }, [watchedValues.quantity, watchedValues.unitPrice, form])

  // Update balance preview when contract or amount changes
  useEffect(() => {
    if (watchedValues.contractId && watchedValues.amount) {
      try {
        const preview = getTransactionBalancePreview(watchedValues.contractId, watchedValues.amount)
        setBalancePreview(preview)
      } catch (err) {
        setBalancePreview(null)
      }
    } else {
      setBalancePreview(null)
    }
  }, [watchedValues.contractId, watchedValues.amount])

  // Reset contract when resident changes
  useEffect(() => {
    form.setValue('contractId', '')
  }, [watchedValues.residentId, form])

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || 'Failed to create transaction')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Error creating transaction:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const residentHouse = selectedResident ? houses.find(h => h.id === selectedResident.houseId) : null

  return (
    <Dialog open={true} onClose={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Transaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Resident Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Resident *
            </label>
            <select
              {...form.register('residentId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a resident...</option>
              {residents.map(resident => {
                const house = houses.find(h => h.id === resident.houseId)
                return (
                  <option key={resident.id} value={resident.id}>
                    {resident.firstName} {resident.lastName} - {house?.name || 'Unknown House'}
                  </option>
                )
              })}
            </select>
            {form.formState.errors.residentId && (
              <p className="text-red-600 text-sm">{form.formState.errors.residentId.message}</p>
            )}
          </div>

          {/* Contract Selection */}
          {selectedResident && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Contract *
              </label>
              {availableContracts.length > 0 ? (
                <select
                  {...form.register('contractId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a contract...</option>
                  {availableContracts.map(contract => (
                    <option key={contract.id} value={contract.id}>
                      {contract.type} - ${contract.currentBalance.toLocaleString()} remaining
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    No active contracts available for this resident.
                  </p>
                </div>
              )}
              {form.formState.errors.contractId && (
                <p className="text-red-600 text-sm">{form.formState.errors.contractId.message}</p>
              )}
            </div>
          )}

          {/* Resident & Contract Info Display */}
          {selectedResident && residentHouse && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Resident:</span>
                  <p className="font-medium">{selectedResident.firstName} {selectedResident.lastName}</p>
                </div>
                <div>
                  <span className="text-gray-500">House:</span>
                  <p className="font-medium">{residentHouse.name}</p>
                </div>
                {selectedContract && (
                  <>
                    <div>
                      <span className="text-gray-500">Contract:</span>
                      <p className="font-medium">{selectedContract.type}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Available Balance:</span>
                      <p className="font-medium text-green-600">
                        ${selectedContract.currentBalance.toLocaleString()}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Occurred Date */}
            <div className="space-y-2">
              <Input
                label="Date Occurred *"
                type="date"
                {...form.register('occurredAt')}
                error={form.formState.errors.occurredAt?.message}
              />
            </div>

            {/* Service Code */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Service Code *
              </label>
              <select
                {...form.register('serviceCode')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select service code...</option>
                {COMMON_SERVICE_CODES.map(service => (
                  <option key={service.code} value={service.code}>
                    {service.label} - {service.description}
                  </option>
                ))}
              </select>
              {form.formState.errors.serviceCode && (
                <p className="text-red-600 text-sm">{form.formState.errors.serviceCode.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              {...form.register('description')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the service provided..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quantity */}
            <div className="space-y-2">
              <Input
                label="Quantity *"
                type="number"
                step="0.01"
                min="0"
                {...form.register('quantity', { valueAsNumber: true })}
                error={form.formState.errors.quantity?.message}
              />
            </div>

            {/* Unit Price */}
            <div className="space-y-2">
              <Input
                label="Unit Price *"
                type="number"
                step="0.01"
                min="0"
                {...form.register('unitPrice', { valueAsNumber: true })}
                error={form.formState.errors.unitPrice?.message}
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Input
                label="Amount *"
                type="number"
                step="0.01"
                min="0"
                {...form.register('amount', { valueAsNumber: true })}
                error={form.formState.errors.amount?.message}
              />
              <p className="text-xs text-gray-500">
                Auto-calculated from quantity × unit price
              </p>
            </div>
          </div>

          {/* Balance Preview */}
          {balancePreview && (
            <div className={`p-4 rounded-lg border ${
              balancePreview.canPost 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <h4 className={`font-medium ${
                balancePreview.canPost ? 'text-green-800' : 'text-red-800'
              }`}>
                Balance Preview
              </h4>
              <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Current Balance:</span>
                  <p className="font-medium">${balancePreview.currentBalance.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Transaction Amount:</span>
                  <p className="font-medium">${balancePreview.transactionAmount.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Remaining After Post:</span>
                  <p className={`font-medium ${
                    balancePreview.canPost ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${balancePreview.remainingAfterPost.toFixed(2)}
                  </p>
                </div>
              </div>
              {balancePreview.warningMessage && (
                <p className="mt-2 text-sm text-red-600">
                  ⚠️ {balancePreview.warningMessage}
                </p>
              )}
            </div>
          )}

          {/* Note */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Note
            </label>
            <textarea
              {...form.register('note')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes or comments..."
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isSubmitting ? 'Creating...' : 'Create Transaction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}