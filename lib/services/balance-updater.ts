import type { AuditLogEntry, FundingInformation, Resident } from 'types/resident'
import { calculateCurrentBalance } from '../utils/funding-calculations'
import { 
  generateId, 
  getResidentsFromStorage,
  saveResidentsToStorage
} from '../utils/resident-storage'

interface BalanceUpdateResult {
  totalProcessed: number
  totalUpdated: number
  errors: Array<{ residentId: string; error: string }>
}

/**
 * Update balances for all active contracts across all residents
 */
export async function updateAllContractBalances(): Promise<BalanceUpdateResult> {
  const residents = getResidentsFromStorage()
  let totalProcessed = 0
  let totalUpdated = 0
  const errors: Array<{ residentId: string; error: string }> = []

  try {
    for (const resident of residents) {
      try {
        const result = await updateResidentContractBalances(resident)
        totalProcessed += result.processed
        totalUpdated += result.updated
      } catch (error) {
        errors.push({
          residentId: resident.id,
          error: (error as Error).message || 'Unknown error'
        })
      }
    }

    return {
      totalProcessed,
      totalUpdated,
      errors
    }
  } catch (error) {
    throw new Error(`Failed to update contract balances: ${(error as Error).message}`)
  }
}

/**
 * Update balances for a specific resident's contracts
 */
export async function updateResidentContractBalances(resident: Resident): Promise<{
  processed: number
  updated: number
}> {
  let processed = 0
  let updated = 0
  let hasUpdates = false
  const now = new Date()
  const mockUser = 'system'
  const auditEntries: AuditLogEntry[] = []

  const updatedFunding = resident.fundingInformation.map(funding => {
    processed++
    
    // Only update active contracts with auto-drawdown enabled
    if (funding.contractStatus !== 'Active' || !funding.autoDrawdown) {
      return funding
    }

    const newBalance = calculateCurrentBalance(funding)
    
    // Check if balance has actually changed (avoid unnecessary updates)
    if (Math.abs(newBalance - funding.currentBalance) < 0.01) {
      return funding
    }

    updated++
    hasUpdates = true

    // Create audit entry for balance update
    auditEntries.push({
      id: generateId(),
      residentId: resident.id,
      action: 'BALANCE_UPDATED',
      field: 'currentBalance',
      oldValue: funding.currentBalance.toFixed(2),
      newValue: newBalance.toFixed(2),
      timestamp: now,
      userId: mockUser,
      userEmail: 'system@automated.com'
    })

    return {
      ...funding,
      currentBalance: newBalance,
      lastDrawdownDate: now,
      updatedAt: now
    }
  })

  // Only save if there were actual updates
  if (hasUpdates) {
    const updatedResident: Resident = {
      ...resident,
      fundingInformation: updatedFunding,
      auditTrail: [...resident.auditTrail, ...auditEntries],
      updatedAt: now,
      updatedBy: mockUser
    }

    // Update storage
    const allResidents = getResidentsFromStorage()
    const residentIndex = allResidents.findIndex(r => r.id === resident.id)
    if (residentIndex !== -1) {
      allResidents[residentIndex] = updatedResident
      saveResidentsToStorage(allResidents)
    }
  }

  return { processed, updated }
}

/**
 * Update balances for a specific contract
 */
export async function updateContractBalance(residentId: string, contractId: string): Promise<FundingInformation | null> {
  const residents = getResidentsFromStorage()
  const residentIndex = residents.findIndex(r => r.id === residentId)
  
  if (residentIndex === -1) {
    return null
  }

  const resident = residents[residentIndex]
  const contractIndex = resident.fundingInformation.findIndex(f => f.id === contractId)
  
  if (contractIndex === -1) {
    return null
  }

  const contract = resident.fundingInformation[contractIndex]
  
  // Only update active contracts
  if (contract.contractStatus !== 'Active') {
    return contract
  }

  const newBalance = calculateCurrentBalance(contract)
  const now = new Date()
  const mockUser = 'system'

  const updatedContract: FundingInformation = {
    ...contract,
    currentBalance: newBalance,
    lastDrawdownDate: now,
    updatedAt: now
  }

  // Create audit entry
  const balanceAudit: AuditLogEntry = {
    id: generateId(),
    residentId,
    action: 'BALANCE_UPDATED',
    field: 'currentBalance',
    oldValue: contract.currentBalance.toFixed(2),
    newValue: newBalance.toFixed(2),
    timestamp: now,
    userId: mockUser,
    userEmail: 'system@automated.com'
  }

  // Update resident
  const updatedFunding = [...resident.fundingInformation]
  updatedFunding[contractIndex] = updatedContract

  const updatedResident: Resident = {
    ...resident,
    fundingInformation: updatedFunding,
    auditTrail: [...resident.auditTrail, balanceAudit],
    updatedAt: now,
    updatedBy: mockUser
  }

  residents[residentIndex] = updatedResident
  saveResidentsToStorage(residents)

  return updatedContract
}

/**
 * Get contracts that are expiring within a specified number of days
 */
export function getExpiringContracts(daysThreshold: number = 30): Array<{
  resident: Resident
  contract: FundingInformation
  daysUntilExpiry: number
}> {
  const residents = getResidentsFromStorage()
  const expiringContracts: Array<{
    resident: Resident
    contract: FundingInformation
    daysUntilExpiry: number
  }> = []

  for (const resident of residents) {
    for (const contract of resident.fundingInformation) {
      if (contract.contractStatus === 'Active' && contract.endDate) {
        const endDate = new Date(contract.endDate)
        const now = new Date()
        const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysUntilExpiry <= daysThreshold && daysUntilExpiry > 0) {
          expiringContracts.push({
            resident,
            contract,
            daysUntilExpiry
          })
        }
      }
    }
  }

  return expiringContracts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
}

/**
 * Mark expired contracts as expired
 */
export async function markExpiredContracts(): Promise<{
  processed: number
  expired: number
}> {
  const residents = getResidentsFromStorage()
  let processed = 0
  let expired = 0
  const now = new Date()
  const mockUser = 'system'

  for (let residentIndex = 0; residentIndex < residents.length; residentIndex++) {
    const resident = residents[residentIndex]
    let hasChanges = false
    const auditEntries: AuditLogEntry[] = []

    const updatedFunding = resident.fundingInformation.map(contract => {
      processed++
      
      // Check if active contract has expired
      if (contract.contractStatus === 'Active' && contract.endDate) {
        const endDate = new Date(contract.endDate)
        if (now > endDate) {
          expired++
          hasChanges = true

          // Create audit entry
          auditEntries.push({
            id: generateId(),
            residentId: resident.id,
            action: 'CONTRACT_EXPIRED',
            field: 'contractStatus',
            oldValue: 'Active',
            newValue: 'Expired',
            timestamp: now,
            userId: mockUser,
            userEmail: 'system@automated.com'
          })

          return {
            ...contract,
            contractStatus: 'Expired' as const,
            currentBalance: 0, // Expired contracts have no balance
            updatedAt: now
          }
        }
      }
      
      return contract
    })

    if (hasChanges) {
      residents[residentIndex] = {
        ...resident,
        fundingInformation: updatedFunding,
        auditTrail: [...resident.auditTrail, ...auditEntries],
        updatedAt: now,
        updatedBy: mockUser
      }
    }
  }

  if (expired > 0) {
    saveResidentsToStorage(residents)
  }

  return { processed, expired }
}

/**
 * Scheduled balance update service (would be called by a cron job in production)
 */
export async function scheduledBalanceUpdate(): Promise<void> {
  console.log('Starting scheduled balance update...')
  
  try {
    // Update all contract balances
    const balanceResult = await updateAllContractBalances()
    console.log(`Balance update complete: ${balanceResult.totalUpdated}/${balanceResult.totalProcessed} contracts updated`)
    
    if (balanceResult.errors.length > 0) {
      console.warn('Balance update errors:', balanceResult.errors)
    }

    // Mark expired contracts
    const expiryResult = await markExpiredContracts()
    console.log(`Expiry check complete: ${expiryResult.expired}/${expiryResult.processed} contracts expired`)

    // Log expiring contracts for notification
    const expiringContracts = getExpiringContracts(30)
    if (expiringContracts.length > 0) {
      console.log(`${expiringContracts.length} contracts expiring within 30 days`)
      for (const item of expiringContracts.slice(0, 5)) { // Log first 5
        console.log(`- ${item.resident.firstName} ${item.resident.lastName}: ${item.contract.type} expires in ${item.daysUntilExpiry} days`)
      }
    }
  } catch (error) {
    console.error('Scheduled balance update failed:', error)
    throw error
  }
}

/**
 * Get system health metrics for monitoring
 */
export function getSystemHealthMetrics() {
  const residents = getResidentsFromStorage()
  let totalContracts = 0
  let activeContracts = 0
  let totalBalance = 0
  let totalOriginal = 0
  let contractsNeedingUpdate = 0

  for (const resident of residents) {
    for (const contract of resident.fundingInformation) {
      totalContracts++
      totalOriginal += contract.originalAmount
      
      if (contract.contractStatus === 'Active') {
        activeContracts++
        totalBalance += contract.currentBalance
        
        // Check if balance calculation is stale (more than 24 hours old)
        const lastUpdate = contract.lastDrawdownDate ? new Date(contract.lastDrawdownDate) : new Date(contract.updatedAt)
        const hoursSinceUpdate = (new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60)
        
        if (contract.autoDrawdown && hoursSinceUpdate > 24) {
          contractsNeedingUpdate++
        }
      }
    }
  }

  return {
    totalResidents: residents.length,
    totalContracts,
    activeContracts,
    totalBalance,
    totalOriginal,
    totalDrawnDown: totalOriginal - totalBalance,
    contractsNeedingUpdate,
    lastUpdateTime: new Date().toISOString()
  }
}