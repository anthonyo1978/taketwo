"use client"

import { useState } from "react"

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
  content: React.ReactNode
}

interface TabsProps {
  items: TabItem[]
  defaultTab?: string
  className?: string
}

export function Tabs({ items, defaultTab, className = "" }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id)

  const activeContent = items.find(item => item.id === activeTab)?.content

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-gray-50 px-6">
        <nav className="flex space-x-0" aria-label="Tabs">
          {items.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-6 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                {tab.icon && <span className="text-base">{tab.icon}</span>}
                <span className="font-semibold">{tab.label}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="p-6">
        {activeContent}
      </div>
    </div>
  )
}