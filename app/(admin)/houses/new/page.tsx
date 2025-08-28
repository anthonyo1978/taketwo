"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "react-hot-toast"

import { HouseForm } from "components/houses/HouseForm"
import type { HouseCreateSchemaType } from "lib/schemas/house"
import type { House } from "types/house"

export default function NewHousePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: HouseCreateSchemaType) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/houses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success && result.data) {
        const newHouse = result.data as House
        
        toast.success(`House ${newHouse.id} created successfully!`, {
          duration: 4000,
        })
        
        // Redirect after 1s delay to allow toast to be seen
        setTimeout(() => {
          router.push(`/houses/${newHouse.id}`)
        }, 1000)
      } else {
        throw new Error(result.error || 'Failed to create house')
      }
    } catch (error) {
      console.error('Error creating house:', error)
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to create house. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Breadcrumb */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link href="/houses" className="hover:text-gray-700">
              Houses
            </Link>
            <span>/</span>
            <span className="text-gray-900">New House</span>
          </nav>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New House</h1>
              <p className="text-gray-600 mt-2">
                Create a new property listing with all required details
              </p>
            </div>
            
            <Link
              href="/houses"
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <HouseForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}