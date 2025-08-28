import type { 
  Transaction, 
  TransactionCreateInput, 
  TransactionFilters,
  TransactionSortConfig,
  TransactionListResponse,
  BulkOperationResult,
  TransactionBalancePreview,
  ContractBalanceImpact,
  ResidentBalanceSummary,
  RecentTransactionsSummary
} from 'types/transaction'
import type { FundingInformation } from 'types/resident'
import { getResidentsFromStorage, updateResidentInStorage } from './resident-storage'

const TRANSACTIONS_STORAGE_KEY = 'ndis_transactions'

// Helper function to generate transaction IDs
function generateTransactionId(): string {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substring(2, 8)
  return `TXN-${timestamp}-${random}`.toUpperCase()
}

// Get all transactions from storage
export function getTransactionsFromStorage(): Transaction[] {
  try {
    const stored = localStorage.getItem(TRANSACTIONS_STORAGE_KEY)
    if (!stored) return []
    
    const transactions = JSON.parse(stored) as Transaction[]
    // Ensure dates are Date objects
    return transactions.map(tx => ({
      ...tx,
      occurredAt: new Date(tx.occurredAt),
      createdAt: new Date(tx.createdAt),
      postedAt: tx.postedAt ? new Date(tx.postedAt) : undefined,
      voidedAt: tx.voidedAt ? new Date(tx.voidedAt) : undefined
    }))
  } catch (error) {
    console.error('Error loading transactions:', error)
    return []
  }
}

// Save all transactions to storage
function saveTransactionsToStorage(transactions: Transaction[]): void {
  try {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions))
  } catch (error) {
    console.error('Error saving transactions:', error)
    throw new Error('Failed to save transactions')
  }
}

// Get a single transaction by ID
export function getTransactionById(id: string): Transaction | null {
  const transactions = getTransactionsFromStorage()
  return transactions.find(tx => tx.id === id) || null
}

// Calculate balance impact for a transaction
export function calculateBalanceImpact(
  contractId: string, 
  amount: number,
  excludeTransactionId?: string
): ContractBalanceImpact {
  const residents = getResidentsFromStorage()
  let contract: FundingInformation | null = null
  
  // Find the contract
  for (const resident of residents) {
    const foundContract = resident.fundingInformation.find(c => c.id === contractId)
    if (foundContract) {
      contract = foundContract
      break
    }
  }
  
  if (!contract) {
    return {
      contractId,
      currentBalance: 0,
      impactAmount: amount,
      newBalance: 0,
      isValid: false,
      errorMessage: 'Contract not found'
    }
  }
  
  // Calculate current balance by checking posted transactions
  const transactions = getTransactionsFromStorage()
  const postedTransactions = transactions.filter(tx => 
    tx.contractId === contractId && 
    tx.status === 'posted' &&
    (!excludeTransactionId || tx.id !== excludeTransactionId)
  )
  
  const totalPosted = postedTransactions.reduce((sum, tx) => sum + tx.amount, 0)
  const currentBalance = contract.originalAmount - totalPosted
  const newBalance = currentBalance - amount
  
  return {
    contractId,
    currentBalance,
    impactAmount: amount,
    newBalance,
    isValid: newBalance >= 0,
    errorMessage: newBalance < 0 ? `Insufficient balance. Would exceed by $${Math.abs(newBalance).toFixed(2)}` : undefined
  }
}

// Create a new transaction
export function createTransaction(
  input: TransactionCreateInput,
  createdBy: string = 'system'
): Transaction {
  const transactions = getTransactionsFromStorage()
  
  // Calculate amount if not provided
  const calculatedAmount = input.amount ?? (input.quantity * input.unitPrice)
  
  const newTransaction: Transaction = {
    id: generateTransactionId(),
    ...input,
    amount: calculatedAmount,
    status: 'draft',
    createdAt: new Date(),
    createdBy
  }
  
  transactions.push(newTransaction)
  saveTransactionsToStorage(transactions)
  
  return newTransaction
}

// Update an existing transaction (only if draft)
export function updateTransaction(
  id: string,
  updates: Partial<TransactionCreateInput>
): Transaction {
  const transactions = getTransactionsFromStorage()
  const index = transactions.findIndex(tx => tx.id === id)
  
  if (index === -1) {
    throw new Error('Transaction not found')
  }
  
  const transaction = transactions[index]
  
  if (transaction.status !== 'draft') {
    throw new Error('Can only update draft transactions')
  }
  
  // Apply updates
  const updatedTransaction = { ...transaction, ...updates }
  
  // Recalculate amount if quantity or unit price changed
  if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
    updatedTransaction.amount = updates.amount ?? (updatedTransaction.quantity * updatedTransaction.unitPrice)
  }
  
  transactions[index] = updatedTransaction
  saveTransactionsToStorage(transactions)
  
  return updatedTransaction
}

// Post a transaction (change status from draft to posted)
export function postTransaction(
  id: string,
  postedBy: string = 'system'
): Transaction {
  const transactions = getTransactionsFromStorage()
  const index = transactions.findIndex(tx => tx.id === id)
  
  if (index === -1) {
    throw new Error('Transaction not found')
  }
  
  const transaction = transactions[index]
  
  if (transaction.status !== 'draft') {
    throw new Error('Can only post draft transactions')
  }
  
  // Check balance impact
  const balanceImpact = calculateBalanceImpact(transaction.contractId, transaction.amount, transaction.id)
  if (!balanceImpact.isValid) {
    throw new Error(balanceImpact.errorMessage || 'Transaction would exceed available balance')
  }
  
  // Update transaction status
  transaction.status = 'posted'
  transaction.postedAt = new Date()
  transaction.postedBy = postedBy
  
  transactions[index] = transaction
  saveTransactionsToStorage(transactions)
  
  // Update contract balance in resident storage
  updateContractBalance(transaction.contractId)
  
  return transaction
}

// Void a transaction (change status from posted to voided)
export function voidTransaction(
  id: string,
  reason: string,
  voidedBy: string = 'system'
): Transaction {
  const transactions = getTransactionsFromStorage()
  const index = transactions.findIndex(tx => tx.id === id)
  
  if (index === -1) {
    throw new Error('Transaction not found')
  }
  
  const transaction = transactions[index]
  
  if (transaction.status !== 'posted') {
    throw new Error('Can only void posted transactions')
  }
  
  // Update transaction status
  transaction.status = 'voided'
  transaction.voidedAt = new Date()
  transaction.voidedBy = voidedBy
  transaction.voidReason = reason
  
  transactions[index] = transaction
  saveTransactionsToStorage(transactions)
  
  // Update contract balance in resident storage
  updateContractBalance(transaction.contractId)
  
  return transaction
}

// Update contract balance based on posted transactions
function updateContractBalance(contractId: string): void {
  const residents = getResidentsFromStorage()
  const transactions = getTransactionsFromStorage()
  
  // Find the resident and contract
  let residentToUpdate = null
  let contractIndex = -1
  
  for (const resident of residents) {
    contractIndex = resident.fundingInformation.findIndex(c => c.id === contractId)
    if (contractIndex !== -1) {
      residentToUpdate = resident
      break
    }
  }
  
  if (!residentToUpdate || contractIndex === -1) {
    console.error('Contract not found for balance update:', contractId)
    return
  }
  
  const contract = residentToUpdate.fundingInformation[contractIndex]
  
  // Calculate total posted transactions
  const postedTransactions = transactions.filter(tx => 
    tx.contractId === contractId && tx.status === 'posted'
  )
  
  const totalPosted = postedTransactions.reduce((sum, tx) => sum + tx.amount, 0)
  const newBalance = Math.max(0, contract.originalAmount - totalPosted)
  
  // Update the contract balance
  contract.currentBalance = newBalance
  contract.updatedAt = new Date()
  
  // Save back to storage
  updateResidentInStorage(residentToUpdate.id, residentToUpdate)
}

// Delete a transaction (only if draft)
export function deleteTransaction(id: string): boolean {
  const transactions = getTransactionsFromStorage()
  const index = transactions.findIndex(tx => tx.id === id)
  
  if (index === -1) {
    return false
  }
  
  const transaction = transactions[index]
  
  if (transaction.status !== 'draft') {
    throw new Error('Can only delete draft transactions')
  }
  
  transactions.splice(index, 1)
  saveTransactionsToStorage(transactions)
  
  return true
}

// Apply filters to transactions
function applyFilters(transactions: Transaction[], filters: TransactionFilters): Transaction[] {
  let filtered = [...transactions]
  
  if (filters.dateRange) {
    const { from, to } = filters.dateRange
    filtered = filtered.filter(tx => {
      const txDate = new Date(tx.occurredAt)
      return txDate >= from && txDate <= to
    })
  }
  
  if (filters.residentIds && filters.residentIds.length > 0) {
    filtered = filtered.filter(tx => filters.residentIds!.includes(tx.residentId))
  }
  
  if (filters.contractIds && filters.contractIds.length > 0) {
    filtered = filtered.filter(tx => filters.contractIds!.includes(tx.contractId))
  }
  
  if (filters.houseIds && filters.houseIds.length > 0) {
    const residents = getResidentsFromStorage()
    const residentsByHouse = residents.filter(r => filters.houseIds!.includes(r.houseId))
    const residentIds = residentsByHouse.map(r => r.id)
    filtered = filtered.filter(tx => residentIds.includes(tx.residentId))
  }
  
  if (filters.statuses && filters.statuses.length > 0) {
    filtered = filtered.filter(tx => filters.statuses!.includes(tx.status))
  }
  
  if (filters.serviceCode) {
    filtered = filtered.filter(tx => 
      tx.serviceCode.toLowerCase().includes(filters.serviceCode!.toLowerCase())
    )
  }
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(tx => 
      tx.serviceCode.toLowerCase().includes(searchLower) ||
      tx.description?.toLowerCase().includes(searchLower) ||
      tx.note?.toLowerCase().includes(searchLower)
    )
  }
  
  return filtered
}

// Apply sorting to transactions
function applySorting(transactions: Transaction[], sort: TransactionSortConfig): Transaction[] {
  return [...transactions].sort((a, b) => {
    let aValue: any = a[sort.field as keyof Transaction]
    let bValue: any = b[sort.field as keyof Transaction]
    
    // Handle special sorting fields that require lookups
    if (sort.field === 'residentName' || sort.field === 'houseName' || sort.field === 'contractType') {
      // These would require resident/house lookups - simplified for now
      return 0
    }
    
    // Handle date comparison
    if (aValue instanceof Date && bValue instanceof Date) {
      aValue = aValue.getTime()
      bValue = bValue.getTime()
    }
    
    // Handle string comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }
    
    if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1
    return 0
  })
}

// Get filtered and sorted transactions with pagination
export function getTransactionsList(
  filters: TransactionFilters = {},
  sort: TransactionSortConfig = { field: 'occurredAt', direction: 'desc' },
  page: number = 1,
  pageSize: number = 25
): TransactionListResponse {
  const allTransactions = getTransactionsFromStorage()
  
  // Apply filters
  const filtered = applyFilters(allTransactions, filters)
  
  // Apply sorting
  const sorted = applySorting(filtered, sort)
  
  // Apply pagination
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedTransactions = sorted.slice(startIndex, endIndex)
  
  return {
    transactions: paginatedTransactions,
    total: filtered.length,
    page,
    pageSize,
    hasMore: endIndex < filtered.length
  }
}

// Bulk post transactions
export function bulkPostTransactions(
  transactionIds: string[],
  postedBy: string = 'system'
): BulkOperationResult {
  const result: BulkOperationResult = {
    success: true,
    processed: 0,
    failed: 0,
    errors: []
  }
  
  for (const id of transactionIds) {
    try {
      postTransaction(id, postedBy)
      result.processed++
    } catch (error) {
      result.failed++
      result.errors.push({
        transactionId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  result.success = result.failed === 0
  return result
}

// Bulk void transactions
export function bulkVoidTransactions(
  transactionIds: string[],
  reason: string,
  voidedBy: string = 'system'
): BulkOperationResult {
  const result: BulkOperationResult = {
    success: true,
    processed: 0,
    failed: 0,
    errors: []
  }
  
  for (const id of transactionIds) {
    try {
      voidTransaction(id, reason, voidedBy)
      result.processed++
    } catch (error) {
      result.failed++
      result.errors.push({
        transactionId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
  
  result.success = result.failed === 0
  return result
}

// Get balance preview for a transaction
export function getTransactionBalancePreview(
  contractId: string,
  amount: number
): TransactionBalancePreview {
  const balanceImpact = calculateBalanceImpact(contractId, amount)
  
  return {
    currentBalance: balanceImpact.currentBalance,
    transactionAmount: amount,
    remainingAfterPost: balanceImpact.newBalance,
    canPost: balanceImpact.isValid,
    warningMessage: balanceImpact.errorMessage
  }
}

// Get resident balance summary
export function getResidentBalanceSummary(residentId: string): ResidentBalanceSummary {
  const residents = getResidentsFromStorage()
  const resident = residents.find(r => r.id === residentId)
  
  if (!resident) {
    return {
      residentId,
      activeContracts: [],
      totalAllocated: 0,
      totalRemaining: 0,
      totalSpent: 0
    }
  }
  
  const transactions = getTransactionsFromStorage()
  const activeContracts = resident.fundingInformation.filter(c => c.contractStatus === 'Active')
  
  const contractSummaries = activeContracts.map(contract => {
    const contractTransactions = transactions.filter(tx => 
      tx.contractId === contract.id && tx.status === 'posted'
    )
    
    return {
      contractId: contract.id,
      type: contract.type,
      originalAmount: contract.originalAmount,
      currentBalance: contract.currentBalance,
      recentTransactionCount: contractTransactions.length
    }
  })
  
  const totalAllocated = contractSummaries.reduce((sum, c) => sum + c.originalAmount, 0)
  const totalRemaining = contractSummaries.reduce((sum, c) => sum + c.currentBalance, 0)
  const totalSpent = totalAllocated - totalRemaining
  
  return {
    residentId,
    activeContracts: contractSummaries,
    totalAllocated,
    totalRemaining,
    totalSpent
  }
}

// Get recent transactions for a resident
export function getRecentTransactionsSummary(
  residentId: string,
  limit: number = 5
): RecentTransactionsSummary {
  const allTransactions = getTransactionsFromStorage()
  const residentTransactions = allTransactions
    .filter(tx => tx.residentId === residentId)
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
  
  return {
    residentId,
    transactions: residentTransactions.slice(0, limit),
    totalCount: residentTransactions.length,
    hasMore: residentTransactions.length > limit
  }
}