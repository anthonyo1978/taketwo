"use client"

import { useState } from "react"
import type { AuditLogEntry } from "types/resident"

interface AuditTrailProps {
  entries: AuditLogEntry[]
}

const actionColors = {
  'CREATED': 'bg-green-100 text-green-800 border-green-200',
  'UPDATED': 'bg-blue-100 text-blue-800 border-blue-200',
  'STATUS_CHANGED': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'FUNDING_ADDED': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'FUNDING_UPDATED': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'FUNDING_REMOVED': 'bg-red-100 text-red-800 border-red-200',
  'PHOTO_UPDATED': 'bg-purple-100 text-purple-800 border-purple-200',
  'DEACTIVATED': 'bg-gray-100 text-gray-800 border-gray-200'
}

const actionIcons = {
  'CREATED': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  'UPDATED': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  'STATUS_CHANGED': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  'FUNDING_ADDED': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  ),
  'FUNDING_UPDATED': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  ),
  'FUNDING_REMOVED': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  ),
  'PHOTO_UPDATED': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  'DEACTIVATED': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
    </svg>
  )
}

export function AuditTrail({ entries }: AuditTrailProps) {
  const [showAllEntries, setShowAllEntries] = useState(false)
  const [filterAction, setFilterAction] = useState<string>('all')
  
  // Sort entries by timestamp (newest first)
  const sortedEntries = entries.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
  
  // Filter entries by action if filter is set
  const filteredEntries = filterAction === 'all' 
    ? sortedEntries 
    : sortedEntries.filter(entry => entry.action === filterAction)
  
  // Limit entries for initial display
  const displayEntries = showAllEntries 
    ? filteredEntries 
    : filteredEntries.slice(0, 10)
  
  // Get unique actions for filter dropdown
  const uniqueActions = Array.from(new Set(entries.map(entry => entry.action)))
  
  const formatActionText = (action: string, field?: string, oldValue?: string, newValue?: string) => {
    const actionText = action.replace(/_/g, ' ').toLowerCase()
    
    if (action === 'STATUS_CHANGED') {
      return `Changed status from ${oldValue} to ${newValue}`
    } else if (action === 'FUNDING_ADDED') {
      return `Added funding: ${newValue}`
    } else if (action === 'FUNDING_UPDATED') {
      return `Updated funding from ${oldValue} to ${newValue}`
    } else if (action === 'FUNDING_REMOVED') {
      return `Removed funding: ${oldValue}`
    } else if (action === 'UPDATED' && field) {
      if (oldValue && newValue) {
        return `Updated ${field} from "${oldValue}" to "${newValue}"`
      } else if (newValue) {
        return `Updated ${field} to "${newValue}"`
      } else if (oldValue) {
        return `Removed ${field} (was "${oldValue}")`
      } else {
        return `Updated ${field}`
      }
    } else {
      return actionText
    }
  }
  
  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)
    const diffInDays = diffInHours / 24
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } else if (diffInDays < 7) {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    }
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Trail</h3>
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>No audit trail entries available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Audit Trail ({filteredEntries.length} entries)
        </h3>
        
        {/* Action Filter */}
        {uniqueActions.length > 1 && (
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Filter:</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>
                  {action.replace(/_/g, ' ').toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {/* Audit Entries */}
      <div className="space-y-4">
        {displayEntries.map((entry) => {
          const actionColor = actionColors[entry.action as keyof typeof actionColors] || 'bg-gray-100 text-gray-800 border-gray-200'
          const actionIcon = actionIcons[entry.action as keyof typeof actionIcons] || actionIcons['UPDATED']
          
          return (
            <div key={entry.id} className="flex items-start space-x-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
              {/* Action Icon */}
              <div className={`flex-shrink-0 p-2 rounded-full border ${actionColor}`}>
                {actionIcon}
              </div>
              
              {/* Entry Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900">
                    {formatActionText(entry.action, entry.field, entry.oldValue, entry.newValue)}
                  </p>
                  <time className="text-xs text-gray-500 flex-shrink-0">
                    {formatTimestamp(entry.timestamp)}
                  </time>
                </div>
                
                <div className="flex items-center text-xs text-gray-500">
                  <span>by {entry.userEmail}</span>
                  <span className="mx-1">•</span>
                  <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Show More/Less Button */}
      {filteredEntries.length > 10 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAllEntries(!showAllEntries)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showAllEntries 
              ? 'Show less entries' 
              : `Show all ${filteredEntries.length} entries`
            }
          </button>
        </div>
      )}
      
      {filteredEntries.length === 0 && filterAction !== 'all' && (
        <div className="text-center py-8 text-gray-500">
          <p>No entries found for action: {filterAction.replace(/_/g, ' ').toLowerCase()}</p>
          <button
            onClick={() => setFilterAction('all')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
          >
            Show all entries
          </button>
        </div>
      )}
    </div>
  )
}