import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FundingInformation } from 'types/resident'
import { ContractStatusManager } from './ContractStatusManager'

// Mock the funding calculations module
vi.mock('lib/utils/funding-calculations', () => ({
  getValidStatusTransitions: vi.fn(),
  getContractCompletionPercentage: vi.fn(),
  isContractExpiringSoon: vi.fn()
}))

// Mock fetch
global.fetch = vi.fn()

const mockContract: FundingInformation = {
  id: 'contract-123',
  type: 'NDIS',
  amount: 12000,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  description: 'Test NDIS contract',
  isActive: true,
  contractStatus: 'Draft',
  originalAmount: 12000,
  currentBalance: 12000,
  drawdownRate: 'monthly',
  autoDrawdown: true,
  lastDrawdownDate: undefined,
  renewalDate: undefined,
  parentContractId: undefined,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
}

describe('ContractStatusManager', () => {
  const mockOnStatusChange = vi.fn()
  const residentId = 'resident-456'

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    vi.mocked(require('lib/utils/funding-calculations').getValidStatusTransitions)
      .mockReturnValue(['Active', 'Cancelled'])
    vi.mocked(require('lib/utils/funding-calculations').getContractCompletionPercentage)
      .mockReturnValue(0)
    vi.mocked(require('lib/utils/funding-calculations').isContractExpiringSoon)
      .mockReturnValue(false)
  })

  it('displays contract status and basic information', () => {
    render(
      <ContractStatusManager 
        contract={mockContract} 
        residentId={residentId}
        onStatusChange={mockOnStatusChange}
      />
    )

    expect(screen.getByText('Contract Status')).toBeInTheDocument()
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getByText('Initial contract state, not yet active')).toBeInTheDocument()
    expect(screen.getByText('$12,000')).toBeInTheDocument()
    expect(screen.getByText(/Jan 1, 2024 - Dec 31, 2024/)).toBeInTheDocument()
  })

  it('shows expiring soon warning when contract is expiring', () => {
    vi.mocked(require('lib/utils/funding-calculations').isContractExpiringSoon)
      .mockReturnValue(true)

    render(
      <ContractStatusManager 
        contract={mockContract} 
        residentId={residentId}
        onStatusChange={mockOnStatusChange}
      />
    )

    expect(screen.getByText('Expiring Soon')).toBeInTheDocument()
  })

  it('displays available status transitions', () => {
    render(
      <ContractStatusManager 
        contract={mockContract} 
        residentId={residentId}
        onStatusChange={mockOnStatusChange}
      />
    )

    expect(screen.getByText('Available Actions:')).toBeInTheDocument()
    expect(screen.getByText('Activate Contract')).toBeInTheDocument()
    expect(screen.getByText('Cancel Contract')).toBeInTheDocument()
  })

  it('shows no actions when no valid transitions exist', () => {
    vi.mocked(require('lib/utils/funding-calculations').getValidStatusTransitions)
      .mockReturnValue([])

    const cancelledContract = { ...mockContract, contractStatus: 'Cancelled' as const }

    render(
      <ContractStatusManager 
        contract={cancelledContract} 
        residentId={residentId}
        onStatusChange={mockOnStatusChange}
      />
    )

    expect(screen.getByText('No status changes available for Cancelled contracts.')).toBeInTheDocument()
  })

  it('opens confirmation dialog when status change is clicked', async () => {
    render(
      <ContractStatusManager 
        contract={mockContract} 
        residentId={residentId}
        onStatusChange={mockOnStatusChange}
      />
    )

    const activateButton = screen.getByText('Activate Contract')
    fireEvent.click(activateButton)

    await waitFor(() => {
      expect(screen.getByText('Confirm Status Change')).toBeInTheDocument()
    })

    expect(screen.getByText(/Change contract status from Draft to Active/)).toBeInTheDocument()
  })

  it('shows activation information in confirmation dialog', async () => {
    render(
      <ContractStatusManager 
        contract={mockContract} 
        residentId={residentId}
        onStatusChange={mockOnStatusChange}
      />
    )

    const activateButton = screen.getByText('Activate Contract')
    fireEvent.click(activateButton)

    await waitFor(() => {
      expect(screen.getByText('Activating Contract:')).toBeInTheDocument()
    })

    expect(screen.getByText('Balance tracking will begin')).toBeInTheDocument()
    expect(screen.getByText('Automatic drawdown will start (if enabled)')).toBeInTheDocument()
    expect(screen.getByText('Contract timeline will be enforced')).toBeInTheDocument()
  })

  it('shows cancellation warning in confirmation dialog', async () => {
    render(
      <ContractStatusManager 
        contract={mockContract} 
        residentId={residentId}
        onStatusChange={mockOnStatusChange}
      />
    )

    const cancelButton = screen.getByText('Cancel Contract')
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.getByText('Cancelling Contract:')).toBeInTheDocument()
    })

    expect(screen.getByText('This action cannot be undone. The contract will be permanently cancelled.')).toBeInTheDocument()
  })

  it('closes confirmation dialog when cancel is clicked', async () => {
    render(
      <ContractStatusManager 
        contract={mockContract} 
        residentId={residentId}
        onStatusChange={mockOnStatusChange}
      />
    )

    const activateButton = screen.getByText('Activate Contract')
    fireEvent.click(activateButton)

    await waitFor(() => {
      expect(screen.getByText('Confirm Status Change')).toBeInTheDocument()
    })

    const cancelDialogButton = screen.getByRole('button', { name: 'Cancel' })
    fireEvent.click(cancelDialogButton)

    await waitFor(() => {
      expect(screen.queryByText('Confirm Status Change')).not.toBeInTheDocument()
    })
  })

  it('calls API and triggers callback on successful status change', async () => {
    const updatedContract = { ...mockContract, contractStatus: 'Active' as const }
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: updatedContract
      })
    } as Response)

    render(
      <ContractStatusManager 
        contract={mockContract} 
        residentId={residentId}
        onStatusChange={mockOnStatusChange}
      />
    )

    const activateButton = screen.getByText('Activate Contract')
    fireEvent.click(activateButton)

    await waitFor(() => {
      expect(screen.getByText('Confirm Status Change')).toBeInTheDocument()
    })

    const confirmButton = screen.getByRole('button', { name: 'Activate Contract' })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/residents/${residentId}/funding/contract`,
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fundingId: mockContract.id,
            status: 'Active'
          })
        })
      )
    })

    await waitFor(() => {
      expect(mockOnStatusChange).toHaveBeenCalledWith(updatedContract)
    })
  })

  it('displays error message on API failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Failed to update contract status'
      })
    } as Response)

    render(
      <ContractStatusManager 
        contract={mockContract} 
        residentId={residentId}
        onStatusChange={mockOnStatusChange}
      />
    )

    const activateButton = screen.getByText('Activate Contract')
    fireEvent.click(activateButton)

    await waitFor(() => {
      expect(screen.getByText('Confirm Status Change')).toBeInTheDocument()
    })

    const confirmButton = screen.getByRole('button', { name: 'Activate Contract' })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to update contract status')).toBeInTheDocument()
    })

    expect(mockOnStatusChange).not.toHaveBeenCalled()
  })

  it('handles network errors gracefully', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    render(
      <ContractStatusManager 
        contract={mockContract} 
        residentId={residentId}
        onStatusChange={mockOnStatusChange}
      />
    )

    const activateButton = screen.getByText('Activate Contract')
    fireEvent.click(activateButton)

    await waitFor(() => {
      expect(screen.getByText('Confirm Status Change')).toBeInTheDocument()
    })

    const confirmButton = screen.getByRole('button', { name: 'Activate Contract' })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument()
    })
  })

  it('shows loading state during status change', async () => {
    let resolvePromise: (value: any) => void
    const mockPromise = new Promise(resolve => {
      resolvePromise = resolve
    })

    vi.mocked(fetch).mockReturnValueOnce(mockPromise as any)

    render(
      <ContractStatusManager 
        contract={mockContract} 
        residentId={residentId}
        onStatusChange={mockOnStatusChange}
      />
    )

    const activateButton = screen.getByText('Activate Contract')
    fireEvent.click(activateButton)

    await waitFor(() => {
      expect(screen.getByText('Confirm Status Change')).toBeInTheDocument()
    })

    const confirmButton = screen.getByRole('button', { name: 'Activate Contract' })
    fireEvent.click(confirmButton)

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText('Changing...')).toBeInTheDocument()
    })

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: async () => ({ success: true, data: mockContract })
    })
  })

  it('shows completion percentage for active contracts', () => {
    vi.mocked(require('lib/utils/funding-calculations').getContractCompletionPercentage)
      .mockReturnValue(75)

    const activeContract = { ...mockContract, contractStatus: 'Active' as const }

    render(
      <ContractStatusManager 
        contract={activeContract} 
        residentId={residentId}
        onStatusChange={mockOnStatusChange}
      />
    )

    expect(screen.getByText('75.0%')).toBeInTheDocument()
  })

  it('displays correct status icons', () => {
    const statusTests = [
      { status: 'Draft', icon: '📝' },
      { status: 'Active', icon: '✅' },
      { status: 'Expired', icon: '⏰' },
      { status: 'Cancelled', icon: '❌' },
      { status: 'Renewed', icon: '🔄' }
    ]

    statusTests.forEach(({ status, icon }) => {
      const contract = { ...mockContract, contractStatus: status as any }
      const { unmount } = render(
        <ContractStatusManager 
          contract={contract} 
          residentId={residentId}
          onStatusChange={mockOnStatusChange}
        />
      )

      expect(screen.getByText(icon)).toBeInTheDocument()
      unmount()
    })
  })

  it('formats date ranges correctly', () => {
    const contractWithoutEnd = { 
      ...mockContract, 
      endDate: undefined 
    }

    render(
      <ContractStatusManager 
        contract={contractWithoutEnd} 
        residentId={residentId}
        onStatusChange={mockOnStatusChange}
      />
    )

    expect(screen.getByText(/Jan 1, 2024 - Ongoing/)).toBeInTheDocument()
  })
})