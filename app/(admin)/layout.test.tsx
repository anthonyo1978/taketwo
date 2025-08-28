import { render, screen } from "@testing-library/react"
import { usePathname } from "next/navigation"

import AdminLayout from "./layout"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}))

// Mock AdminSidebar component
jest.mock("components/admin/AdminSidebar", () => ({
  AdminSidebar: () => <div data-testid="admin-sidebar">Mock AdminSidebar</div>
}))

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe("AdminLayout", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/dashboard")
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("renders admin sidebar and main content area", () => {
    const TestChild = () => <div data-testid="test-content">Test Content</div>
    
    render(
      <AdminLayout>
        <TestChild />
      </AdminLayout>
    )

    // Should render the sidebar
    expect(screen.getByTestId("admin-sidebar")).toBeInTheDocument()
    
    // Should render the children in main content area
    expect(screen.getByTestId("test-content")).toBeInTheDocument()
  })

  it("has proper layout structure with flex and full height", () => {
    const TestChild = () => <div>Test Content</div>
    
    const { container } = render(
      <AdminLayout>
        <TestChild />
      </AdminLayout>
    )

    const layoutContainer = container.firstChild as HTMLElement
    expect(layoutContainer).toHaveClass("flex", "h-screen", "bg-gray-50")
  })

  it("has main content area with proper classes", () => {
    const TestChild = () => <div data-testid="test-content">Test Content</div>
    
    render(
      <AdminLayout>
        <TestChild />
      </AdminLayout>
    )

    const mainElement = screen.getByRole("main")
    expect(mainElement).toBeInTheDocument()
    expect(mainElement).toHaveClass("flex-1", "overflow-auto")
  })

  it("renders children inside main content wrapper", () => {
    const TestChild = () => <div data-testid="test-content">Test Content</div>
    
    render(
      <AdminLayout>
        <TestChild />
      </AdminLayout>
    )

    const mainElement = screen.getByRole("main")
    const contentWrapper = mainElement.querySelector("div")
    
    expect(contentWrapper).toHaveClass("h-full")
    expect(screen.getByTestId("test-content")).toBeInTheDocument()
  })

  it("accepts and renders multiple children", () => {
    render(
      <AdminLayout>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </AdminLayout>
    )

    expect(screen.getByTestId("child-1")).toBeInTheDocument()
    expect(screen.getByTestId("child-2")).toBeInTheDocument()
  })
})