"use client"

import * as Tooltip from "@radix-ui/react-tooltip"
import { cva, type VariantProps } from "class-variance-authority"
import { LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { twMerge } from "tailwind-merge"

const navItem = cva(
  [
    "flex",
    "items-center",
    "gap-3",
    "px-3",
    "py-2",
    "rounded-lg",
    "text-sm",
    "font-medium",
    "transition-colors",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-blue-500",
    "focus-visible:ring-offset-2",
    "focus-visible:ring-offset-white",
  ],
  {
    variants: {
      active: {
        true: ["bg-blue-600", "text-white"],
        false: ["text-gray-700", "hover:bg-gray-100", "hover:text-gray-900"],
      },
      collapsed: {
        true: ["justify-center", "px-2"],
        false: [],
      },
    },
    defaultVariants: {
      active: false,
      collapsed: false,
    },
  }
)

export interface NavItemProps extends VariantProps<typeof navItem> {
  href: string
  icon: LucideIcon
  label: string
  collapsed?: boolean
  exactMatch?: boolean
  className?: string
}

export function NavItem({ 
  href, 
  icon: Icon, 
  label, 
  collapsed = false, 
  exactMatch = false,
  className 
}: NavItemProps) {
  const pathname = usePathname()
  
  // Determine if this nav item is active based on current route
  const isActive = exactMatch 
    ? pathname === href 
    : pathname.startsWith(href)

  const content = (
    <Link
      href={href}
      className={twMerge(navItem({ active: isActive, collapsed }), className)}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon 
        className="size-5 shrink-0" 
        aria-hidden="true"
      />
      {!collapsed && (
        <span className="truncate">{label}</span>
      )}
    </Link>
  )

  // In collapsed mode, wrap with tooltip
  if (collapsed) {
    return (
      <Tooltip.Root delayDuration={300}>
        <Tooltip.Trigger asChild>
          {content}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={8}
            className="z-50 rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow-md animate-in fade-in-0 zoom-in-95"
          >
            {label}
            <Tooltip.Arrow className="fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    )
  }

  return content
}