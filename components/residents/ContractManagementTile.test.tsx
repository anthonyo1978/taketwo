import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { FundingInformation } from 'types/resident'
import { ContractManagementTile } from './ContractManagementTile'

const mockActiveContract: FundingInformation = {
  id: 'contract-123',
  type: 'NDIS',
  amount: 12000,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  description: 'Test NDIS contract',
  isActive: true,
  contractStatus: 'Active',
  originalAmount: 12000,
  currentBalance: 8000,
  drawdownRate: 'monthly' as const,
  autoDrawdown: true,
  supportItemCode: '01_011_0107_1_1',
  dailySupportItemCost: 32.88,
  lastDrawdownDate: undefined,
  renewalDate: undefined,
  parentContractId: undefined,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
}

const mockDraftContract: FundingInformation = {
  ...mockActiveContract,
  id: 'contract-456',
  contractStatus: 'Draft',
  currentBalance: 12000,
  supportItemCode: undefined,
  dailySupportItemCost: undefined
}

const mockOnFundingChange = vi.fn()

describe('ContractManagementTile', () => {
  const defaultProps = {
    residentId: 'resident-123',
    fundingInfo: [mockActiveContract],
    onFundingChange: mockOnFundingChange
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with active contract information', () => {
    render(<ContractManagementTile {...defaultProps} />)

    expect(screen.getByText('Contract Management')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('✅')).toBeInTheDocument()
    expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument()
    expect(screen.getByText('Dec 31, 2024')).toBeInTheDocument()
  })

  it('displays financial overview correctly', () => {
    render(<ContractManagementTile {...defaultProps} />)

    expect(screen.getByText('$12,000')).toBeInTheDocument() // Allocated
    expect(screen.getByText('$8,000')).toBeInTheDocument()  // Balance
    expect(screen.getByText('$4,000')).toBeInTheDocument()  // Spent (12000 - 8000)
  })

  it('shows support item code when available', () => {
    render(<ContractManagementTile {...defaultProps} />)

    expect(screen.getByText('Support Item Code')).toBeInTheDocument()
    expect(screen.getByText('01_011_0107_1_1')).toBeInTheDocument()
  })

  it('shows daily support cost when available', () => {
    render(<ContractManagementTile {...defaultProps} />)

    expect(screen.getByText('Daily Support Cost')).toBeInTheDocument()
    expect(screen.getByText('$32.88/day')).toBeInTheDocument()
  })

  it('displays draft contract when no active contract exists', () => {
    render(
      <ContractManagementTile 
        {...defaultProps} 
        fundingInfo={[mockDraftContract]}
      />
    )

    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getByText('📝')).toBeInTheDocument()
  })

  it('shows empty state when no contracts exist', () => {
    render(<ContractManagementTile {...defaultProps} fundingInfo={[]} />)

    expect(screen.getByText('No Active Contract')).toBeInTheDocument()
    expect(screen.getByText('Create a new funding contract to get started with financial management.')).toBeInTheDocument()
    
    // Should show $0 for all financial figures
    const zeroAmounts = screen.getAllByText('$0')
    expect(zeroAmounts).toHaveLength(3) // Allocated, Balance, Spent
  })

  it('shows "Edit Contract" button when contract exists', () => {
    render(<ContractManagementTile {...defaultProps} />)

    const editButton = screen.getByText('Edit Contract')
    expect(editButton).toBeInTheDocument()
    expect(screen.queryByText('New Contract')).not.toBeInTheDocument()
  })
  
  it('shows "New Contract" button when no contract exists', () => {
    render(<ContractManagementTile {...defaultProps} fundingInfo={[]} />)

    const addButton = screen.getByText('New Contract')
    expect(addButton).toBeInTheDocument()
    expect(screen.queryByText('Edit Contract')).not.toBeInTheDocument()
  })

  it('opens contract form when button clicked', () => {
    render(<ContractManagementTile {...defaultProps} />)

    const editButton = screen.getByText('Edit Contract')
    fireEvent.click(editButton)

    // Modal should appear (we can't test the full form without mocking FundingManager)
    expect(document.querySelector('.fixed.inset-0')).toBeInTheDocument()
  })

  it('closes form when close button clicked', () => {
    render(<ContractManagementTile {...defaultProps} />)

    // Open form
    const editButton = screen.getByText('Edit Contract')
    fireEvent.click(editButton)

    // Close form
    const closeButton = screen.getByText('Close')
    fireEvent.click(closeButton)

    // Modal should be gone
    expect(document.querySelector('.fixed.inset-0')).not.toBeInTheDocument()
  })

  it('handles ongoing contract (no end date)', () => {
    const ongoingContract = {
      ...mockActiveContract,
      endDate: undefined
    }

    render(
      <ContractManagementTile 
        {...defaultProps} 
        fundingInfo={[ongoingContract]}
      />
    )

    expect(screen.getByText('Ongoing')).toBeInTheDocument()
  })

  it('displays correct status styling for different statuses', () => {
    const expiredContract = {
      ...mockActiveContract,
      contractStatus: 'Expired' as const
    }

    render(
      <ContractManagementTile 
        {...defaultProps} 
        fundingInfo={[expiredContract]}
      />
    )

    expect(screen.getByText('Expired')).toBeInTheDocument()
    expect(screen.getByText('⏰')).toBeInTheDocument()
    
    const statusElement = screen.getByText('Expired').closest('.inline-flex')
    expect(statusElement).toHaveClass('bg-red-100', 'text-red-800', 'border-red-300')
  })

  it('includes status management section', () => {
    render(<ContractManagementTile {...defaultProps} />)

    expect(screen.getByText('Status Management')).toBeInTheDocument()
  })

  it('displays billing frequency prominently', () => {
    render(<ContractManagementTile {...defaultProps} />)

    expect(screen.getByText('Billing Frequency')).toBeInTheDocument()
    expect(screen.getByText('monthly')).toBeInTheDocument()
  })

  it('displays fortnightly billing frequency correctly', () => {
    const fortnightlyContract = {
      ...mockActiveContract,
      drawdownRate: 'fortnightly' as const
    }

    render(
      <ContractManagementTile 
        {...defaultProps} 
        fundingInfo={[fortnightlyContract]}
      />
    )

    expect(screen.getByText('Billing Frequency')).toBeInTheDocument()
    expect(screen.getByText('fortnightly')).toBeInTheDocument()
  })
})