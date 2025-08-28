import { addDays, addMonths, addWeeks, differenceInDays, differenceInMonths, differenceInWeeks, isAfter } from 'date-fns'
import type { ContractBalanceSummary, ContractStatus, DrawdownRate, FundingInformation } from 'types/resident'

/**
 * Calculate the current balance for a funding contract based on elapsed time and drawdown rate
 */
export function calculateCurrentBalance(contract: FundingInformation): number {
  // If contract is not active or auto-drawdown is disabled, return original amount
  if (contract.contractStatus !== 'Active' || !contract.autoDrawdown) {
    return contract.originalAmount
  }

  const now = new Date()
  const startDate = new Date(contract.startDate)
  const endDate = contract.endDate ? new Date(contract.endDate) : null

  // If no end date, return full amount (ongoing contract)
  if (!endDate) {
    return contract.originalAmount
  }

  // If contract hasn't started yet, return full amount
  if (isAfter(startDate, now)) {
    return contract.originalAmount
  }

  // If contract has expired, return 0
  if (isAfter(now, endDate)) {
    return 0
  }

  const elapsed = getElapsedPeriods(startDate, now, contract.drawdownRate)
  const totalPeriods = getElapsedPeriods(startDate, endDate, contract.drawdownRate)

  if (totalPeriods === 0) {
    return contract.originalAmount
  }

  // Calculate linear drawdown based on elapsed time
  const drawdownPercentage = Math.min(1, elapsed / totalPeriods)
  const drawnDown = contract.originalAmount * drawdownPercentage

  return Math.max(0, contract.originalAmount - drawnDown)
}

/**
 * Get the number of elapsed periods between two dates based on drawdown rate
 */
export function getElapsedPeriods(startDate: Date, endDate: Date, rate: DrawdownRate): number {
  switch (rate) {
    case 'daily':
      return differenceInDays(endDate, startDate)
    case 'weekly':
      return differenceInWeeks(endDate, startDate)
    case 'monthly':
      return differenceInMonths(endDate, startDate)
    default:
      return 0
  }
}

/**
 * Calculate the amount drawn down from the original allocation
 */
export function calculateDrawdownAmount(contract: FundingInformation): number {
  const currentBalance = calculateCurrentBalance(contract)
  return contract.originalAmount - currentBalance
}

/**
 * Check if a contract is expiring soon (within 30 days)
 */
export function isContractExpiringSoon(contract: FundingInformation, daysThreshold: number = 30): boolean {
  if (!contract.endDate || contract.contractStatus !== 'Active') {
    return false
  }

  const now = new Date()
  const endDate = new Date(contract.endDate)
  const daysUntilExpiry = differenceInDays(endDate, now)

  return daysUntilExpiry <= daysThreshold && daysUntilExpiry > 0
}

/**
 * Generate a renewal contract based on an existing contract
 */
export function generateContractRenewal(
  existingContract: FundingInformation,
  renewalData: {
    amount: number
    startDate: Date
    endDate?: Date
    description?: string
    drawdownRate?: DrawdownRate
    autoDrawdown?: boolean
  }
): Omit<FundingInformation, 'id' | 'createdAt' | 'updatedAt'> {
  const renewalStartDate = renewalData.startDate || new Date()

  return {
    type: existingContract.type,
    amount: renewalData.amount,
    startDate: renewalStartDate,
    endDate: renewalData.endDate,
    description: renewalData.description || existingContract.description,
    isActive: true,
    contractStatus: 'Draft' as ContractStatus,
    originalAmount: renewalData.amount,
    currentBalance: renewalData.amount, // Full amount for new contract
    drawdownRate: renewalData.drawdownRate || existingContract.drawdownRate,
    autoDrawdown: renewalData.autoDrawdown ?? existingContract.autoDrawdown,
    lastDrawdownDate: undefined,
    renewalDate: undefined,
    parentContractId: existingContract.id
  }
}

/**
 * Calculate balance summary for multiple contracts
 */
export function calculateBalanceSummary(contracts: FundingInformation[]): ContractBalanceSummary {
  let totalOriginal = 0
  let totalCurrent = 0
  let activeContracts = 0
  let expiringSoon = 0

  for (const contract of contracts) {
    totalOriginal += contract.originalAmount
    const currentBalance = calculateCurrentBalance(contract)
    totalCurrent += currentBalance

    if (contract.contractStatus === 'Active') {
      activeContracts++

      if (isContractExpiringSoon(contract)) {
        expiringSoon++
      }
    }
  }

  const totalDrawnDown = totalOriginal - totalCurrent

  return {
    totalOriginal,
    totalCurrent,
    totalDrawnDown,
    activeContracts,
    expiringSoon
  }
}

/**
 * Get the next drawdown date based on the current date and rate
 */
export function getNextDrawdownDate(lastDate: Date, rate: DrawdownRate): Date {
  switch (rate) {
    case 'daily':
      return addDays(lastDate, 1)
    case 'weekly':
      return addWeeks(lastDate, 1)
    case 'monthly':
      return addMonths(lastDate, 1)
    default:
      return lastDate
  }
}

/**
 * Calculate the daily drawdown rate for a contract
 */
export function getDailyDrawdownRate(contract: FundingInformation): number {
  if (!contract.endDate || contract.contractStatus !== 'Active') {
    return 0
  }

  const startDate = new Date(contract.startDate)
  const endDate = new Date(contract.endDate)
  const totalDays = differenceInDays(endDate, startDate)

  if (totalDays <= 0) {
    return 0
  }

  return contract.originalAmount / totalDays
}

/**
 * Get a user-friendly description of the drawdown rate
 */
export function getDrawdownRateDescription(rate: DrawdownRate): string {
  const descriptions = {
    'daily': 'Daily drawdown - funds reduce each day',
    'weekly': 'Weekly drawdown - funds reduce each week', 
    'monthly': 'Monthly drawdown - funds reduce each month'
  }

  return descriptions[rate] || 'Unknown drawdown rate'
}

/**
 * Calculate the percentage of contract completion
 */
export function getContractCompletionPercentage(contract: FundingInformation): number {
  if (contract.contractStatus !== 'Active' || !contract.endDate) {
    return 0
  }

  const now = new Date()
  const startDate = new Date(contract.startDate)
  const endDate = new Date(contract.endDate)

  // If contract hasn't started, return 0
  if (isAfter(startDate, now)) {
    return 0
  }

  // If contract has ended, return 100
  if (isAfter(now, endDate)) {
    return 100
  }

  const totalDuration = differenceInDays(endDate, startDate)
  const elapsed = differenceInDays(now, startDate)

  if (totalDuration <= 0) {
    return 0
  }

  return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
}

/**
 * Validate contract status transitions
 */
export function isValidStatusTransition(currentStatus: ContractStatus, newStatus: ContractStatus): boolean {
  const validTransitions: Record<ContractStatus, ContractStatus[]> = {
    'Draft': ['Active', 'Cancelled'],
    'Active': ['Expired', 'Cancelled'],
    'Expired': ['Renewed', 'Cancelled'],
    'Cancelled': [], // Terminal state
    'Renewed': ['Active'] // New contract created
  }

  return validTransitions[currentStatus]?.includes(newStatus) ?? false
}

/**
 * Get valid status transitions for a contract
 */
export function getValidStatusTransitions(currentStatus: ContractStatus): ContractStatus[] {
  const validTransitions: Record<ContractStatus, ContractStatus[]> = {
    'Draft': ['Active', 'Cancelled'],
    'Active': ['Expired', 'Cancelled'],
    'Expired': ['Renewed', 'Cancelled'],
    'Cancelled': [],
    'Renewed': ['Active']
  }

  return validTransitions[currentStatus] || []
}