"use client"

import { useEffect, useState } from "react"
import type { Resident } from "types/resident"

interface ResidentAvatarsProps {
  houseId: string
  maxDisplay?: number // Maximum number of avatars to display (default 4)
}

interface ApiResponse {
  success: boolean
  data?: Resident[]
  error?: string
}

export function ResidentAvatars({ houseId, maxDisplay = 4 }: ResidentAvatarsProps) {
  const [residents, setResidents] = useState<Resident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResidents = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/houses/${houseId}/residents`)
        const result: ApiResponse = await response.json()
        
        if (result.success && result.data) {
          setResidents(result.data)
          setError(null)
        } else {
          setError(result.error || 'Failed to load residents')
        }
      } catch (err) {
        setError('Failed to load residents')
        console.error('Error fetching residents for house:', houseId, err)
      } finally {
        setLoading(false)
      }
    }

    fetchResidents()
  }, [houseId])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2].map(i => (
          <div 
            key={i}
            className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"
          />
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-xs text-red-500">
        Error loading residents
      </div>
    )
  }

  // Empty state
  if (residents.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No residents
      </div>
    )
  }

  // Display residents (limit to maxDisplay)
  const displayResidents = residents.slice(0, maxDisplay)
  const hasMore = residents.length > maxDisplay

  return (
    <div className="flex items-center space-x-1">
      {displayResidents.map((resident, index) => (
        <div 
          key={resident.id}
          className="relative group"
          style={{ zIndex: displayResidents.length - index }}
        >
          {/* Avatar */}
          <div className="h-8 w-8 rounded-full border-2 border-white shadow-sm overflow-hidden bg-gray-100 hover:scale-110 transition-transform">
            {resident.photoBase64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resident.photoBase64}
                alt={`${resident.firstName} ${resident.lastName}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {resident.firstName.charAt(0)}{resident.lastName.charAt(0)}
                </span>
              </div>
            )}
          </div>
          
          {/* Hover tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            {resident.firstName} {resident.lastName}
            {resident.age && (
              <span className="text-gray-300"> • {resident.age}y</span>
            )}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      ))}
      
      {/* Show count if more residents exist */}
      {hasMore && (
        <div 
          className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center group relative"
          title={`${residents.length - maxDisplay} more resident${residents.length - maxDisplay > 1 ? 's' : ''}`}
        >
          <span className="text-gray-600 text-xs font-medium">
            +{residents.length - maxDisplay}
          </span>
          
          {/* Hover tooltip for overflow count */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            {residents.length - maxDisplay} more resident{residents.length - maxDisplay > 1 ? 's' : ''}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  )
}