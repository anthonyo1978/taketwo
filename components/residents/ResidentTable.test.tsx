import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ResidentTable } from "./ResidentTable"

// Mock fetch
global.fetch = vi.fn()

const mockResidents = [
  {
    id: "R-2024-001",
    houseId: "H-2024-001",
    firstName: "John",
    lastName: "Doe",
    dateOfBirth: new Date("1990-01-01"),
    gender: "Male" as const,
    phone: "0412345678",
    email: "john.doe@example.com",
    ndisId: "12345678",
    photoBase64: undefined,
    notes: "Test resident",
    createdAt: new Date("2024-01-01"),
    createdBy: "admin",
    updatedAt: new Date("2024-01-01"),
    updatedBy: "admin",
  },
  {
    id: "R-2024-002",
    houseId: "H-2024-001",
    firstName: "Jane",
    lastName: "Smith",
    dateOfBirth: new Date("1985-06-15"),
    gender: "Female" as const,
    phone: "0487654321",
    email: "jane.smith@example.com",
    ndisId: "87654321",
    photoBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVR",
    notes: undefined,
    createdAt: new Date("2024-01-02"),
    createdBy: "admin",
    updatedAt: new Date("2024-01-02"),
    updatedBy: "admin",
  },
]

const mockProps = {
  houseId: "H-2024-001",
}

describe("ResidentTable", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows loading state initially", () => {
    vi.mocked(fetch).mockImplementationOnce(
      () => new Promise(() => {}) // Never resolves
    )
    
    render(<ResidentTable {...mockProps} />)
    
    expect(screen.getByText("Residents")).toBeInTheDocument()
    
    // Check for skeleton loading elements
    expect(screen.getAllByTestId(/loading-skeleton/)).toBeDefined()
  })

  it("renders residents table with data", async () => {
    const mockResponse = {
      success: true,
      data: mockResidents,
    }
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)
    
    render(<ResidentTable {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText("Residents (2)")).toBeInTheDocument()
    })
    
    // Check resident data is displayed
    expect(screen.getByText("John Doe")).toBeInTheDocument()
    expect(screen.getByText("Jane Smith")).toBeInTheDocument()
    expect(screen.getByText("R-2024-001")).toBeInTheDocument()
    expect(screen.getByText("R-2024-002")).toBeInTheDocument()
    expect(screen.getByText("Male")).toBeInTheDocument()
    expect(screen.getByText("Female")).toBeInTheDocument()
    expect(screen.getByText("0412345678")).toBeInTheDocument()
    expect(screen.getByText("0487654321")).toBeInTheDocument()
  })

  it("shows empty state when no residents", async () => {
    const mockResponse = {
      success: true,
      data: [],
    }
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)
    
    render(<ResidentTable {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText("No residents found")).toBeInTheDocument()
      expect(screen.getByText("This house doesn't have any residents yet.")).toBeInTheDocument()
    })
  })

  it("shows error state on API failure", async () => {
    const mockErrorResponse = {
      success: false,
      error: "Failed to load residents",
    }
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => mockErrorResponse,
    } as Response)
    
    render(<ResidentTable {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText("Failed to load residents")).toBeInTheDocument()
      expect(screen.getByText("Try Again")).toBeInTheDocument()
    })
  })

  it("shows error state on network failure", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"))
    
    render(<ResidentTable {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText("Network error. Please check your connection and try again.")).toBeInTheDocument()
      expect(screen.getByText("Try Again")).toBeInTheDocument()
    })
  })

  it("retries fetch when try again button is clicked", async () => {
    const user = userEvent.setup()
    
    // First call fails
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"))
    
    render(<ResidentTable {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText("Try Again")).toBeInTheDocument()
    })
    
    // Second call succeeds
    const mockResponse = { success: true, data: [] }
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)
    
    const retryButton = screen.getByText("Try Again")
    await user.click(retryButton)
    
    await waitFor(() => {
      expect(screen.getByText("No residents found")).toBeInTheDocument()
    })
    
    // Verify fetch was called again
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it("calculates age correctly", async () => {
    const today = new Date()
    const birthDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate())
    
    const mockResident = {
      ...mockResidents[0],
      dateOfBirth: birthDate,
    }
    
    const mockResponse = {
      success: true,
      data: [mockResident],
    }
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)
    
    render(<ResidentTable {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText("25")).toBeInTheDocument()
    })
  })

  it("displays photo when available", async () => {
    const mockResponse = {
      success: true,
      data: [mockResidents[1]], // Has photoBase64
    }
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)
    
    render(<ResidentTable {...mockProps} />)
    
    await waitFor(() => {
      const photoImg = screen.getByAltText("Jane Smith")
      expect(photoImg).toBeInTheDocument()
      expect(photoImg).toHaveAttribute("src", mockResidents[1].photoBase64)
    })
  })

  it("displays initials when no photo", async () => {
    const mockResponse = {
      success: true,
      data: [mockResidents[0]], // No photoBase64
    }
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)
    
    render(<ResidentTable {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText("JD")).toBeInTheDocument() // John Doe initials
    })
  })

  it("refreshes data when refreshTrigger changes", async () => {
    const mockResponse = { success: true, data: [] }
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response)
    
    const { rerender } = render(<ResidentTable {...mockProps} refreshTrigger={0} />)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1)
    })
    
    // Change refreshTrigger
    rerender(<ResidentTable {...mockProps} refreshTrigger={1} />)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })

  it("makes correct API call", async () => {
    const mockResponse = { success: true, data: [] }
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)
    
    render(<ResidentTable {...mockProps} />)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/houses/H-2024-001/residents")
    })
  })
})