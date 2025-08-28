import { render, screen } from "@testing-library/react"

import { Home } from "lucide-react"
import { usePathname } from "next/navigation"

import { NavItem } from "./NavItem"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}))

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe("NavItem", () => {
  const defaultProps = {
    href: "/houses",
    icon: Home,
    label: "Houses",
  }

  beforeEach(() => {
    mockUsePathname.mockReturnValue("/dashboard")
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("renders navigation item with icon and label", () => {
    render(<NavItem {...defaultProps} />)
    
    const link = screen.getByRole("link", { name: /houses/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "/houses")
    
    // Icon should be present (aria-hidden)
    const icon = screen.getByTestId("lucide-home") || screen.getByRole("img", { hidden: true })
    expect(icon).toBeInTheDocument()
    
    // Label should be visible
    expect(screen.getByText("Houses")).toBeInTheDocument()
  })

  it("shows active state when current path matches href", () => {
    mockUsePathname.mockReturnValue("/houses")
    
    render(<NavItem {...defaultProps} />)
    
    const link = screen.getByRole("link", { name: /houses/i })
    expect(link).toHaveAttribute("aria-current", "page")
    expect(link).toHaveClass("bg-blue-600", "text-white")
  })

  it("shows active state when current path starts with href (non-exact match)", () => {
    mockUsePathname.mockReturnValue("/houses/123")
    
    render(<NavItem {...defaultProps} />)
    
    const link = screen.getByRole("link", { name: /houses/i })
    expect(link).toHaveAttribute("aria-current", "page")
  })

  it("does not show active state when exactMatch is true and paths don't exactly match", () => {
    mockUsePathname.mockReturnValue("/dashboard/settings")
    
    render(
      <NavItem 
        {...defaultProps} 
        href="/dashboard" 
        label="Dashboard"
        exactMatch={true}
      />
    )
    
    const link = screen.getByRole("link", { name: /dashboard/i })
    expect(link).not.toHaveAttribute("aria-current", "page")
    expect(link).toHaveClass("text-gray-700")
  })

  it("shows active state when exactMatch is true and paths exactly match", () => {
    mockUsePathname.mockReturnValue("/dashboard")
    
    render(
      <NavItem 
        {...defaultProps} 
        href="/dashboard" 
        label="Dashboard"
        exactMatch={true}
      />
    )
    
    const link = screen.getByRole("link", { name: /dashboard/i })
    expect(link).toHaveAttribute("aria-current", "page")
    expect(link).toHaveClass("bg-blue-600", "text-white")
  })

  it("renders in collapsed mode with tooltip", () => {
    render(<NavItem {...defaultProps} collapsed={true} />)
    
    const link = screen.getByRole("link", { name: /houses/i })
    expect(link).toHaveClass("justify-center", "px-2")
    
    // Label should not be visible in collapsed mode
    expect(screen.queryByText("Houses")).not.toBeInTheDocument()
    
    // Tooltip content should be present but not visible initially
    // This is handled by Radix UI Tooltip which requires user interaction
  })

  it("applies custom className", () => {
    render(<NavItem {...defaultProps} className="custom-class" />)
    
    const link = screen.getByRole("link", { name: /houses/i })
    expect(link).toHaveClass("custom-class")
  })

  it("has proper focus styles", () => {
    render(<NavItem {...defaultProps} />)
    
    const link = screen.getByRole("link", { name: /houses/i })
    expect(link).toHaveClass(
      "focus-visible:outline-none",
      "focus-visible:ring-2", 
      "focus-visible:ring-blue-500",
      "focus-visible:ring-offset-2"
    )
  })
})