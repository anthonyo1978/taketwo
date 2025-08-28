"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Input } from "components/ui/Input"
import { residentUpdateSchema } from "lib/schemas/resident"
import type { Resident, ResidentPreferences } from "types/resident"

interface ApiResponse {
  success: boolean
  data?: Resident
  error?: string
  details?: Array<{ message: string }>
}

interface ResidentEditPageProps {
  params: Promise<{ id: string }>
}

type ResidentUpdateFormData = z.infer<typeof residentUpdateSchema>

const preferencesOptions = {
  dietary: ['Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Low sodium', 'Diabetic'],
  medical: ['Regular medication', 'Mobility assistance', 'Vision impaired', 'Hearing impaired', 'Cognitive support'],
  accessibility: ['Wheelchair accessible', 'Ground floor only', 'Grab rails', 'Ramps', 'Wide doorways'],
  communication: ['Verbal', 'Written', 'Sign language', 'Visual aids', 'Technology assisted'],
  social: ['Group activities', 'One-on-one', 'Quiet environment', 'Active social', 'Privacy preferred']
}

export default function ResidentEditPage({ params }: ResidentEditPageProps) {
  const [resident, setResident] = useState<Resident | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [residentId, setResidentId] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params
      setResidentId(id)
    }
    getParams()
  }, [params])

  const form = useForm<ResidentUpdateFormData>({
    resolver: zodResolver(residentUpdateSchema),
    defaultValues: {
      preferences: {
        dietary: [],
        medical: [],
        accessibility: [],
        communication: [],
        social: [],
        other: ''
      }
    }
  })

  useEffect(() => {
    if (!residentId) return

    const fetchResident = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/residents/${residentId}`)
        const result: ApiResponse = await response.json()
        
        if (result.success && result.data) {
          setResident(result.data)
          
          // Populate form with resident data
          form.reset({
            firstName: result.data.firstName,
            lastName: result.data.lastName,
            phone: result.data.phone || '',
            email: result.data.email || '',
            ndisId: result.data.ndisId || '',
            detailedNotes: result.data.detailedNotes || '',
            preferences: {
              dietary: result.data.preferences?.dietary || [],
              medical: result.data.preferences?.medical || [],
              accessibility: result.data.preferences?.accessibility || [],
              communication: result.data.preferences?.communication || [],
              social: result.data.preferences?.social || [],
              other: result.data.preferences?.other || ''
            },
            emergencyContact: result.data.emergencyContact ? {
              name: result.data.emergencyContact.name,
              relationship: result.data.emergencyContact.relationship,
              phone: result.data.emergencyContact.phone,
              email: result.data.emergencyContact.email || ''
            } : undefined
          })
          
          setError(null)
        } else {
          setError(result.error || 'Failed to load resident')
        }
      } catch (err) {
        setError('Network error. Please check your connection and try again.')
        console.error('Error fetching resident:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchResident()
  }, [residentId, form])

  const onSubmit = async (data: ResidentUpdateFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/residents/${residentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result: ApiResponse = await response.json()

      if (result.success && result.data) {
        // Redirect back to resident detail page
        router.push(`/residents/${residentId}`)
      } else {
        setError(result.error || 'Failed to update resident')
        if (result.details) {
          console.error('Validation errors:', result.details)
        }
      }
    } catch (error) {
      setError('Network error. Please try again.')
      console.error('Error updating resident:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePreference = (category: keyof ResidentPreferences, value: string) => {
    const currentValues = form.getValues(`preferences.${category}`) as string[] || []
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value]
    
    form.setValue(`preferences.${category}`, newValues)
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mb-8" />
          <div className="bg-white rounded-lg border p-6">
            <div className="space-y-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2" />
                  <div className="h-10 bg-gray-200 rounded animate-pulse w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !resident) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg border p-12 text-center">
            <div className="text-red-600 text-lg mb-4">{error}</div>
            <Link 
              href="/residents"
              className="text-blue-600 hover:text-blue-800"
            >
              Back to Residents
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!resident) {
    return null
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <nav className="mb-4">
            <div className="flex items-center space-x-2 text-sm">
              <Link href="/residents" className="text-blue-600 hover:text-blue-800">
                Residents
              </Link>
              <span className="text-gray-400">→</span>
              <Link 
                href={`/residents/${resident.id}`} 
                className="text-blue-600 hover:text-blue-800"
              >
                {resident.firstName} {resident.lastName}
              </Link>
              <span className="text-gray-400">→</span>
              <span className="text-gray-600">Edit</span>
            </div>
          </nav>
          
          <div className="flex items-center space-x-4 mb-4">
            {/* Photo */}
            <div className="flex-shrink-0">
              {resident.photoBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                  src={resident.photoBase64}
                  alt={`${resident.firstName} ${resident.lastName}`}
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-2 border-gray-200">
                  <span className="text-white text-xl font-bold">
                    {resident.firstName.charAt(0)}{resident.lastName.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Edit {resident.firstName} {resident.lastName}
              </h1>
              <p className="text-gray-600">ID: {resident.id}</p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-lg border p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  required
                  {...form.register("firstName")}
                  error={form.formState.errors.firstName?.message}
                />
                <Input
                  label="Last Name"
                  required
                  {...form.register("lastName")}
                  error={form.formState.errors.lastName?.message}
                />
                <Input
                  label="Phone"
                  type="tel"
                  placeholder="0412345678"
                  {...form.register("phone")}
                  error={form.formState.errors.phone?.message}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="resident@example.com"
                  {...form.register("email")}
                  error={form.formState.errors.email?.message}
                />
                <div className="col-span-2">
                  <Input
                    label="NDIS ID"
                    placeholder="12345678"
                    {...form.register("ndisId")}
                    error={form.formState.errors.ndisId?.message}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Emergency Contact</h2>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Contact Name"
                  placeholder="John Doe"
                  {...form.register("emergencyContact.name")}
                  error={form.formState.errors.emergencyContact?.name?.message}
                />
                <Input
                  label="Relationship"
                  placeholder="Father, Mother, Guardian, etc."
                  {...form.register("emergencyContact.relationship")}
                  error={form.formState.errors.emergencyContact?.relationship?.message}
                />
                <Input
                  label="Contact Phone"
                  type="tel"
                  placeholder="0412345678"
                  {...form.register("emergencyContact.phone")}
                  error={form.formState.errors.emergencyContact?.phone?.message}
                />
                <Input
                  label="Contact Email"
                  type="email"
                  placeholder="contact@example.com"
                  {...form.register("emergencyContact.email")}
                  error={form.formState.errors.emergencyContact?.email?.message}
                />
              </div>
            </div>

            {/* Detailed Notes */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Notes
                </label>
                <textarea
                  {...form.register("detailedNotes")}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add detailed notes about the resident, including care instructions, preferences, medical information, or any other relevant details..."
                />
                {form.formState.errors.detailedNotes && (
                  <p className="text-red-600 text-sm mt-1">{form.formState.errors.detailedNotes.message}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">Maximum 5000 characters</p>
              </div>
            </div>

            {/* Preferences */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Preferences</h2>
              
              {Object.entries(preferencesOptions).map(([category, options]) => {
                const categoryKey = category as keyof typeof preferencesOptions
                const currentValues = form.watch(`preferences.${categoryKey}`) as string[] || []
                
                return (
                  <div key={category} className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3 capitalize">
                      {category} Preferences
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {options.map(option => (
                        <label
                          key={option}
                          className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                            currentValues.includes(option)
                              ? 'bg-blue-50 border-blue-200 text-blue-800'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={currentValues.includes(option)}
                            onChange={() => togglePreference(categoryKey, option)}
                            className="sr-only"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
              
              {/* Other Preferences */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Other Preferences
                </label>
                <textarea
                  {...form.register("preferences.other")}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any other preferences or special requirements..."
                />
                {form.formState.errors.preferences?.other && (
                  <p className="text-red-600 text-sm mt-1">{form.formState.errors.preferences.other.message}</p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-between items-center pt-6 border-t">
              <Link
                href={`/residents/${residentId}`}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-800">{error}</div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}