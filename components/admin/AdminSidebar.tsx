"use client"

import * as Tooltip from "@radix-ui/react-tooltip"
import { 
  ChevronLeft,
  CreditCard, 
  FileCheck,
  FileText, 
  Home, 
  LayoutDashboard, 
  Settings, 
  User,
  Users
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

import { Button } from "components/Button/Button"
import { NavItem } from "./NavItem"

const NAVIGATION_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    exactMatch: true,
  },
  {
    label: "Houses",
    href: "/houses",
    icon: Home,
  },
  {
    label: "Residents",
    href: "/residents",
    icon: Users,
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: CreditCard,
  },
  {
    label: "Claims",
    href: "/claims",
    icon: FileCheck,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: FileText,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
] as const

const STORAGE_KEY = "admin-sidebar-collapsed"

export interface AdminSidebarProps {
  className?: string
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load collapsed state from localStorage on client-side
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setIsCollapsed(JSON.parse(stored))
    }
  }, [])

  // Save collapsed state to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(isCollapsed))
    }
  }, [isCollapsed, mounted])

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed)
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <aside className={`bg-white border-r border-gray-200 ${isCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 ${className || ''}`}>
        <div className="h-full flex flex-col">
          {/* Skeleton placeholder */}
          <div className="p-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </aside>
    )
  }

  return (
    <Tooltip.Provider>
      <aside className={`bg-white border-r border-gray-200 ${isCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 ${className || ''}`}>
        <div className="h-full flex flex-col">
          {/* Header with logo/title */}
          <div className="p-4 border-b border-gray-200">
            <Link 
              href="/dashboard"
              className="flex items-center gap-3 font-semibold text-gray-900 hover:text-blue-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
            >
              <div className="size-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              {!isCollapsed && (
                <span className="text-xl">Admin Panel</span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav 
            className="flex-1 p-4 space-y-2" 
            aria-label="Primary navigation"
          >
            {NAVIGATION_ITEMS.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                collapsed={isCollapsed}
                exactMatch={item.exactMatch}
              />
            ))}
          </nav>

          {/* Footer with collapse button and user menu */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            {/* Collapse toggle button */}
            <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-end'}`}>
              <Button
                type="button"
                onClick={toggleCollapsed}
                className={`p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  isCollapsed ? 'w-8 h-8' : ''
                }`}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <ChevronLeft 
                  className={`size-4 transition-transform ${
                    isCollapsed ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </Button>
            </div>

            {/* User menu placeholder */}
            <div className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}>
              <div className="size-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="size-4 text-gray-600" aria-hidden="true" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    Admin User
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    admin@example.com
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </Tooltip.Provider>
  )
}