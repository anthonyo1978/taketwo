"use client"

import { useState } from "react"

import { GlobalResidentTable } from "components/residents/GlobalResidentTable"
import { ResidentForm } from "components/residents/ResidentForm"
import type { Resident } from "types/resident"

export default function ResidentsPage() {
  const [showResidentForm, setShowResidentForm] = useState(false)
  const [residentRefreshTrigger, setResidentRefreshTrigger] = useState(0)

  const handleResidentAdded = (_newResident: Resident) => {
    // Trigger refresh of resident table
    setResidentRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Residents</h1>
            <p className="text-gray-600 mt-1">Manage residents across all houses</p>
          </div>
          <button
            onClick={() => setShowResidentForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Resident
          </button>
        </div>

        {/* Global Residents Table */}
        <GlobalResidentTable refreshTrigger={residentRefreshTrigger} />

        {/* Resident Form Modal */}
        <ResidentForm
          mode="standalone"
          open={showResidentForm}
          onClose={() => setShowResidentForm(false)}
          onSuccess={handleResidentAdded}
        />
      </div>
    </div>
  )
}