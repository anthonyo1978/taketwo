"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"

import { Button } from "components/Button/Button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "components/ui/Dialog"
import { Input } from "components/ui/Input"
import { GENDER_OPTIONS } from "lib/constants"
import { residentCreateSchema, type ResidentCreateSchemaType } from "lib/schemas/resident"
import type { House } from "types/house"
import type { Resident } from "types/resident"

interface ResidentFormProps {
  houseId?: string
  mode?: "house-context" | "standalone"
  open: boolean
  onClose: () => void
  onSuccess?: (resident: Resident) => void
}

export function ResidentForm({ houseId, mode = "house-context", open, onClose, onSuccess }: ResidentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [houses, setHouses] = useState<House[]>([])
  const [selectedHouseId, setSelectedHouseId] = useState<string>(houseId || "")

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResidentCreateSchemaType>({
    resolver: zodResolver(residentCreateSchema),
    defaultValues: {
      gender: 'Male',
    },
  })

  // Fetch houses for standalone mode
  useEffect(() => {
    if (mode === "standalone" && open) {
      const fetchHouses = async () => {
        try {
          const response = await fetch('/api/houses')
          const result = await response.json()
          if (result.success) {
            setHouses(result.data || [])
          }
        } catch (error) {
          console.error('Failed to fetch houses:', error)
        }
      }
      fetchHouses()
    }
  }, [mode, open])

  const handleFormSubmit = async (data: ResidentCreateSchemaType) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Determine which house ID to use
      const targetHouseId = mode === "standalone" ? selectedHouseId : houseId
      
      if (!targetHouseId) {
        setSubmitError('Please select a house')
        setIsSubmitting(false)
        return
      }

      const formData = new FormData()
      
      // Add all form fields to FormData
      formData.append('firstName', data.firstName)
      formData.append('lastName', data.lastName)
      formData.append('dateOfBirth', data.dateOfBirth.toISOString().split('T')[0])
      formData.append('gender', data.gender)
      
      if (data.phone) formData.append('phone', data.phone)
      if (data.email) formData.append('email', data.email)
      if (data.ndisId) formData.append('ndisId', data.ndisId)
      if (data.notes) formData.append('notes', data.notes)
      
      // Add photo file if provided
      if (data.photo && data.photo.length > 0) {
        formData.append('photo', data.photo[0])
      }

      // Use the appropriate API endpoint
      const apiUrl = mode === "standalone" 
        ? `/api/residents` 
        : `/api/houses/${targetHouseId}/residents`
      
      // For standalone mode, add houseId to formData
      if (mode === "standalone") {
        formData.append('houseId', targetHouseId)
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        reset()
        onSuccess?.(result.data)
        onClose()
      } else {
        setSubmitError(result.error || 'Failed to create resident')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      reset()
      setSubmitError(null)
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Resident</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Personal Information */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Personal Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="firstName"
                  {...register("firstName")}
                  placeholder="John"
                  className={errors.firstName ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="lastName"
                  {...register("lastName")}
                  placeholder="Doe"
                  className={errors.lastName ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register("dateOfBirth")}
                  className={errors.dateOfBirth ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.dateOfBirth.message}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  id="gender"
                  {...register("gender")}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.gender ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
                >
                  {GENDER_OPTIONS.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender}
                    </option>
                  ))}
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.gender.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Contact Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="0412 345 678"
                  className={errors.phone ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.phone.message}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="john.doe@example.com"
                  className={errors.email ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* NDIS Information */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">NDIS Information</h4>
            
            <div>
              <label htmlFor="ndisId" className="block text-sm font-medium text-gray-700 mb-1">
                NDIS Participant ID
              </label>
              <Input
                id="ndisId"
                {...register("ndisId")}
                placeholder="12345678"
                className={errors.ndisId ? "border-red-500" : ""}
                disabled={isSubmitting}
              />
              {errors.ndisId && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.ndisId.message}
                </p>
              )}
            </div>
          </div>

          {/* Photo Upload */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Photo</h4>
            
            <div>
              <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-1">
                Profile Photo
              </label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                {...register("photo")}
                className={errors.photo ? "border-red-500" : ""}
                disabled={isSubmitting}
              />
              {errors.photo && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.photo.message}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Optional. Max file size: 5MB. Supported formats: JPG, PNG, GIF
              </p>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Additional Information</h4>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                {...register("notes")}
                rows={3}
                placeholder="Additional notes about this resident..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.notes.message}
                </p>
              )}
            </div>
          </div>

          {/* House Selection (Standalone Mode Only) */}
          {mode === "standalone" && (
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">House Assignment</h4>
              
              <div>
                <label htmlFor="houseSelection" className="block text-sm font-medium text-gray-700 mb-1">
                  Select House <span className="text-red-500">*</span>
                </label>
                <select
                  id="houseSelection"
                  value={selectedHouseId}
                  onChange={(e) => setSelectedHouseId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    !selectedHouseId && submitError ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isSubmitting}
                >
                  <option value="">Choose a house...</option>
                  {houses.map((house) => (
                    <option key={house.id} value={house.id}>
                      {house.name} - {house.address}
                    </option>
                  ))}
                </select>
                {!selectedHouseId && submitError && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    Please select a house for this resident
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={isSubmitting}
              intent="primary"
              size="lg"
              className="min-w-32"
            >
              {isSubmitting ? "Adding..." : "Add Resident"}
            </Button>
            <Button
              type="button"
              intent="secondary"
              size="lg"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}