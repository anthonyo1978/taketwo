// Mock persistence utility for Resident data using localStorage (client) and memory (server)
// Designed to be easily swapped with real database implementation

import type { 
  AuditLogEntry, 
  ContractBalanceSummary, 
  ContractStatus,
  FundingInformation,
  Resident,
  ResidentCreateInput,
  ResidentStatus,
  ResidentUpdateInput
} from "types/resident"
import { calculateBalanceSummary, calculateCurrentBalance, isValidStatusTransition } from "./funding-calculations"

const STORAGE_KEY = 'residents_data'

// Server-side in-memory storage for API routes
let serverResidents: Resident[] = []

// Parse dates correctly when loading from JSON
const reviveDates = (key: string, value: unknown): unknown => {
  const dateFields = ['createdAt', 'updatedAt', 'dateOfBirth', 'startDate', 'endDate', 'timestamp']
  if (dateFields.includes(key) && typeof value === 'string') {
    return new Date(value)
  }
  return value
}

// Serialize dates correctly when saving to JSON
const replaceDates = (key: string, value: unknown): unknown => {
  if (value instanceof Date) {
    return value.toISOString()
  }
  return value
}

// Convert File to base64 string for storage
export const fileToBase64 = async (file: File): Promise<string> => {
  // Server-side: File objects have arrayBuffer() method
  if (typeof window === 'undefined') {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64 = buffer.toString('base64')
      // Create data URL format like FileReader would
      return `data:${file.type};base64,${base64}`
    } catch (error) {
      throw new Error(`Failed to convert file to base64: ${error}`)
    }
  }
  
  // Client-side: use FileReader
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

export const getResidentsFromStorage = (): Resident[] => {
  // Server-side: use in-memory storage
  if (typeof window === 'undefined') {
    return serverResidents
  }
  
  // Client-side: use localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const residents = JSON.parse(stored, reviveDates) as Resident[]
    return Array.isArray(residents) ? residents : []
  } catch (error) {
    console.error('Failed to load residents from storage:', error)
    return []
  }
}

export const saveResidentsToStorage = (residents: Resident[]): void => {
  // Server-side: update in-memory storage
  if (typeof window === 'undefined') {
    serverResidents = [...residents]
    return
  }
  
  // Client-side: update localStorage
  try {
    const serialized = JSON.stringify(residents, replaceDates)
    localStorage.setItem(STORAGE_KEY, serialized)
  } catch (error) {
    console.error('Failed to save residents to storage:', error)
  }
}

export const getResidentsByHouseId = (houseId: string): Resident[] => {
  const residents = getResidentsFromStorage()
  return residents.filter(resident => resident.houseId === houseId)
}

export const getAllResidents = (): Resident[] => {
  return getResidentsFromStorage()
}

// Generate unique ID for audit entries and funding
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export const addResidentToStorage = (residentData: ResidentCreateInput, id: string, houseId: string): Resident => {
  const now = new Date()
  const mockUser = 'admin' // TODO: Replace with real user when auth is implemented
  
  // Create initial audit log entry
  const initialAuditEntry: AuditLogEntry = {
    id: generateId(),
    residentId: id,
    action: 'CREATED',
    timestamp: now,
    userId: mockUser,
    userEmail: 'admin@example.com'
  }
  
  const newResident: Resident = {
    id,
    houseId,
    ...residentData,
    status: residentData.status || 'Draft',
    fundingInformation: [],
    preferences: residentData.preferences || {},
    detailedNotes: residentData.notes,
    auditTrail: [initialAuditEntry],
    createdAt: now,
    createdBy: mockUser,
    updatedAt: now,
    updatedBy: mockUser
  }
  
  const residents = getResidentsFromStorage()
  residents.push(newResident)
  saveResidentsToStorage(residents)
  
  return newResident
}

// Update resident information
export const updateResidentInStorage = (id: string, updates: ResidentUpdateInput): Resident | null => {
  const residents = getResidentsFromStorage()
  const residentIndex = residents.findIndex(r => r.id === id)
  
  if (residentIndex === -1) {
    return null
  }
  
  const now = new Date()
  const mockUser = 'admin' // TODO: Replace with real user when auth is implemented
  const existingResident = residents[residentIndex]
  
  // Create audit log entries for changes
  const auditEntries: AuditLogEntry[] = []
  
  Object.keys(updates).forEach(key => {
    const typedKey = key as keyof ResidentUpdateInput
    const oldValue = existingResident[typedKey as keyof Resident]
    const newValue = updates[typedKey]
    
    if (oldValue !== newValue && newValue !== undefined) {
      auditEntries.push({
        id: generateId(),
        residentId: id,
        action: 'UPDATED',
        field: key,
        oldValue: oldValue ? String(oldValue) : undefined,
        newValue: newValue ? String(newValue) : undefined,
        timestamp: now,
        userId: mockUser,
        userEmail: 'admin@example.com'
      })
    }
  })
  
  // Update the resident
  const updatedResident: Resident = {
    ...existingResident,
    ...updates,
    auditTrail: [...existingResident.auditTrail, ...auditEntries],
    updatedAt: now,
    updatedBy: mockUser
  }
  
  residents[residentIndex] = updatedResident
  saveResidentsToStorage(residents)
  
  return updatedResident
}

// Status change with audit logging
export const changeResidentStatus = (id: string, newStatus: ResidentStatus): Resident | null => {
  const residents = getResidentsFromStorage()
  const residentIndex = residents.findIndex(r => r.id === id)
  
  if (residentIndex === -1) {
    return null
  }
  
  const now = new Date()
  const mockUser = 'admin'
  const existingResident = residents[residentIndex]
  
  // Validate status transition
  const validTransitions = {
    'Draft': ['Active', 'Deactivated'],
    'Active': ['Deactivated'],
    'Deactivated': ['Active']
  }
  
  const allowedTransitions = validTransitions[existingResident.status]
  if (!allowedTransitions?.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${existingResident.status} to ${newStatus}`)
  }
  
  // Create audit log entry for status change
  const statusChangeAudit: AuditLogEntry = {
    id: generateId(),
    residentId: id,
    action: 'STATUS_CHANGED',
    field: 'status',
    oldValue: existingResident.status,
    newValue: newStatus,
    timestamp: now,
    userId: mockUser,
    userEmail: 'admin@example.com'
  }
  
  // Update the resident
  const updatedResident: Resident = {
    ...existingResident,
    status: newStatus,
    auditTrail: [...existingResident.auditTrail, statusChangeAudit],
    updatedAt: now,
    updatedBy: mockUser
  }
  
  residents[residentIndex] = updatedResident
  saveResidentsToStorage(residents)
  
  return updatedResident
}

// Add funding information
export const addFundingToResident = (residentId: string, fundingData: Omit<FundingInformation, 'id' | 'createdAt' | 'updatedAt'> & { contractStatus?: ContractStatus; supportItemCode?: string; dailySupportItemCost?: number }): Resident | null => {
  const residents = getResidentsFromStorage()
  const residentIndex = residents.findIndex(r => r.id === residentId)
  
  if (residentIndex === -1) {
    return null
  }
  
  const now = new Date()
  const mockUser = 'admin'
  const existingResident = residents[residentIndex]
  
  const newFunding: FundingInformation = {
    ...fundingData,
    id: generateId(),
    contractStatus: fundingData.contractStatus || 'Draft',
    originalAmount: fundingData.amount,
    currentBalance: fundingData.amount,
    drawdownRate: fundingData.drawdownRate || 'monthly',
    autoDrawdown: fundingData.autoDrawdown ?? true,
    lastDrawdownDate: undefined,
    renewalDate: fundingData.renewalDate,
    parentContractId: undefined,
    supportItemCode: fundingData.supportItemCode,
    dailySupportItemCost: fundingData.dailySupportItemCost,
    createdAt: now,
    updatedAt: now
  }
  
  // Create audit log entry
  const fundingAudit: AuditLogEntry = {
    id: generateId(),
    residentId,
    action: 'CONTRACT_CREATED',
    field: 'fundingInformation',
    newValue: `${newFunding.type} Contract: $${newFunding.originalAmount} (${newFunding.drawdownRate} drawdown)`,
    timestamp: now,
    userId: mockUser,
    userEmail: 'admin@example.com'
  }
  
  // Update the resident
  const updatedResident: Resident = {
    ...existingResident,
    fundingInformation: [...existingResident.fundingInformation, newFunding],
    auditTrail: [...existingResident.auditTrail, fundingAudit],
    updatedAt: now,
    updatedBy: mockUser
  }
  
  residents[residentIndex] = updatedResident
  saveResidentsToStorage(residents)
  
  return updatedResident
}

// Update funding information
export const updateFundingInResident = (residentId: string, fundingId: string, updates: Partial<FundingInformation>): Resident | null => {
  const residents = getResidentsFromStorage()
  const residentIndex = residents.findIndex(r => r.id === residentId)
  
  if (residentIndex === -1) {
    return null
  }
  
  const now = new Date()
  const mockUser = 'admin'
  const existingResident = residents[residentIndex]
  
  const fundingIndex = existingResident.fundingInformation.findIndex(f => f.id === fundingId)
  if (fundingIndex === -1) {
    return null
  }
  
  // Update funding information
  const updatedFunding = {
    ...existingResident.fundingInformation[fundingIndex],
    ...updates,
    updatedAt: now
  }
  
  // Create audit log entry
  const fundingAudit: AuditLogEntry = {
    id: generateId(),
    residentId,
    action: 'FUNDING_UPDATED',
    field: 'fundingInformation',
    oldValue: `${existingResident.fundingInformation[fundingIndex].type}: $${existingResident.fundingInformation[fundingIndex].amount}`,
    newValue: `${updatedFunding.type}: $${updatedFunding.amount}`,
    timestamp: now,
    userId: mockUser,
    userEmail: 'admin@example.com'
  }
  
  // Update the resident
  const newFundingList = [...existingResident.fundingInformation]
  newFundingList[fundingIndex] = updatedFunding
  
  const updatedResident: Resident = {
    ...existingResident,
    fundingInformation: newFundingList,
    auditTrail: [...existingResident.auditTrail, fundingAudit],
    updatedAt: now,
    updatedBy: mockUser
  }
  
  residents[residentIndex] = updatedResident
  saveResidentsToStorage(residents)
  
  return updatedResident
}

// Remove funding information
export const removeFundingFromResident = (residentId: string, fundingId: string): Resident | null => {
  const residents = getResidentsFromStorage()
  const residentIndex = residents.findIndex(r => r.id === residentId)
  
  if (residentIndex === -1) {
    return null
  }
  
  const now = new Date()
  const mockUser = 'admin'
  const existingResident = residents[residentIndex]
  
  const fundingToRemove = existingResident.fundingInformation.find(f => f.id === fundingId)
  if (!fundingToRemove) {
    return null
  }
  
  // Create audit log entry
  const fundingAudit: AuditLogEntry = {
    id: generateId(),
    residentId,
    action: 'FUNDING_REMOVED',
    field: 'fundingInformation',
    oldValue: `${fundingToRemove.type}: $${fundingToRemove.amount}`,
    timestamp: now,
    userId: mockUser,
    userEmail: 'admin@example.com'
  }
  
  // Update the resident
  const updatedResident: Resident = {
    ...existingResident,
    fundingInformation: existingResident.fundingInformation.filter(f => f.id !== fundingId),
    auditTrail: [...existingResident.auditTrail, fundingAudit],
    updatedAt: now,
    updatedBy: mockUser
  }
  
  residents[residentIndex] = updatedResident
  saveResidentsToStorage(residents)
  
  return updatedResident
}

export const getResidentByIdFromStorage = (id: string): Resident | null => {
  const residents = getResidentsFromStorage()
  const resident = residents.find(resident => resident.id === id) || null
  
  if (resident) {
    // Update contract balances before returning
    return updateContractBalances(resident)
  }
  
  return null
}

// Update contract balances for all funding information
export const updateContractBalances = (resident: Resident): Resident => {
  const updatedFunding = resident.fundingInformation.map(funding => ({
    ...funding,
    currentBalance: calculateCurrentBalance(funding),
    lastDrawdownDate: new Date()
  }))
  
  return {
    ...resident,
    fundingInformation: updatedFunding
  }
}

// Update contract status with validation and audit logging
export const updateContractStatus = (residentId: string, fundingId: string, newStatus: ContractStatus): Resident | null => {
  const residents = getResidentsFromStorage()
  const residentIndex = residents.findIndex(r => r.id === residentId)
  
  if (residentIndex === -1) {
    return null
  }
  
  const now = new Date()
  const mockUser = 'admin'
  const existingResident = residents[residentIndex]
  
  const fundingIndex = existingResident.fundingInformation.findIndex(f => f.id === fundingId)
  if (fundingIndex === -1) {
    return null
  }
  
  const currentContract = existingResident.fundingInformation[fundingIndex]
  
  // Validate status transition
  if (!isValidStatusTransition(currentContract.contractStatus, newStatus)) {
    throw new Error(`Invalid contract status transition from ${currentContract.contractStatus} to ${newStatus}`)
  }
  
  // Prepare updated contract
  let updatedContract = {
    ...currentContract,
    contractStatus: newStatus,
    updatedAt: now
  }
  
  // Special handling for activation
  if (newStatus === 'Active' && currentContract.contractStatus === 'Draft') {
    updatedContract = {
      ...updatedContract,
      currentBalance: currentContract.originalAmount,
      lastDrawdownDate: now
    }
  }
  
  // Create audit log entry
  const statusAudit: AuditLogEntry = {
    id: generateId(),
    residentId,
    action: 'CONTRACT_STATUS_CHANGED',
    field: 'contractStatus',
    oldValue: currentContract.contractStatus,
    newValue: newStatus,
    timestamp: now,
    userId: mockUser,
    userEmail: 'admin@example.com'
  }
  
  // Update the resident
  const newFundingList = [...existingResident.fundingInformation]
  newFundingList[fundingIndex] = updatedContract
  
  const updatedResident: Resident = {
    ...existingResident,
    fundingInformation: newFundingList,
    auditTrail: [...existingResident.auditTrail, statusAudit],
    updatedAt: now,
    updatedBy: mockUser
  }
  
  residents[residentIndex] = updatedResident
  saveResidentsToStorage(residents)
  
  return updatedResident
}

// Create a contract renewal
export const createContractRenewal = (residentId: string, parentContractId: string, renewalData: {
  amount: number
  startDate: Date
  endDate?: Date
  description?: string
  drawdownRate?: 'daily' | 'weekly' | 'monthly'
  autoDrawdown?: boolean
}): Resident | null => {
  const residents = getResidentsFromStorage()
  const residentIndex = residents.findIndex(r => r.id === residentId)
  
  if (residentIndex === -1) {
    return null
  }
  
  const now = new Date()
  const mockUser = 'admin'
  const existingResident = residents[residentIndex]
  
  // Find parent contract
  const parentContract = existingResident.fundingInformation.find(f => f.id === parentContractId)
  if (!parentContract) {
    throw new Error('Parent contract not found')
  }
  
  // Create new contract
  const renewalContract: FundingInformation = {
    id: generateId(),
    type: parentContract.type,
    amount: renewalData.amount,
    startDate: renewalData.startDate,
    endDate: renewalData.endDate,
    description: renewalData.description || parentContract.description,
    isActive: true,
    contractStatus: 'Draft' as ContractStatus,
    originalAmount: renewalData.amount,
    currentBalance: renewalData.amount,
    drawdownRate: renewalData.drawdownRate || parentContract.drawdownRate,
    autoDrawdown: renewalData.autoDrawdown ?? parentContract.autoDrawdown,
    lastDrawdownDate: undefined,
    renewalDate: undefined,
    parentContractId: parentContractId,
    createdAt: now,
    updatedAt: now
  }
  
  // Create audit log entry
  const renewalAudit: AuditLogEntry = {
    id: generateId(),
    residentId,
    action: 'CONTRACT_RENEWED',
    field: 'fundingInformation',
    oldValue: `${parentContract.type}: $${parentContract.originalAmount}`,
    newValue: `${renewalContract.type}: $${renewalContract.originalAmount} (Renewal)`,
    timestamp: now,
    userId: mockUser,
    userEmail: 'admin@example.com'
  }
  
  // Update parent contract status to 'Renewed'
  const updatedParentContract = {
    ...parentContract,
    contractStatus: 'Renewed' as ContractStatus,
    updatedAt: now
  }
  
  const parentIndex = existingResident.fundingInformation.findIndex(f => f.id === parentContractId)
  const newFundingList = [...existingResident.fundingInformation]
  newFundingList[parentIndex] = updatedParentContract
  newFundingList.push(renewalContract)
  
  // Update the resident
  const updatedResident: Resident = {
    ...existingResident,
    fundingInformation: newFundingList,
    auditTrail: [...existingResident.auditTrail, renewalAudit],
    updatedAt: now,
    updatedBy: mockUser
  }
  
  residents[residentIndex] = updatedResident
  saveResidentsToStorage(residents)
  
  return updatedResident
}

// Get contract balance summary for a resident
export const getContractBalanceSummary = (residentId: string): ContractBalanceSummary | null => {
  const resident = getResidentByIdFromStorage(residentId)
  
  if (!resident) {
    return null
  }
  
  return calculateBalanceSummary(resident.fundingInformation)
}

// Get contract balance summary for all residents
export const getAllContractBalances = (): ContractBalanceSummary => {
  const residents = getResidentsFromStorage()
  const allContracts = residents.flatMap(r => r.fundingInformation)
  
  return calculateBalanceSummary(allContracts)
}

export const isResidentIdTaken = (id: string): boolean => {
  const residents = getResidentsFromStorage()
  return residents.some(resident => resident.id === id)
}

// Utility for testing - clears all resident data
export const clearResidentsStorage = (): void => {
  // Server-side: clear in-memory storage
  if (typeof window === 'undefined') {
    serverResidents = []
    return
  }
  
  // Client-side: clear localStorage
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear residents storage:', error)
  }
}