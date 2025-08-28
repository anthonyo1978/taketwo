import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContractStatus, DrawdownRate, FundingInformation } from 'types/resident'
import {
  calculateBalanceSummary,
  calculateCurrentBalance,
  calculateDrawdownAmount,
  generateContractRenewal,
  getContractCompletionPercentage,
  getDailyDrawdownRate,
  getElapsedPeriods,
  getNextDrawdownDate,
  getValidStatusTransitions,
  isContractExpiringSoon,
  isValidStatusTransition
} from './funding-calculations'

// Mock funding contract helper
const createMockContract = (overrides: Partial<FundingInformation> = {}): FundingInformation => ({
  id: 'test-contract-1',
  type: 'NDIS',
  amount: 12000,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  description: 'Test contract',
  isActive: true,
  contractStatus: 'Active',
  originalAmount: 12000,
  currentBalance: 12000,
  drawdownRate: 'monthly',
  autoDrawdown: true,
  lastDrawdownDate: undefined,
  renewalDate: undefined,
  parentContractId: undefined,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
})

describe('funding-calculations', () => {
  beforeEach(() => {
    // Set a fixed date for consistent testing
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-07-01')) // 6 months into the year
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('calculateCurrentBalance', () => {
    it('returns original amount for non-active contracts', () => {
      const contract = createMockContract({
        contractStatus: 'Draft',
        originalAmount: 10000
      })
      
      const balance = calculateCurrentBalance(contract)
      expect(balance).toBe(10000)
    })

    it('returns original amount when auto-drawdown is disabled', () => {
      const contract = createMockContract({
        contractStatus: 'Active',
        originalAmount: 10000,
        autoDrawdown: false
      })
      
      const balance = calculateCurrentBalance(contract)
      expect(balance).toBe(10000)
    })

    it('calculates linear drawdown for monthly rate', () => {
      const contract = createMockContract({
        contractStatus: 'Active',
        originalAmount: 12000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        drawdownRate: 'monthly',
        autoDrawdown: true
      })
      
      // 6 months elapsed out of 12 months = 50% drawn down
      const balance = calculateCurrentBalance(contract)
      expect(balance).toBe(6000) // 50% of 12000
    })

    it('calculates linear drawdown for daily rate', () => {
      const contract = createMockContract({
        contractStatus: 'Active',
        originalAmount: 365000, // $1000 per day
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        drawdownRate: 'daily',
        autoDrawdown: true
      })
      
      // 182 days elapsed (Jan 1 to July 1)
      const balance = calculateCurrentBalance(contract)
      expect(balance).toBe(183000) // 182 days * $1000 drawn down
    })

    it('returns 0 for expired contracts', () => {
      const contract = createMockContract({
        contractStatus: 'Active',
        originalAmount: 10000,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'), // Expired
        autoDrawdown: true
      })
      
      const balance = calculateCurrentBalance(contract)
      expect(balance).toBe(0)
    })

    it('returns full amount for future contracts', () => {
      const contract = createMockContract({
        contractStatus: 'Active',
        originalAmount: 10000,
        startDate: new Date('2025-01-01'), // Future
        endDate: new Date('2025-12-31'),
        autoDrawdown: true
      })
      
      const balance = calculateCurrentBalance(contract)
      expect(balance).toBe(10000)
    })

    it('returns original amount for ongoing contracts without end date', () => {
      const contract = createMockContract({
        contractStatus: 'Active',
        originalAmount: 10000,
        endDate: undefined,
        autoDrawdown: true
      })
      
      const balance = calculateCurrentBalance(contract)
      expect(balance).toBe(10000)
    })
  })

  describe('getElapsedPeriods', () => {
    it('calculates daily periods correctly', () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-10')
      const periods = getElapsedPeriods(startDate, endDate, 'daily')
      expect(periods).toBe(9) // 9 days difference
    })

    it('calculates weekly periods correctly', () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-15')
      const periods = getElapsedPeriods(startDate, endDate, 'weekly')
      expect(periods).toBe(2) // 2 weeks difference
    })

    it('calculates monthly periods correctly', () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-07-01')
      const periods = getElapsedPeriods(startDate, endDate, 'monthly')
      expect(periods).toBe(6) // 6 months difference
    })
  })

  describe('calculateDrawdownAmount', () => {
    it('calculates correct drawdown amount', () => {
      const contract = createMockContract({
        originalAmount: 12000,
        currentBalance: 6000
      })
      
      vi.spyOn({ calculateCurrentBalance }, 'calculateCurrentBalance').mockReturnValue(6000)
      
      const drawnDown = calculateDrawdownAmount(contract)
      expect(drawnDown).toBe(6000) // 12000 - 6000
    })
  })

  describe('isContractExpiringSoon', () => {
    it('returns true for contracts expiring within threshold', () => {
      vi.setSystemTime(new Date('2024-12-15')) // 16 days before end of year
      
      const contract = createMockContract({
        contractStatus: 'Active',
        endDate: new Date('2024-12-31')
      })
      
      const isExpiring = isContractExpiringSoon(contract, 30)
      expect(isExpiring).toBe(true)
    })

    it('returns false for contracts expiring beyond threshold', () => {
      vi.setSystemTime(new Date('2024-10-15')) // More than 30 days before end
      
      const contract = createMockContract({
        contractStatus: 'Active',
        endDate: new Date('2024-12-31')
      })
      
      const isExpiring = isContractExpiringSoon(contract, 30)
      expect(isExpiring).toBe(false)
    })

    it('returns false for non-active contracts', () => {
      const contract = createMockContract({
        contractStatus: 'Draft',
        endDate: new Date('2024-07-15') // Soon
      })
      
      const isExpiring = isContractExpiringSoon(contract, 30)
      expect(isExpiring).toBe(false)
    })

    it('returns false for contracts without end date', () => {
      const contract = createMockContract({
        contractStatus: 'Active',
        endDate: undefined
      })
      
      const isExpiring = isContractExpiringSoon(contract)
      expect(isExpiring).toBe(false)
    })
  })

  describe('generateContractRenewal', () => {
    it('creates renewal contract with correct structure', () => {
      const existingContract = createMockContract({
        id: 'parent-123',
        type: 'NDIS',
        drawdownRate: 'monthly',
        autoDrawdown: true,
        description: 'Original contract'
      })

      const renewalData = {
        amount: 15000,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        description: 'Renewed contract'
      }

      const renewal = generateContractRenewal(existingContract, renewalData)

      expect(renewal.type).toBe('NDIS')
      expect(renewal.amount).toBe(15000)
      expect(renewal.originalAmount).toBe(15000)
      expect(renewal.currentBalance).toBe(15000)
      expect(renewal.contractStatus).toBe('Draft')
      expect(renewal.parentContractId).toBe('parent-123')
      expect(renewal.drawdownRate).toBe('monthly')
      expect(renewal.autoDrawdown).toBe(true)
      expect(renewal.description).toBe('Renewed contract')
    })

    it('inherits settings from parent contract when not specified', () => {
      const existingContract = createMockContract({
        id: 'parent-456',
        type: 'Government',
        drawdownRate: 'weekly',
        autoDrawdown: false,
        description: 'Parent contract'
      })

      const renewalData = {
        amount: 8000,
        startDate: new Date('2025-01-01')
      }

      const renewal = generateContractRenewal(existingContract, renewalData)

      expect(renewal.drawdownRate).toBe('weekly')
      expect(renewal.autoDrawdown).toBe(false)
      expect(renewal.description).toBe('Parent contract')
    })
  })

  describe('calculateBalanceSummary', () => {
    it('calculates correct balance summary for multiple contracts', () => {
      vi.setSystemTime(new Date('2024-12-15')) // Set for expiry testing
      
      const contracts: FundingInformation[] = [
        createMockContract({
          originalAmount: 10000,
          currentBalance: 8000,
          contractStatus: 'Active'
        }),
        createMockContract({
          originalAmount: 5000,
          currentBalance: 2000,
          contractStatus: 'Active',
          endDate: new Date('2024-12-20') // Expiring soon
        }),
        createMockContract({
          originalAmount: 3000,
          currentBalance: 3000,
          contractStatus: 'Draft'
        })
      ]

      // Mock the calculateCurrentBalance function for consistent testing
      vi.doMock('./funding-calculations', async () => {
        const actual = await vi.importActual('./funding-calculations')
        return {
          ...actual,
          calculateCurrentBalance: vi.fn()
            .mockReturnValueOnce(8000) // First contract
            .mockReturnValueOnce(2000) // Second contract
            .mockReturnValueOnce(3000), // Third contract
          isContractExpiringSoon: vi.fn()
            .mockReturnValueOnce(false) // First contract
            .mockReturnValueOnce(true)  // Second contract
            .mockReturnValueOnce(false) // Third contract
        }
      })

      const summary = calculateBalanceSummary(contracts)

      expect(summary.totalOriginal).toBe(18000) // 10000 + 5000 + 3000
      expect(summary.totalCurrent).toBe(13000)  // 8000 + 2000 + 3000
      expect(summary.totalDrawnDown).toBe(5000) // 18000 - 13000
      expect(summary.activeContracts).toBe(2)   // 2 active contracts
      expect(summary.expiringSoon).toBe(1)      // 1 contract expiring soon
    })

    it('handles empty contract array', () => {
      const summary = calculateBalanceSummary([])
      
      expect(summary.totalOriginal).toBe(0)
      expect(summary.totalCurrent).toBe(0)
      expect(summary.totalDrawnDown).toBe(0)
      expect(summary.activeContracts).toBe(0)
      expect(summary.expiringSoon).toBe(0)
    })
  })

  describe('getContractCompletionPercentage', () => {
    it('calculates completion percentage correctly', () => {
      const contract = createMockContract({
        contractStatus: 'Active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      })
      
      // Currently at July 1, 2024 (6 months / 12 months = 50%)
      const completion = getContractCompletionPercentage(contract)
      expect(completion).toBeCloseTo(50, 0) // Allow for small floating point differences
    })

    it('returns 0 for non-active contracts', () => {
      const contract = createMockContract({
        contractStatus: 'Draft',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      })
      
      const completion = getContractCompletionPercentage(contract)
      expect(completion).toBe(0)
    })

    it('returns 100 for expired contracts', () => {
      const contract = createMockContract({
        contractStatus: 'Active',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31')
      })
      
      const completion = getContractCompletionPercentage(contract)
      expect(completion).toBe(100)
    })
  })

  describe('isValidStatusTransition', () => {
    it('allows valid status transitions', () => {
      expect(isValidStatusTransition('Draft', 'Active')).toBe(true)
      expect(isValidStatusTransition('Draft', 'Cancelled')).toBe(true)
      expect(isValidStatusTransition('Active', 'Expired')).toBe(true)
      expect(isValidStatusTransition('Active', 'Cancelled')).toBe(true)
      expect(isValidStatusTransition('Expired', 'Renewed')).toBe(true)
      expect(isValidStatusTransition('Renewed', 'Active')).toBe(true)
    })

    it('rejects invalid status transitions', () => {
      expect(isValidStatusTransition('Draft', 'Expired')).toBe(false)
      expect(isValidStatusTransition('Active', 'Draft')).toBe(false)
      expect(isValidStatusTransition('Cancelled', 'Active')).toBe(false)
      expect(isValidStatusTransition('Expired', 'Active')).toBe(false)
    })
  })

  describe('getValidStatusTransitions', () => {
    it('returns correct transitions for each status', () => {
      expect(getValidStatusTransitions('Draft')).toEqual(['Active', 'Cancelled'])
      expect(getValidStatusTransitions('Active')).toEqual(['Expired', 'Cancelled'])
      expect(getValidStatusTransitions('Expired')).toEqual(['Renewed', 'Cancelled'])
      expect(getValidStatusTransitions('Cancelled')).toEqual([])
      expect(getValidStatusTransitions('Renewed')).toEqual(['Active'])
    })
  })

  describe('getDailyDrawdownRate', () => {
    it('calculates daily drawdown rate correctly', () => {
      const contract = createMockContract({
        contractStatus: 'Active',
        originalAmount: 36500, // $100 per day for a year
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31')
      })
      
      const rate = getDailyDrawdownRate(contract)
      expect(rate).toBeCloseTo(100, 1) // $100 per day
    })

    it('returns 0 for non-active contracts', () => {
      const contract = createMockContract({
        contractStatus: 'Draft',
        originalAmount: 36500
      })
      
      const rate = getDailyDrawdownRate(contract)
      expect(rate).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('handles contracts with same start and end date', () => {
      const contract = createMockContract({
        contractStatus: 'Active',
        originalAmount: 1000,
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-07-01'), // Same day
        autoDrawdown: true
      })
      
      const balance = calculateCurrentBalance(contract)
      expect(balance).toBe(0) // Should be fully drawn down
    })

    it('handles very small amounts correctly', () => {
      const contract = createMockContract({
        contractStatus: 'Active',
        originalAmount: 0.01,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        drawdownRate: 'monthly',
        autoDrawdown: true
      })
      
      const balance = calculateCurrentBalance(contract)
      expect(balance).toBeGreaterThanOrEqual(0)
      expect(balance).toBeLessThanOrEqual(0.01)
    })

    it('handles leap year calculations correctly', () => {
      vi.setSystemTime(new Date('2024-02-29')) // Leap year date
      
      const contract = createMockContract({
        contractStatus: 'Active',
        originalAmount: 36600, // Accounting for leap year (366 days)
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        drawdownRate: 'daily',
        autoDrawdown: true
      })
      
      const balance = calculateCurrentBalance(contract)
      expect(balance).toBeGreaterThan(0)
      expect(balance).toBeLessThan(36600)
    })
  })
})