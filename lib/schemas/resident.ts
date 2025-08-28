import { z } from "zod"

// Status validation with transition rules
export const residentStatusSchema = z.enum(['Draft', 'Active', 'Deactivated'] as const)

export const fundingTypeSchema = z.enum(['NDIS', 'Government', 'Private', 'Family', 'Other'] as const)

// Contract status and drawdown rate schemas
export const contractStatusSchema = z.enum(['Draft', 'Active', 'Expired', 'Cancelled', 'Renewed'] as const)
export const drawdownRateSchema = z.enum(['daily', 'weekly', 'monthly'] as const)

// Funding information schema with contract fields
export const fundingInformationSchema = z.object({
  id: z.string().optional(), // Optional for create, required for update
  type: fundingTypeSchema,
  amount: z.number()
    .min(0, "Funding amount must be positive")
    .max(999999.99, "Funding amount must be less than $1,000,000")
    .refine(val => Number.isFinite(val), "Invalid funding amount"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  description: z.string()
    .max(200, "Description must be no more than 200 characters")
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().default(true),
  // Contract-specific fields
  contractStatus: contractStatusSchema.default('Draft'),
  originalAmount: z.number()
    .min(0, "Original amount must be positive")
    .max(999999.99, "Original amount must be less than $1,000,000")
    .refine(val => Number.isFinite(val), "Invalid original amount"),
  currentBalance: z.number()
    .min(0, "Current balance cannot be negative")
    .max(999999.99, "Current balance must be less than $1,000,000")
    .refine(val => Number.isFinite(val), "Invalid current balance"),
  drawdownRate: drawdownRateSchema.default('monthly'),
  autoDrawdown: z.boolean().default(true),
  lastDrawdownDate: z.coerce.date().optional(),
  renewalDate: z.coerce.date().optional(),
  parentContractId: z.string().optional(),
  // Support item fields
  supportItemCode: z.string()
    .max(50, "Support item code must be no more than 50 characters")
    .optional()
    .or(z.literal('')),
  dailySupportItemCost: z.number()
    .min(0, "Daily support item cost cannot be negative")
    .optional()
}).refine(
  (data) => !data.endDate || data.startDate <= data.endDate,
  {
    message: "End date must be after start date",
    path: ["endDate"]
  }
).refine(
  (data) => data.currentBalance <= data.originalAmount,
  {
    message: "Current balance cannot exceed original amount",
    path: ["currentBalance"]
  }
).refine(
  (data) => !data.renewalDate || data.renewalDate > data.startDate,
  {
    message: "Renewal date must be after start date",
    path: ["renewalDate"]
  }
)

// Preferences schema
export const preferencesSchema = z.object({
  dietary: z.array(z.string()).optional(),
  medical: z.array(z.string()).optional(),
  accessibility: z.array(z.string()).optional(),
  communication: z.array(z.string()).optional(),
  social: z.array(z.string()).optional(),
  other: z.string()
    .max(500, "Other preferences must be no more than 500 characters")
    .optional()
    .or(z.literal(''))
})

// Emergency contact schema
export const emergencyContactSchema = z.object({
  name: z.string()
    .min(1, "Emergency contact name is required")
    .max(100, "Name must be no more than 100 characters"),
  relationship: z.string()
    .min(1, "Relationship is required")
    .max(50, "Relationship must be no more than 50 characters"),
  phone: z.string()
    .regex(/^(\+61|0)[2-9]\d{8}$/, "Please enter a valid Australian phone number"),
  email: z.string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal(''))
})

export const residentCreateSchema = z.object({
  firstName: z.string()
    .min(1, "First name is required")
    .max(50, "First name must be no more than 50 characters"),
  
  lastName: z.string()
    .min(1, "Last name is required")
    .max(50, "Last name must be no more than 50 characters"),
  
  dateOfBirth: z.coerce.date({
    errorMap: () => ({ message: "Please select a valid date of birth" })
  }),
  
  gender: z.enum(['Male', 'Female', 'Non-binary', 'Prefer not to say'] as const, {
    errorMap: () => ({ message: "Please select a gender" })
  }),
  
  phone: z.string()
    .regex(/^(\+61|0)[2-9]\d{8}$/, "Please enter a valid Australian phone number")
    .optional()
    .or(z.literal('')),
  
  email: z.string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal('')),
  
  ndisId: z.string()
    .min(8, "NDIS ID must be at least 8 characters")
    .max(12, "NDIS ID must be no more than 12 characters")
    .optional()
    .or(z.literal('')),
  
  photo: z.unknown()
    .optional()
    .refine((files) => {
      // Server-side: photo will be handled differently
      if (typeof window === 'undefined') return true
      
      // Client-side: validate FileList
      if (!files || (files as FileList).length === 0) return true
      const file = (files as FileList)[0]
      return file.size <= 5 * 1024 * 1024 // 5MB limit
    }, "Photo must be less than 5MB")
    .refine((files) => {
      // Server-side: photo will be handled differently
      if (typeof window === 'undefined') return true
      
      // Client-side: validate FileList
      if (!files || (files as FileList).length === 0) return true
      const file = (files as FileList)[0]
      return file.type.startsWith('image/')
    }, "Please select a valid image file"),
  
  notes: z.string()
    .max(500, "Notes must be no more than 500 characters")
    .optional(),
  
  status: residentStatusSchema.default('Draft'),
  preferences: preferencesSchema.optional(),
  emergencyContact: emergencyContactSchema.optional()
})

// Update schema with optional fields and status transition validation
export const residentUpdateSchema = z.object({
  firstName: z.string()
    .min(1, "First name is required")
    .max(50, "First name must be no more than 50 characters")
    .optional(),
  
  lastName: z.string()
    .min(1, "Last name is required")
    .max(50, "Last name must be no more than 50 characters")
    .optional(),
  
  phone: z.string()
    .regex(/^(\+61|0)[2-9]\d{8}$/, "Please enter a valid Australian phone number")
    .optional()
    .or(z.literal('')),
  
  email: z.string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal('')),
  
  ndisId: z.string()
    .min(8, "NDIS ID must be at least 8 characters")
    .max(12, "NDIS ID must be no more than 12 characters")
    .optional()
    .or(z.literal('')),
  
  photoBase64: z.string().optional(),
  
  status: residentStatusSchema.optional(),
  
  detailedNotes: z.string()
    .max(5000, "Detailed notes must be no more than 5000 characters")
    .optional()
    .or(z.literal('')),
  
  preferences: preferencesSchema.optional(),
  emergencyContact: emergencyContactSchema.optional()
})

// Status transition validation
export const statusTransitionSchema = z.object({
  currentStatus: residentStatusSchema,
  newStatus: residentStatusSchema
}).refine((data) => {
  const validTransitions = {
    'Draft': ['Active', 'Deactivated'],
    'Active': ['Deactivated'],
    'Deactivated': ['Active'] // Allow reactivation
  }
  
  return validTransitions[data.currentStatus]?.includes(data.newStatus) ?? false
}, {
  message: "Invalid status transition",
  path: ["newStatus"]
})

// Audit log entry schema
export const auditLogEntrySchema = z.object({
  id: z.string(),
  residentId: z.string(),
  action: z.string(),
  field: z.string().optional(),
  oldValue: z.string().optional(),
  newValue: z.string().optional(),
  timestamp: z.date(),
  userId: z.string(),
  userEmail: z.string()
})

export const residentSchema = residentCreateSchema
  .omit({ photo: true })
  .extend({
    id: z.string(),
    houseId: z.string(),
    photoBase64: z.string().optional(),
    status: residentStatusSchema,
    fundingInformation: z.array(fundingInformationSchema),
    detailedNotes: z.string().optional(),
    auditTrail: z.array(auditLogEntrySchema),
    createdAt: z.date(),
    createdBy: z.string(),
    updatedAt: z.date(),
    updatedBy: z.string()
  })

export type ResidentCreateSchemaType = z.infer<typeof residentCreateSchema>
export type ResidentSchemaType = z.infer<typeof residentSchema>
export type ResidentUpdateSchemaType = z.infer<typeof residentUpdateSchema>
export type FundingInformationSchemaType = z.infer<typeof fundingInformationSchema>
export type StatusTransitionSchemaType = z.infer<typeof statusTransitionSchema>
export type AuditLogEntrySchemaType = z.infer<typeof auditLogEntrySchema>