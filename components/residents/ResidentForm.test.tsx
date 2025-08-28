import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ResidentForm } from "./ResidentForm"

// Mock fetch
global.fetch = vi.fn()

const mockProps = {
  houseId: "H-2024-001",
  open: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
}

describe("ResidentForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders form when open", () => {
    render(<ResidentForm {...mockProps} />)
    
    expect(screen.getByText("Add New Resident")).toBeInTheDocument()
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/gender/i)).toBeInTheDocument()
  })

  it("does not render form when closed", () => {
    render(<ResidentForm {...mockProps} open={false} />)
    
    expect(screen.queryByText("Add New Resident")).not.toBeInTheDocument()
  })

  it("validates required fields", async () => {
    const user = userEvent.setup()
    render(<ResidentForm {...mockProps} />)
    
    const submitButton = screen.getByText("Add Resident")
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText("First name is required")).toBeInTheDocument()
      expect(screen.getByText("Last name is required")).toBeInTheDocument()
    })
  })

  it("validates phone number format", async () => {
    const user = userEvent.setup()
    render(<ResidentForm {...mockProps} />)
    
    const phoneInput = screen.getByLabelText(/phone number/i)
    await user.type(phoneInput, "invalid-phone")
    
    const submitButton = screen.getByText("Add Resident")
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText("Please enter a valid Australian phone number")).toBeInTheDocument()
    })
  })

  it("validates email format", async () => {
    const user = userEvent.setup()
    render(<ResidentForm {...mockProps} />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    await user.type(emailInput, "invalid-email")
    
    const submitButton = screen.getByText("Add Resident")
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument()
    })
  })

  it("validates NDIS ID length", async () => {
    const user = userEvent.setup()
    render(<ResidentForm {...mockProps} />)
    
    const ndisInput = screen.getByLabelText(/ndis participant id/i)
    await user.type(ndisInput, "123") // Too short
    
    const submitButton = screen.getByText("Add Resident")
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText("NDIS ID must be at least 8 characters")).toBeInTheDocument()
    })
  })

  it("submits form with valid data", async () => {
    const user = userEvent.setup()
    const mockResponse = {
      success: true,
      data: { id: "R-2024-001", firstName: "John", lastName: "Doe" }
    }
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)
    
    render(<ResidentForm {...mockProps} />)
    
    // Fill required fields
    await user.type(screen.getByLabelText(/first name/i), "John")
    await user.type(screen.getByLabelText(/last name/i), "Doe")
    await user.type(screen.getByLabelText(/date of birth/i), "1990-01-01")
    await user.selectOptions(screen.getByLabelText(/gender/i), "Male")
    
    const submitButton = screen.getByText("Add Resident")
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/houses/H-2024-001/residents",
        expect.objectContaining({
          method: "POST",
          body: expect.any(FormData),
        })
      )
    })
    
    await waitFor(() => {
      expect(mockProps.onSuccess).toHaveBeenCalledWith(mockResponse.data)
      expect(mockProps.onClose).toHaveBeenCalled()
    })
  })

  it("handles API error", async () => {
    const user = userEvent.setup()
    const mockErrorResponse = {
      success: false,
      error: "Validation failed"
    }
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => mockErrorResponse,
    } as Response)
    
    render(<ResidentForm {...mockProps} />)
    
    // Fill required fields
    await user.type(screen.getByLabelText(/first name/i), "John")
    await user.type(screen.getByLabelText(/last name/i), "Doe")
    await user.type(screen.getByLabelText(/date of birth/i), "1990-01-01")
    
    const submitButton = screen.getByText("Add Resident")
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText("Validation failed")).toBeInTheDocument()
    })
  })

  it("handles network error", async () => {
    const user = userEvent.setup()
    
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"))
    
    render(<ResidentForm {...mockProps} />)
    
    // Fill required fields
    await user.type(screen.getByLabelText(/first name/i), "John")
    await user.type(screen.getByLabelText(/last name/i), "Doe")
    await user.type(screen.getByLabelText(/date of birth/i), "1990-01-01")
    
    const submitButton = screen.getByText("Add Resident")
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText("Network error. Please try again.")).toBeInTheDocument()
    })
  })

  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup()
    render(<ResidentForm {...mockProps} />)
    
    const cancelButton = screen.getByText("Cancel")
    await user.click(cancelButton)
    
    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it("disables form during submission", async () => {
    const user = userEvent.setup()
    
    // Mock a delayed response
    vi.mocked(fetch).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true, data: {} })
      } as Response), 100))
    )
    
    render(<ResidentForm {...mockProps} />)
    
    // Fill required fields
    await user.type(screen.getByLabelText(/first name/i), "John")
    await user.type(screen.getByLabelText(/last name/i), "Doe")
    await user.type(screen.getByLabelText(/date of birth/i), "1990-01-01")
    
    const submitButton = screen.getByText("Add Resident")
    await user.click(submitButton)
    
    // Check that button shows loading state
    expect(screen.getByText("Adding...")).toBeInTheDocument()
    
    // Check that inputs are disabled
    expect(screen.getByLabelText(/first name/i)).toBeDisabled()
    expect(screen.getByLabelText(/last name/i)).toBeDisabled()
  })
})

describe("ResidentForm - Standalone Mode", () => {
  const mockHouses = [
    {
      id: "H-2024-001",
      name: "Sunshine Villa",
      address: "123 Main St, Melbourne, VIC 3000",
      address1: "123 Main St",
      suburb: "Melbourne", 
      state: "VIC",
      postcode: "3000",
      createdAt: new Date(),
      createdBy: "admin",
      updatedAt: new Date(),
      updatedBy: "admin",
    },
    {
      id: "H-2024-002",
      name: "Harbor View", 
      address: "456 Ocean Rd, Sydney, NSW 2000",
      address1: "456 Ocean Rd",
      suburb: "Sydney",
      state: "NSW", 
      postcode: "2000",
      createdAt: new Date(),
      createdBy: "admin",
      updatedAt: new Date(),
      updatedBy: "admin",
    },
  ]

  const standaloneProps = {
    mode: "standalone" as const,
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders house selection in standalone mode", async () => {
    // Mock houses API call
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockHouses }),
    } as Response)

    render(<ResidentForm {...standaloneProps} />)

    // Should show house selection section
    await waitFor(() => {
      expect(screen.getByText("House Assignment")).toBeInTheDocument()
      expect(screen.getByText("Select House")).toBeInTheDocument()
      expect(screen.getByText("Choose a house...")).toBeInTheDocument()
    })

    // Should fetch houses
    expect(fetch).toHaveBeenCalledWith("/api/houses")

    // Should show house options once loaded
    await waitFor(() => {
      expect(screen.getByText("Sunshine Villa - 123 Main St, Melbourne, VIC 3000")).toBeInTheDocument()
      expect(screen.getByText("Harbor View - 456 Ocean Rd, Sydney, NSW 2000")).toBeInTheDocument()
    })
  })

  it("does not show house selection in house-context mode", () => {
    render(<ResidentForm {...mockProps} />)

    expect(screen.queryByText("House Assignment")).not.toBeInTheDocument()
    expect(screen.queryByText("Select House")).not.toBeInTheDocument()
  })

  it("validates house selection is required in standalone mode", async () => {
    const user = userEvent.setup()

    // Mock houses API call
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockHouses }),
    } as Response)

    render(<ResidentForm {...standaloneProps} />)

    // Wait for houses to load
    await waitFor(() => {
      expect(screen.getByText("Choose a house...")).toBeInTheDocument()
    })

    // Fill required fields but don't select house
    await user.type(screen.getByLabelText(/first name/i), "Test")
    await user.type(screen.getByLabelText(/last name/i), "User")
    await user.type(screen.getByLabelText(/date of birth/i), "1990-01-01")
    await user.selectOptions(screen.getByLabelText(/gender/i), "Male")

    const submitButton = screen.getByText("Add Resident")
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText("Please select a house")).toBeInTheDocument()
    })

    // Should not make API call for resident creation
    expect(fetch).toHaveBeenCalledTimes(1) // Only houses fetch
  })

  it("submits form with selected house in standalone mode", async () => {
    const user = userEvent.setup()

    // Mock houses API call then resident creation
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockHouses }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { id: "R-2024-001", firstName: "Jane", lastName: "Smith" }
        }),
      } as Response)

    render(<ResidentForm {...standaloneProps} />)

    // Wait for houses to load and select one
    await waitFor(() => {
      expect(screen.getByText("Sunshine Villa - 123 Main St, Melbourne, VIC 3000")).toBeInTheDocument()
    })

    const houseSelect = screen.getByLabelText(/select house/i)
    await user.selectOptions(houseSelect, "H-2024-001")

    // Fill required fields
    await user.type(screen.getByLabelText(/first name/i), "Jane")
    await user.type(screen.getByLabelText(/last name/i), "Smith")
    await user.type(screen.getByLabelText(/date of birth/i), "1985-06-15")
    await user.selectOptions(screen.getByLabelText(/gender/i), "Female")

    const submitButton = screen.getByText("Add Resident")
    await user.click(submitButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/residents",
        expect.objectContaining({
          method: "POST",
          body: expect.any(FormData),
        })
      )
    })

    await waitFor(() => {
      expect(standaloneProps.onSuccess).toHaveBeenCalled()
      expect(standaloneProps.onClose).toHaveBeenCalled()
    })
  })

  it("handles house fetch error gracefully", async () => {
    // Mock houses API failure
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Failed to fetch houses"))

    render(<ResidentForm {...standaloneProps} />)

    // House selection should still render but be empty
    await waitFor(() => {
      expect(screen.getByText("House Assignment")).toBeInTheDocument()
      expect(screen.getByText("Choose a house...")).toBeInTheDocument()
    })

    // Should not show any house options
    expect(screen.queryByText("Sunshine Villa")).not.toBeInTheDocument()
  })
})