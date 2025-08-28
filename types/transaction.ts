export type TransactionStatus = 'draft' | 'posted' | 'voided'

export interface Transaction {
  id: string
  residentId: string
  contractId: string
  occurredAt: Date
  serviceCode: string
  description?: string
  quantity: number
  unitPrice: number
  amount: number // quantity * unitPrice (can be overridden)
  status: TransactionStatus
  note?: string
  createdAt: Date
  createdBy: string
  postedAt?: Date
  postedBy?: string
  voidedAt?: Date
  voidedBy?: string
  voidReason?: string
}

export interface TransactionCreateInput {
  residentId: string
  contractId: string
  occurredAt: Date
  serviceCode: string
  description?: string
  quantity: number
  unitPrice: number
  amount?: number // Optional override
  note?: string
}

export interface TransactionUpdateInput {
  occurredAt?: Date
  serviceCode?: string
  description?: string
  quantity?: number
  unitPrice?: number
  amount?: number
  note?: string
}

export interface TransactionFilters {
  dateRange?: { from: Date; to: Date }
  residentIds?: string[]
  contractIds?: string[]
  houseIds?: string[]
  statuses?: TransactionStatus[]
  serviceCode?: string
  search?: string
}

export interface TransactionSortConfig {
  field: keyof Transaction | 'residentName' | 'houseName' | 'contractType'
  direction: 'asc' | 'desc'
}

export interface TransactionListResponse {
  transactions: Transaction[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface BulkTransactionOperation {
  transactionIds: string[]
  action: 'post' | 'void'
  reason?: string // Required for void operations
}

export interface BulkOperationResult {
  success: boolean
  processed: number
  failed: number
  errors: Array<{ transactionId: string; error: string }>
}

export interface TransactionBalancePreview {
  currentBalance: number
  transactionAmount: number
  remainingAfterPost: number
  canPost: boolean
  warningMessage?: string
}

// Common service codes for NDIS providers
export const COMMON_SERVICE_CODES = [
  { code: 'SDA_RENT', label: 'SDA Rent', description: 'Specialist Disability Accommodation rental' },
  { code: 'SIL_SUPPORT', label: 'SIL Support', description: 'Supported Independent Living hours' },
  { code: 'CORE_SUPPORT', label: 'Core Support', description: 'Core supports and services' },
  { code: 'CAPACITY_BUILDING', label: 'Capacity Building', description: 'Capacity building supports' },
  { code: 'TRANSPORT', label: 'Transport', description: 'Transportation assistance' },
  { code: 'EQUIPMENT', label: 'Equipment', description: 'Assistive technology and equipment' },
  { code: 'THERAPY', label: 'Therapy', description: 'Allied health and therapy services' },
  { code: 'RESPITE', label: 'Respite', description: 'Short-term accommodation and respite' },
  { code: 'OTHER', label: 'Other', description: 'Other approved NDIS services' }
] as const

export type ServiceCode = typeof COMMON_SERVICE_CODES[number]['code']

// Balance summary for resident pages
export interface ResidentBalanceSummary {
  residentId: string
  activeContracts: Array<{
    contractId: string
    type: string
    originalAmount: number
    currentBalance: number
    recentTransactionCount: number
  }>
  totalAllocated: number
  totalRemaining: number
  totalSpent: number
}

// Recent transactions for resident pages
export interface RecentTransactionsSummary {
  residentId: string
  transactions: Transaction[]
  totalCount: number
  hasMore: boolean
}

export interface ContractBalanceImpact {
  contractId: string
  currentBalance: number
  impactAmount: number
  newBalance: number
  isValid: boolean
  errorMessage?: string
}