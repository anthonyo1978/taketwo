"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "components/Button/Button"
import { Input } from "components/ui/Input"
import { AUSTRALIAN_STATES, DEFAULT_COUNTRY, HOUSE_STATUSES } from "lib/constants"
import { houseCreateSchema, type HouseCreateSchemaType } from "lib/schemas/house"

interface HouseFormProps {
  onSubmit: (data: HouseCreateSchemaType) => Promise<void>
  isLoading?: boolean
  className?: string
}

export function HouseForm({ onSubmit, isLoading = false, className }: HouseFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<HouseCreateSchemaType>({
    resolver: zodResolver(houseCreateSchema),
    defaultValues: {
      country: DEFAULT_COUNTRY,
      status: 'Active',
      goLiveDate: new Date(),
    },
  })

  const handleFormSubmit = async (data: HouseCreateSchemaType) => {
    try {
      await onSubmit(data)
      reset()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const submitDisabled = isSubmitting || isLoading

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Address Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Address Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="address1" className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1 <span className="text-red-500">*</span>
              </label>
              <Input
                id="address1"
                {...register("address1")}
                placeholder="123 Main Street"
                className={errors.address1 ? "border-red-500" : ""}
                disabled={submitDisabled}
              />
              {errors.address1 && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.address1.message}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                Unit/Apartment
              </label>
              <Input
                id="unit"
                {...register("unit")}
                placeholder="Apt 2B"
                disabled={submitDisabled}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="suburb" className="block text-sm font-medium text-gray-700 mb-1">
                Suburb/City <span className="text-red-500">*</span>
              </label>
              <Input
                id="suburb"
                {...register("suburb")}
                placeholder="Sydney"
                className={errors.suburb ? "border-red-500" : ""}
                disabled={submitDisabled}
              />
              {errors.suburb && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.suburb.message}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <select
                id="state"
                {...register("state")}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.state ? "border-red-500" : "border-gray-300"
                }`}
                disabled={submitDisabled}
              >
                <option value="">Select State</option>
                {AUSTRALIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              {errors.state && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.state.message}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1">
                Postcode <span className="text-red-500">*</span>
              </label>
              <Input
                id="postcode"
                {...register("postcode")}
                placeholder="2000"
                maxLength={4}
                className={errors.postcode ? "border-red-500" : ""}
                disabled={submitDisabled}
              />
              {errors.postcode && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.postcode.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <Input
              id="country"
              {...register("country")}
              placeholder="AU"
              disabled={submitDisabled}
            />
          </div>
        </div>

        {/* Property Details Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Property Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                {...register("status")}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.status ? "border-red-500" : "border-gray-300"
                }`}
                disabled={submitDisabled}
              >
                {HOUSE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.status.message}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="goLiveDate" className="block text-sm font-medium text-gray-700 mb-1">
                Go-Live Date <span className="text-red-500">*</span>
              </label>
              <Input
                id="goLiveDate"
                type="date"
                {...register("goLiveDate")}
                className={errors.goLiveDate ? "border-red-500" : ""}
                disabled={submitDisabled}
              />
              {errors.goLiveDate && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.goLiveDate.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
          
          <div>
            <label htmlFor="resident" className="block text-sm font-medium text-gray-700 mb-1">
              Current Resident
            </label>
            <Input
              id="resident"
              {...register("resident")}
              placeholder="John Doe"
              disabled={submitDisabled}
            />
          </div>
          
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              {...register("notes")}
              rows={3}
              placeholder="Additional notes about this property..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={submitDisabled}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={submitDisabled}
            className="min-w-32"
          >
            {submitDisabled ? "Creating..." : "Create House"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => reset()}
            disabled={submitDisabled}
          >
            Clear Form
          </Button>
        </div>
      </form>
    </div>
  )
}