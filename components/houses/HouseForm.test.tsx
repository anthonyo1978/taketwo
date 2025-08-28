import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { HouseForm } from './HouseForm'

describe('HouseForm', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all form fields', () => {
    render(<HouseForm onSubmit={mockOnSubmit} />)

    // Address fields
    expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/unit\/apartment/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/suburb\/city/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/postcode/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument()

    // Property fields
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/go-live date/i)).toBeInTheDocument()

    // Additional fields
    expect(screen.getByLabelText(/current resident/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()

    // Buttons
    expect(screen.getByRole('button', { name: /create house/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /clear form/i })).toBeInTheDocument()
  })

  it('should have default values', () => {
    render(<HouseForm onSubmit={mockOnSubmit} />)

    expect(screen.getByDisplayValue('AU')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Active')).toBeInTheDocument()
  })

  it('should show validation errors for required fields', async () => {
    const user = userEvent.setup()
    render(<HouseForm onSubmit={mockOnSubmit} />)

    const submitButton = screen.getByRole('button', { name: /create house/i })
    
    // Try to submit without filling required fields
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/address must be at least 3 characters/i)).toBeInTheDocument()
      expect(screen.getByText(/suburb\/city is required/i)).toBeInTheDocument()
    })

    // Should not call onSubmit with validation errors
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should validate postcode format', async () => {
    const user = userEvent.setup()
    render(<HouseForm onSubmit={mockOnSubmit} />)

    const postcodeInput = screen.getByLabelText(/postcode/i)
    
    // Enter invalid postcode
    await user.type(postcodeInput, '123')
    await user.tab() // Trigger validation

    await waitFor(() => {
      expect(screen.getByText(/postcode must be exactly 4 digits/i)).toBeInTheDocument()
    })
  })

  it('should accept valid 4-digit postcode', async () => {
    const user = userEvent.setup()
    render(<HouseForm onSubmit={mockOnSubmit} />)

    const postcodeInput = screen.getByLabelText(/postcode/i)
    
    // Enter valid postcode
    await user.type(postcodeInput, '2000')
    await user.tab()

    // Should not show error
    await waitFor(() => {
      expect(screen.queryByText(/postcode must be exactly 4 digits/i)).not.toBeInTheDocument()
    })
  })

  it('should populate Australian states in dropdown', () => {
    render(<HouseForm onSubmit={mockOnSubmit} />)

    const stateSelect = screen.getByLabelText(/state/i)
    const options = stateSelect.querySelectorAll('option')
    
    // Should have default option plus 8 Australian states
    expect(options).toHaveLength(9) // "Select State" + 8 states
    
    const stateValues = Array.from(options).slice(1).map(option => option.textContent)
    expect(stateValues).toEqual(['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'])
  })

  it('should populate status options in dropdown', () => {
    render(<HouseForm onSubmit={mockOnSubmit} />)

    const statusSelect = screen.getByLabelText(/status/i)
    const options = statusSelect.querySelectorAll('option')
    
    expect(options).toHaveLength(3)
    
    const statusValues = Array.from(options).map(option => option.textContent)
    expect(statusValues).toEqual(['Active', 'Vacant', 'Under maintenance'])
  })

  it('should submit valid form data', async () => {
    const user = userEvent.setup()
    const mockSubmitPromise = Promise.resolve()
    mockOnSubmit.mockReturnValue(mockSubmitPromise)
    
    render(<HouseForm onSubmit={mockOnSubmit} />)

    // Fill in required fields
    await user.type(screen.getByLabelText(/address line 1/i), '123 Main Street')
    await user.type(screen.getByLabelText(/suburb\/city/i), 'Sydney')
    await user.selectOptions(screen.getByLabelText(/state/i), 'NSW')
    await user.type(screen.getByLabelText(/postcode/i), '2000')
    await user.type(screen.getByLabelText(/go-live date/i), '2024-01-01')

    // Submit form
    await user.click(screen.getByRole('button', { name: /create house/i }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          address1: '123 Main Street',
          suburb: 'Sydney',
          state: 'NSW',
          postcode: '2000',
          country: 'AU',
          status: 'Active',
          goLiveDate: expect.any(Date)
        })
      )
    })
  })

  it('should include optional fields when provided', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockResolvedValue(undefined)
    
    render(<HouseForm onSubmit={mockOnSubmit} />)

    // Fill in all fields including optional ones
    await user.type(screen.getByLabelText(/address line 1/i), '123 Main Street')
    await user.type(screen.getByLabelText(/unit\/apartment/i), 'Apt 2B')
    await user.type(screen.getByLabelText(/suburb\/city/i), 'Sydney')
    await user.selectOptions(screen.getByLabelText(/state/i), 'NSW')
    await user.type(screen.getByLabelText(/postcode/i), '2000')
    await user.type(screen.getByLabelText(/go-live date/i), '2024-01-01')
    await user.type(screen.getByLabelText(/current resident/i), 'John Doe')
    await user.type(screen.getByLabelText(/notes/i), 'Test notes')

    await user.click(screen.getByRole('button', { name: /create house/i }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          address1: '123 Main Street',
          unit: 'Apt 2B',
          suburb: 'Sydney',
          state: 'NSW',
          postcode: '2000',
          resident: 'John Doe',
          notes: 'Test notes'
        })
      )
    })
  })

  it('should show loading state during submission', async () => {
    render(<HouseForm onSubmit={mockOnSubmit} isLoading={true} />)

    const submitButton = screen.getByRole('button', { name: /creating.../i })
    expect(submitButton).toBeDisabled()
    
    // All form fields should be disabled
    expect(screen.getByLabelText(/address line 1/i)).toBeDisabled()
    expect(screen.getByLabelText(/suburb\/city/i)).toBeDisabled()
    expect(screen.getByLabelText(/state/i)).toBeDisabled()
  })

  it('should clear form when clear button is clicked', async () => {
    const user = userEvent.setup()
    render(<HouseForm onSubmit={mockOnSubmit} />)

    // Fill in some fields
    await user.type(screen.getByLabelText(/address line 1/i), '123 Main Street')
    await user.type(screen.getByLabelText(/suburb\/city/i), 'Sydney')

    // Click clear button
    await user.click(screen.getByRole('button', { name: /clear form/i }))

    // Fields should be cleared (reset to defaults)
    expect(screen.getByLabelText(/address line 1/i)).toHaveValue('')
    expect(screen.getByLabelText(/suburb\/city/i)).toHaveValue('')
    expect(screen.getByLabelText(/country/i)).toHaveValue('AU') // Default value
    expect(screen.getByLabelText(/status/i)).toHaveValue('Active') // Default value
  })

  it('should have proper accessibility attributes', () => {
    render(<HouseForm onSubmit={mockOnSubmit} />)

    // Required fields should have aria-required
    const requiredFields = [
      screen.getByLabelText(/address line 1/i),
      screen.getByLabelText(/suburb\/city/i),
      screen.getByLabelText(/state/i),
      screen.getByLabelText(/postcode/i),
      screen.getByLabelText(/country/i),
      screen.getByLabelText(/status/i),
      screen.getByLabelText(/go-live date/i)
    ]

    requiredFields.forEach(field => {
      expect(field.closest('label')).toHaveTextContent('*')
    })
  })
})