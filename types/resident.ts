export type Gender = 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say'

export type ResidentStatus = 'Draft' | 'Active' | 'Deactivated'

export type FundingType = 'NDIS' | 'Government' | 'Private' | 'Family' | 'Other'

export type ContractStatus = 'Draft' | 'Active' | 'Expired' | 'Cancelled' | 'Renewed'

export type DrawdownRate = 'daily' | 'weekly' | 'fortnightly' | 'monthly'

export interface FundingInformation {
  id: string
  type: FundingType
  amount: number
  startDate: Date
  endDate?: Date
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  // Contract-specific fields
  contractStatus: ContractStatus
  originalAmount: number
  currentBalance: number
  drawdownRate: DrawdownRate
  autoDrawdown: boolean
  lastDrawdownDate?: Date
  renewalDate?: Date
  parentContractId?: string
  // Support item fields
  supportItemCode?: string
  dailySupportItemCost?: number
}

export interface ResidentPreferences {
  dietary?: string[]
  medical?: string[]
  accessibility?: string[]
  communication?: string[]
  social?: string[]
  other?: string
}

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  email?: string
}

export interface AuditLogEntry {
  id: string
  residentId: string
  action: string
  field?: string
  oldValue?: string
  newValue?: string
  timestamp: Date
  userId: string
  userEmail: string
}

export interface Resident {
  id: string
  houseId: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  gender: Gender
  phone?: string
  email?: string
  ndisId?: string
  photoBase64?: string
  notes?: string
  status: ResidentStatus
  fundingInformation: FundingInformation[]
  preferences: ResidentPreferences
  detailedNotes?: string
  emergencyContact?: EmergencyContact
  auditTrail: AuditLogEntry[]
  createdAt: Date
  createdBy: string
  updatedAt: Date
  updatedBy: string
}

export interface ResidentCreateInput {
  firstName: string
  lastName: string
  dateOfBirth: Date
  gender: Gender
  phone?: string
  email?: string
  ndisId?: string
  photoBase64?: string
  notes?: string
  status?: ResidentStatus
  preferences?: ResidentPreferences
  emergencyContact?: EmergencyContact
}

export interface ResidentUpdateInput {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  ndisId?: string
  photoBase64?: string
  status?: ResidentStatus
  detailedNotes?: string
  preferences?: ResidentPreferences
  emergencyContact?: EmergencyContact
}

export interface ContractBalanceSummary {
  totalOriginal: number
  totalCurrent: number
  totalDrawnDown: number
  activeContracts: number
  expiringSoon: number
}