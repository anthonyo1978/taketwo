import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { usePathname } from "next/navigation"

import { AdminSidebar } from "./AdminSidebar"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}))

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    clear: jest.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe("AdminSidebar", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/dashboard")
    mockLocalStorage.clear()
    jest.clearAllMocks()
  })

  it("renders all navigation items", async () => {
    render(<AdminSidebar />)
    
    // Wait for component to mount
    await waitFor(() => {
      expect(screen.getByText("Admin Panel")).toBeInTheDocument()
    })
    
    // Check all navigation items are present
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /houses/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /billing/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /reports/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /settings/i })).toBeInTheDocument()
  })

  it("renders logo/title with link to dashboard", async () => {
    render(<AdminSidebar />)
    
    await waitFor(() => {
      const logoLink = screen.getByRole("link", { name: /admin panel/i })
      expect(logoLink).toBeInTheDocument()
      expect(logoLink).toHaveAttribute("href", "/dashboard")
    })
  })

  it("shows collapse/expand button", async () => {
    render(<AdminSidebar />)
    
    await waitFor(() => {
      const collapseButton = screen.getByRole("button", { name: /collapse sidebar/i })
      expect(collapseButton).toBeInTheDocument()
    })
  })

  it("toggles collapsed state when collapse button is clicked", async () => {
    render(<AdminSidebar />)
    
    await waitFor(() => {
      expect(screen.getByText("Admin Panel")).toBeInTheDocument()
    })
    
    const collapseButton = screen.getByRole("button", { name: /collapse sidebar/i })
    
    // Click to collapse
    fireEvent.click(collapseButton)
    
    await waitFor(() => {
      expect(screen.queryByText("Admin Panel")).not.toBeInTheDocument()
      expect(screen.getByRole("button", { name: /expand sidebar/i })).toBeInTheDocument()
    })
    
    // Click to expand
    const expandButton = screen.getByRole("button", { name: /expand sidebar/i })
    fireEvent.click(expandButton)
    
    await waitFor(() => {
      expect(screen.getByText("Admin Panel")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /collapse sidebar/i })).toBeInTheDocument()
    })
  })

  it("persists collapsed state to localStorage", async () => {
    render(<AdminSidebar />)
    
    await waitFor(() => {
      expect(screen.getByText("Admin Panel")).toBeInTheDocument()
    })
    
    const collapseButton = screen.getByRole("button", { name: /collapse sidebar/i })
    fireEvent.click(collapseButton)
    
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("admin-sidebar-collapsed", "true")
    })
  })

  it("loads collapsed state from localStorage on mount", async () => {
    // Set localStorage to collapsed state
    mockLocalStorage.getItem.mockReturnValue("true")
    
    render(<AdminSidebar />)
    
    await waitFor(() => {
      expect(screen.queryByText("Admin Panel")).not.toBeInTheDocument()
      expect(screen.getByRole("button", { name: /expand sidebar/i })).toBeInTheDocument()
    })
  })

  it("has proper navigation landmarks and aria labels", async () => {
    render(<AdminSidebar />)
    
    await waitFor(() => {
      const nav = screen.getByRole("navigation", { name: /primary navigation/i })
      expect(nav).toBeInTheDocument()
    })
  })

  it("shows user menu placeholder", async () => {
    render(<AdminSidebar />)
    
    await waitFor(() => {
      expect(screen.getByText("Admin User")).toBeInTheDocument()
      expect(screen.getByText("admin@example.com")).toBeInTheDocument()
    })
  })

  it("applies custom className", async () => {
    const { container } = render(<AdminSidebar className="custom-test-class" />)
    
    await waitFor(() => {
      const sidebar = container.firstChild as HTMLElement
      expect(sidebar).toHaveClass("custom-test-class")
    })
  })

  it("shows skeleton placeholder before mounting", () => {
    // Mock mounted state as false by not waiting
    const { container } = render(<AdminSidebar />)
    
    // Should show skeleton initially
    const skeleton = container.querySelector(".animate-pulse")
    expect(skeleton).toBeInTheDocument()
  })

  it("changes width classes based on collapsed state", async () => {
    const { container } = render(<AdminSidebar />)
    
    await waitFor(() => {
      const sidebar = container.firstChild as HTMLElement
      expect(sidebar).toHaveClass("w-64")
    })
    
    const collapseButton = screen.getByRole("button", { name: /collapse sidebar/i })
    fireEvent.click(collapseButton)
    
    await waitFor(() => {
      const sidebar = container.firstChild as HTMLElement
      expect(sidebar).toHaveClass("w-16")
    })
  })
})