import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FundingInformation } from 'types/resident'
import { FundingManager } from './FundingManager'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

const mockFundingInfo: FundingInformation[] = [
  {
    id: 'F001',
    type: 'NDIS',
    amount: 1500,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    description: 'NDIS support package',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'F002',
    type: 'Family',
    amount: 500,
    startDate: new Date('2023-06-01'),
    description: 'Family contribution',
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

describe('FundingManager', () => {
  const mockOnFundingChange = vi.fn()
  const residentId = 'R001'
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays funding summary correctly', () => {
    render(
      <FundingManager 
        residentId={residentId}
        fundingInfo={mockFundingInfo}
        onFundingChange={mockOnFundingChange}
      />
    )
    
    expect(screen.getByText('$1,500')).toBeInTheDocument() // Active funding
    expect(screen.getByText('$500')).toBeInTheDocument() // Inactive funding
    expect(screen.getByText('Active Funding')).toBeInTheDocument()
    expect(screen.getByText('Inactive Funding')).toBeInTheDocument()
  })

  it('displays funding information correctly', () => {
    render(
      <FundingManager 
        residentId={residentId}
        fundingInfo={mockFundingInfo}
        onFundingChange={mockOnFundingChange}
      />
    )
    
    expect(screen.getByText('NDIS')).toBeInTheDocument()
    expect(screen.getByText('Family')).toBeInTheDocument()
    expect(screen.getByText('NDIS support package')).toBeInTheDocument()
    expect(screen.getByText('Family contribution')).toBeInTheDocument()
    expect(screen.getAllByText('Active')).toHaveLength(2) // One for NDIS, one for "Active Funding"
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('opens add funding form when Add Funding is clicked', async () => {
    const user = userEvent.setup()
    render(
      <FundingManager 
        residentId={residentId}
        fundingInfo={[]}
        onFundingChange={mockOnFundingChange}
      />
    )
    
    await user.click(screen.getByText('Add First Funding'))
    
    await waitFor(() => {
      expect(screen.getByText('Add Funding Information')).toBeInTheDocument()
    })
    
    expect(screen.getByLabelText(/Funding Type/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Amount/)).toBeInTheDocument()
  })

  it('submits new funding information successfully', async () => {
    const user = userEvent.setup()
    const newFunding = {
      id: 'F003',
      type: 'Government',
      amount: 800,
      startDate: new Date('2024-02-01'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: newFunding
      })
    })
    
    render(
      <FundingManager 
        residentId={residentId}
        fundingInfo={[]}
        onFundingChange={mockOnFundingChange}
      />
    )
    
    await user.click(screen.getByText('Add First Funding'))
    
    // Fill form
    await user.selectOptions(screen.getByLabelText(/Funding Type/), 'Government')
    await user.type(screen.getByLabelText(/Amount/), '800')
    await user.type(screen.getByLabelText(/Start Date/), '2024-02-01')
    
    // Submit
    await user.click(screen.getByRole('button', { name: /Add Funding/i }))
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/residents/R001/funding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'Government',
          amount: 800,
          startDate: new Date('2024-02-01'),
          endDate: undefined,
          description: '',
          isActive: true
        })
      })
    })
    
    expect(mockOnFundingChange).toHaveBeenCalledWith([newFunding])
  })

  it('opens edit form when Edit is clicked', async () => {
    const user = userEvent.setup()
    render(
      <FundingManager 
        residentId={residentId}
        fundingInfo={mockFundingInfo}
        onFundingChange={mockOnFundingChange}
      />
    )
    
    // Click edit on first funding item
    const editButtons = screen.getAllByText('Edit')
    await user.click(editButtons[0])
    
    await waitFor(() => {
      expect(screen.getByText('Edit Funding Information')).toBeInTheDocument()
    })
    
    // Form should be pre-populated
    expect(screen.getByDisplayValue('1500')).toBeInTheDocument()
    expect(screen.getByDisplayValue('NDIS support package')).toBeInTheDocument()
  })

  it('updates existing funding information', async () => {
    const user = userEvent.setup()
    const updatedFunding = { ...mockFundingInfo[0], amount: 1800 }
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: updatedFunding
      })
    })
    
    render(
      <FundingManager 
        residentId={residentId}
        fundingInfo={mockFundingInfo}
        onFundingChange={mockOnFundingChange}
      />
    )
    
    // Click edit on first funding item
    const editButtons = screen.getAllByText('Edit')
    await user.click(editButtons[0])
    
    // Update amount
    const amountInput = screen.getByDisplayValue('1500')
    await user.clear(amountInput)
    await user.type(amountInput, '1800')
    
    // Submit
    await user.click(screen.getByRole('button', { name: /Update Funding/i }))
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/residents/R001/funding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fundingId: 'F001',
          type: 'NDIS',
          amount: 1800,
          startDate: mockFundingInfo[0].startDate,
          endDate: mockFundingInfo[0].endDate,
          description: 'NDIS support package',
          isActive: true
        })
      })
    })
  })

  it('removes funding with confirmation', async () => {
    const user = userEvent.setup()
    
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [mockFundingInfo[1]] // Remove first funding
      })
    })
    
    render(
      <FundingManager 
        residentId={residentId}
        fundingInfo={mockFundingInfo}
        onFundingChange={mockOnFundingChange}
      />
    )
    
    // Click remove on first funding item
    const removeButtons = screen.getAllByText('Remove')
    await user.click(removeButtons[0])
    
    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to remove this funding information?')
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/residents/R001/funding?fundingId=F001', {
        method: 'DELETE'
      })
    })
    
    confirmSpy.mockRestore()
  })

  it('displays empty state when no funding exists', () => {
    render(
      <FundingManager 
        residentId={residentId}
        fundingInfo={[]}
        onFundingChange={mockOnFundingChange}
      />
    )
    
    expect(screen.getByText('No funding information')).toBeInTheDocument()
    expect(screen.getByText('Add funding information to track financial support for this resident.')).toBeInTheDocument()
    expect(screen.getByText('Add First Funding')).toBeInTheDocument()
  })

  it('validates form inputs', async () => {
    const user = userEvent.setup()
    render(
      <FundingManager 
        residentId={residentId}
        fundingInfo={[]}
        onFundingChange={mockOnFundingChange}
      />
    )
    
    await user.click(screen.getByText('Add First Funding'))
    
    // Try to submit without required fields
    await user.click(screen.getByRole('button', { name: /Add Funding/i }))
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/Funding amount must be positive/)).toBeInTheDocument()
    })
  })

  it('displays error message on API failure', async () => {
    const user = userEvent.setup()
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Failed to add funding information'
      })
    })
    
    render(
      <FundingManager 
        residentId={residentId}
        fundingInfo={[]}
        onFundingChange={mockOnFundingChange}
      />
    )
    
    await user.click(screen.getByText('Add First Funding'))
    
    // Fill and submit form
    await user.selectOptions(screen.getByLabelText(/Funding Type/), 'NDIS')
    await user.type(screen.getByLabelText(/Amount/), '1000')
    await user.click(screen.getByRole('button', { name: /Add Funding/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Failed to add funding information')).toBeInTheDocument()
    })
  })

  it('calculates funding totals correctly', () => {
    const mixedFunding: FundingInformation[] = [
      { ...mockFundingInfo[0], amount: 1000, isActive: true },
      { ...mockFundingInfo[0], amount: 500, isActive: true, id: 'F2' },
      { ...mockFundingInfo[0], amount: 200, isActive: false, id: 'F3' },
      { ...mockFundingInfo[0], amount: 300, isActive: false, id: 'F4' }
    ]
    
    render(
      <FundingManager 
        residentId={residentId}
        fundingInfo={mixedFunding}
        onFundingChange={mockOnFundingChange}
      />
    )
    
    expect(screen.getByText('$1,500')).toBeInTheDocument() // Active total
    expect(screen.getByText('$500')).toBeInTheDocument() // Inactive total
  })
})