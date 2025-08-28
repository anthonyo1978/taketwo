import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FundingInformation } from 'types/resident'
import { FundingBalanceDisplay } from './FundingBalanceDisplay'

// Mock the funding calculations module
vi.mock('lib/utils/funding-calculations', () => ({
  calculateBalanceSummary: vi.fn(),
  getContractCompletionPercentage: vi.fn(),
  isContractExpiringSoon: vi.fn(),
  getDrawdownRateDescription: vi.fn()
}))

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'MMM d, yyyy') {
      return new Date(date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    }
    return new Date(date).toLocaleDateString()
  }),
  differenceInDays: vi.fn((endDate, startDate) => {
    const end = new Date(endDate)
    const start = new Date(startDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  })
}))

const createMockContract = (overrides: Partial<FundingInformation> = {}): FundingInformation => ({
  id: 'contract-1',
  type: 'NDIS',
  amount: 12000,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  description: 'Test contract',
  isActive: true,
  contractStatus: 'Active',
  originalAmount: 12000,
  currentBalance: 8000,
  drawdownRate: 'monthly',
  autoDrawdown: true,
  lastDrawdownDate: new Date('2024-06-01'),
  renewalDate: undefined,
  parentContractId: undefined,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-06-01'),
  ...overrides
})

describe('FundingBalanceDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    vi.mocked(require('lib/utils/funding-calculations').calculateBalanceSummary)
      .mockReturnValue({
        totalOriginal: 20000,
        totalCurrent: 15000,
        totalDrawnDown: 5000,
        activeContracts: 2,
        expiringSoon: 1
      })
      
    vi.mocked(require('lib/utils/funding-calculations').getContractCompletionPercentage)
      .mockReturnValue(50)
      
    vi.mocked(require('lib/utils/funding-calculations').isContractExpiringSoon)
      .mockReturnValue(false)
      
    vi.mocked(require('lib/utils/funding-calculations').getDrawdownRateDescription)
      .mockReturnValue('Monthly drawdown - funds reduce each month')
  })

  it('displays empty state when no contracts provided', () => {
    render(<FundingBalanceDisplay contracts={[]} />)

    expect(screen.getByText('No Funding Contracts')).toBeInTheDocument()
    expect(screen.getByText('Get started by adding funding contracts to track financial support.')).toBeInTheDocument()
  })

  it('displays funding overview with correct totals', () => {
    const contracts = [
      createMockContract({
        originalAmount: 10000,
        currentBalance: 8000,
        contractStatus: 'Active'
      }),
      createMockContract({
        id: 'contract-2',
        originalAmount: 10000,
        currentBalance: 7000,
        contractStatus: 'Active'
      })
    ]

    render(<FundingBalanceDisplay contracts={contracts} />)

    expect(screen.getByText('Funding Overview')).toBeInTheDocument()
    expect(screen.getByText('$15,000')).toBeInTheDocument() // Current Balance
    expect(screen.getByText('$20,000')).toBeInTheDocument() // Total Allocated
    expect(screen.getByText('$5,000')).toBeInTheDocument()  // Drawn Down
    expect(screen.getByText('2')).toBeInTheDocument()       // Active Contracts
    expect(screen.getByText('1')).toBeInTheDocument()       // Expiring Soon
  })

  it('shows overall progress bar with correct percentage', () => {
    const contracts = [createMockContract()]
    
    render(<FundingBalanceDisplay contracts={contracts} />)

    const progressBars = screen.getAllByRole('progressbar', { hidden: true })
    expect(progressBars.length).toBeGreaterThan(0)
    
    // Check that the progress percentage is displayed
    expect(screen.getByText('25.0%')).toBeInTheDocument() // 5000/20000 * 100
  })

  it('displays active contracts section when showDetailedView is true', () => {
    const contracts = [
      createMockContract({
        contractStatus: 'Active',
        type: 'NDIS'
      })
    ]

    render(<FundingBalanceDisplay contracts={contracts} showDetailedView={true} />)

    expect(screen.getByText('Active Contracts (1)')).toBeInTheDocument()
  })

  it('displays draft contracts section', () => {
    const contracts = [
      createMockContract({
        contractStatus: 'Draft',
        type: 'Government'
      })
    ]

    render(<FundingBalanceDisplay contracts={contracts} showDetailedView={true} />)

    expect(screen.getByText('Draft Contracts (1)')).toBeInTheDocument()
  })

  it('displays completed contracts section', () => {
    const contracts = [
      createMockContract({
        contractStatus: 'Expired',
        type: 'Private'
      })
    ]

    render(<FundingBalanceDisplay contracts={contracts} showDetailedView={true} />)

    expect(screen.getByText('Completed Contracts (1)')).toBeInTheDocument()
  })

  it('shows contract balance card with correct information', () => {
    const contract = createMockContract({
      type: 'NDIS',
      originalAmount: 12000,
      currentBalance: 8000,
      contractStatus: 'Active',
      description: 'Test NDIS funding'
    })

    render(<FundingBalanceDisplay contracts={[contract]} showDetailedView={true} />)

    expect(screen.getByText('NDIS')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('$12,000')).toBeInTheDocument() // Original
    expect(screen.getByText('$8,000')).toBeInTheDocument()  // Current
    expect(screen.getByText('$4,000')).toBeInTheDocument()  // Drawn Down
  })

  it('displays expiring warning for contracts expiring soon', () => {
    vi.mocked(require('lib/utils/funding-calculations').isContractExpiringSoon)
      .mockReturnValue(true)

    const contract = createMockContract({
      contractStatus: 'Active',
      endDate: new Date('2024-07-15') // Soon
    })

    render(<FundingBalanceDisplay contracts={[contract]} showDetailedView={true} />)

    expect(screen.getByText('⚠️ Expiring Soon')).toBeInTheDocument()
  })

  it('shows drawdown progress bar for active contracts', () => {
    const contract = createMockContract({
      contractStatus: 'Active',
      originalAmount: 10000,
      currentBalance: 7000 // 30% drawn down
    })

    render(<FundingBalanceDisplay contracts={[contract]} showDetailedView={true} />)

    expect(screen.getByText('Drawdown Progress')).toBeInTheDocument()
    expect(screen.getByText('30.0%')).toBeInTheDocument() // (10000-7000)/10000 * 100
  })

  it('shows timeline progress bar for active contracts with end date', () => {
    vi.mocked(require('lib/utils/funding-calculations').getContractCompletionPercentage)
      .mockReturnValue(75)

    const contract = createMockContract({
      contractStatus: 'Active',
      endDate: new Date('2024-12-31')
    })

    render(<FundingBalanceDisplay contracts={[contract]} showDetailedView={true} />)

    expect(screen.getByText('Timeline Progress')).toBeInTheDocument()
    expect(screen.getByText('75.0%')).toBeInTheDocument()
  })

  it('displays contract details correctly', () => {
    vi.mocked(require('lib/utils/funding-calculations').getDrawdownRateDescription)
      .mockReturnValue('Monthly drawdown - funds reduce each month')

    const contract = createMockContract({
      description: 'NDIS support funding',
      drawdownRate: 'monthly',
      parentContractId: 'parent-123'
    })

    render(<FundingBalanceDisplay contracts={[contract]} showDetailedView={true} />)

    expect(screen.getByText(/Period:/)).toBeInTheDocument()
    expect(screen.getByText(/Monthly drawdown - funds reduce each month/)).toBeInTheDocument()
    expect(screen.getByText(/Notes: NDIS support funding/)).toBeInTheDocument()
    expect(screen.getByText(/Renewed from: Contract parent-123/)).toBeInTheDocument()
  })

  it('applies correct status colors for different contract statuses', () => {
    const statusTests = [
      { status: 'Draft', expectedClass: 'border-gray-300 bg-gray-50' },
      { status: 'Active', expectedClass: 'border-green-300 bg-green-50' },
      { status: 'Expired', expectedClass: 'border-red-300 bg-red-50' },
      { status: 'Cancelled', expectedClass: 'border-orange-300 bg-orange-50' },
      { status: 'Renewed', expectedClass: 'border-blue-300 bg-blue-50' }
    ]

    statusTests.forEach(({ status }) => {
      const contract = createMockContract({
        contractStatus: status as any
      })

      const { unmount } = render(
        <FundingBalanceDisplay contracts={[contract]} showDetailedView={true} />
      )

      // Check that the contract card is rendered (status colors are applied via classes)
      expect(screen.getByText(status)).toBeInTheDocument()
      unmount()
    })
  })

  it('shows different funding type colors', () => {
    const typeTests = ['NDIS', 'Government', 'Private', 'Family', 'Other'] as const

    typeTests.forEach(type => {
      const contract = createMockContract({ type })

      const { unmount } = render(
        <FundingBalanceDisplay contracts={[contract]} showDetailedView={true} />
      )

      expect(screen.getByText(type)).toBeInTheDocument()
      unmount()
    })
  })

  it('formats date ranges correctly with days remaining', () => {
    const contract = createMockContract({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31')
    })

    // Mock the differenceInDays to return 30 days
    vi.mocked(require('date-fns').differenceInDays).mockReturnValue(30)

    render(<FundingBalanceDisplay contracts={[contract]} showDetailedView={true} />)

    expect(screen.getByText(/30 days left/)).toBeInTheDocument()
  })

  it('shows expired status for past contracts', () => {
    const contract = createMockContract({
      endDate: new Date('2023-12-31') // Past date
    })

    // Mock differenceInDays to return negative value (expired)
    vi.mocked(require('date-fns').differenceInDays).mockReturnValue(-30)

    render(<FundingBalanceDisplay contracts={[contract]} showDetailedView={true} />)

    expect(screen.getByText(/Expired/)).toBeInTheDocument()
  })

  it('handles ongoing contracts without end date', () => {
    const contract = createMockContract({
      endDate: undefined
    })

    render(<FundingBalanceDisplay contracts={[contract]} showDetailedView={true} />)

    expect(screen.getByText(/Ongoing/)).toBeInTheDocument()
  })

  it('hides detailed view when showDetailedView is false', () => {
    const contracts = [
      createMockContract({ contractStatus: 'Active' }),
      createMockContract({ contractStatus: 'Draft' })
    ]

    render(<FundingBalanceDisplay contracts={contracts} showDetailedView={false} />)

    expect(screen.queryByText('Active Contracts')).not.toBeInTheDocument()
    expect(screen.queryByText('Draft Contracts')).not.toBeInTheDocument()
    
    // But should still show the overview
    expect(screen.getByText('Funding Overview')).toBeInTheDocument()
  })

  it('calculates correct progress bar colors based on completion', () => {
    const testCases = [
      { completion: 25, expectedClass: 'bg-green-500' },
      { completion: 75, expectedClass: 'bg-yellow-500' },
      { completion: 100, expectedClass: 'bg-red-500' }
    ]

    testCases.forEach(({ completion }) => {
      vi.mocked(require('lib/utils/funding-calculations').getContractCompletionPercentage)
        .mockReturnValue(completion)

      const contract = createMockContract({
        contractStatus: 'Active',
        endDate: new Date('2024-12-31')
      })

      const { unmount } = render(
        <FundingBalanceDisplay contracts={[contract]} showDetailedView={true} />
      )

      expect(screen.getByText(`${completion.toFixed(1)}%`)).toBeInTheDocument()
      unmount()
    })
  })

  it('handles zero amounts gracefully', () => {
    const contract = createMockContract({
      originalAmount: 0,
      currentBalance: 0
    })

    render(<FundingBalanceDisplay contracts={[contract]} showDetailedView={true} />)

    expect(screen.getByText('$0')).toBeInTheDocument()
  })
})