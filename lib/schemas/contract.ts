import { z } from "zod"
import { fundingInformationSchema } from "./resident"

export const contractStatusSchema = z.enum(['Draft', 'Active', 'Expired', 'Cancelled', 'Renewed'] as const)

export const drawdownRateSchema = z.enum(['daily', 'weekly', 'monthly'] as const)

// Extended funding information schema with contract fields
export const fundingContractSchema = fundingInformationSchema.extend({
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
  parentContractId: z.string().optional()
}).refine(
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

// Contract status transition validation
export const contractStatusTransitionSchema = z.object({
  currentStatus: contractStatusSchema,
  newStatus: contractStatusSchema
}).refine((data) => {
  const validTransitions = {
    'Draft': ['Active', 'Cancelled'],
    'Active': ['Expired', 'Cancelled'],
    'Expired': ['Renewed', 'Cancelled'],
    'Cancelled': [], // Terminal state
    'Renewed': ['Active'] // New contract created
  }
  
  return validTransitions[data.currentStatus]?.includes(data.newStatus) ?? false
}, {
  message: "Invalid contract status transition",
  path: ["newStatus"]
})

// Contract creation schema (excludes calculated fields)
export const contractCreateSchema = z.object({
  type: z.enum(['NDIS', 'Government', 'Private', 'Family', 'Other'] as const),
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
  drawdownRate: drawdownRateSchema.default('monthly'),
  autoDrawdown: z.boolean().default(true),
  renewalDate: z.coerce.date().optional()
}).refine(
  (data) => !data.endDate || data.startDate <= data.endDate,
  {
    message: "End date must be after start date",
    path: ["endDate"]
  }
).refine(
  (data) => !data.renewalDate || data.renewalDate > data.startDate,
  {
    message: "Renewal date must be after start date",
    path: ["renewalDate"]
  }
)

// Contract renewal schema
export const contractRenewalSchema = z.object({
  parentContractId: z.string().min(1, "Parent contract ID is required"),
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
  drawdownRate: drawdownRateSchema.default('monthly'),
  autoDrawdown: z.boolean().default(true),
  renewalDate: z.coerce.date().optional()
}).refine(
  (data) => !data.endDate || data.startDate <= data.endDate,
  {
    message: "End date must be after start date",
    path: ["endDate"]
  }
)

// Contract balance summary schema
export const contractBalanceSummarySchema = z.object({
  totalOriginal: z.number().min(0),
  totalCurrent: z.number().min(0), 
  totalDrawnDown: z.number().min(0),
  activeContracts: z.number().min(0).int(),
  expiringSoon: z.number().min(0).int()
})

export type ContractStatusSchemaType = z.infer<typeof contractStatusSchema>
export type DrawdownRateSchemaType = z.infer<typeof drawdownRateSchema>
export type FundingContractSchemaType = z.infer<typeof fundingContractSchema>
export type ContractStatusTransitionSchemaType = z.infer<typeof contractStatusTransitionSchema>
export type ContractCreateSchemaType = z.infer<typeof contractCreateSchema>
export type ContractRenewalSchemaType = z.infer<typeof contractRenewalSchema>
export type ContractBalanceSummarySchemaType = z.infer<typeof contractBalanceSummarySchema>