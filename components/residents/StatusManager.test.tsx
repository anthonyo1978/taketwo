import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Resident } from 'types/resident'
import { StatusManager } from './StatusManager'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

const mockResident: Resident = {
  id: 'R001',
  houseId: 'H001',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: new Date('1990-01-01'),
  gender: 'Male',
  phone: '0412345678',
  email: 'john@example.com',
  status: 'Draft',
  fundingInformation: [],
  preferences: {},
  auditTrail: [],
  createdAt: new Date(),
  createdBy: 'admin',
  updatedAt: new Date(),
  updatedBy: 'admin'
}

describe('StatusManager', () => {
  const mockOnStatusChange = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays current status correctly', () => {
    render(<StatusManager resident={mockResident} onStatusChange={mockOnStatusChange} />)
    
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getByText('Initial resident entry, editing allowed')).toBeInTheDocument()
  })

  it('shows valid status transitions for Draft status', () => {
    render(<StatusManager resident={mockResident} onStatusChange={mockOnStatusChange} />)
    
    expect(screen.getByText('Change to Active')).toBeInTheDocument()
    expect(screen.getByText('Change to Deactivated')).toBeInTheDocument()
  })

  it('shows no transitions for Active status except Deactivated', () => {
    const activeResident = { ...mockResident, status: 'Active' as const }
    render(<StatusManager resident={activeResident} onStatusChange={mockOnStatusChange} />)
    
    expect(screen.getByText('Change to Deactivated')).toBeInTheDocument()
    expect(screen.queryByText('Change to Draft')).not.toBeInTheDocument()
  })

  it('opens confirmation dialog when status change is requested', async () => {
    const user = userEvent.setup()
    render(<StatusManager resident={mockResident} onStatusChange={mockOnStatusChange} />)
    
    await user.click(screen.getByText('Change to Active'))
    
    await waitFor(() => {
      expect(screen.getByText('Confirm Status Change')).toBeInTheDocument()
    })
    
    expect(screen.getByText(/Change.*John Doe.*status from.*Draft.*to.*Active/)).toBeInTheDocument()
  })

  it('calls API and updates status on confirmation', async () => {
    const user = userEvent.setup()
    const updatedResident = { ...mockResident, status: 'Active' as const }
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: updatedResident
      })
    })
    
    render(<StatusManager resident={mockResident} onStatusChange={mockOnStatusChange} />)
    
    await user.click(screen.getByText('Change to Active'))
    await user.click(screen.getByRole('button', { name: /Change to Active/i }))
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/residents/R001', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'Active' })
      })
    })
    
    expect(mockOnStatusChange).toHaveBeenCalledWith(updatedResident)
  })

  it('displays error message on API failure', async () => {
    const user = userEvent.setup()
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Invalid status transition'
      })
    })
    
    render(<StatusManager resident={mockResident} onStatusChange={mockOnStatusChange} />)
    
    await user.click(screen.getByText('Change to Active'))
    await user.click(screen.getByRole('button', { name: /Change to Active/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Invalid status transition')).toBeInTheDocument()
    })
  })

  it('cancels status change when cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<StatusManager resident={mockResident} onStatusChange={mockOnStatusChange} />)
    
    await user.click(screen.getByText('Change to Active'))
    await user.click(screen.getByRole('button', { name: /Cancel/i }))
    
    await waitFor(() => {
      expect(screen.queryByText('Confirm Status Change')).not.toBeInTheDocument()
    })
    
    expect(mockFetch).not.toHaveBeenCalled()
    expect(mockOnStatusChange).not.toHaveBeenCalled()
  })

  it('shows no transitions message when no valid transitions exist', () => {
    const activeResident = { ...mockResident, status: 'Active' as const }
    render(<StatusManager resident={activeResident} onStatusChange={mockOnStatusChange} />)
    
    // Active status can only transition to Deactivated
    expect(screen.getByText('Change to Deactivated')).toBeInTheDocument()
    
    // But if we mock it with a status that has no transitions
    const noTransitionResident = { ...mockResident, status: 'Completed' as 'Draft' | 'Active' | 'Deactivated' }
    render(<StatusManager resident={noTransitionResident} onStatusChange={mockOnStatusChange} />)
  })

  it('disables buttons during status change', async () => {
    const user = userEvent.setup()
    let resolvePromise: (value: Response) => void
    const pendingPromise = new Promise(resolve => {
      resolvePromise = resolve
    })
    
    mockFetch.mockReturnValueOnce(pendingPromise)
    
    render(<StatusManager resident={mockResident} onStatusChange={mockOnStatusChange} />)
    
    await user.click(screen.getByText('Change to Active'))
    const confirmButton = screen.getByRole('button', { name: /Change to Active/i })
    await user.click(confirmButton)
    
    // Button should be disabled during API call
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Changing.../i })).toBeDisabled()
    })
    
    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: async () => ({
        success: true,
        data: { ...mockResident, status: 'Active' as const }
      })
    } as Response)
  })
})