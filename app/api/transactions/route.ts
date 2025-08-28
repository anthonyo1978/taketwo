import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getTransactionsList,
  createTransaction,
  getTransactionBalancePreview
} from 'lib/utils/transaction-storage'
import type { 
  TransactionCreateInput, 
  TransactionFilters, 
  TransactionSortConfig 
} from 'types/transaction'

// Validation schema for creating transactions
const createTransactionSchema = z.object({
  residentId: z.string().min(1, 'Resident ID is required'),
  contractId: z.string().min(1, 'Contract ID is required'),
  occurredAt: z.coerce.date(),
  serviceCode: z.string().min(1, 'Service code is required'),
  description: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative('Unit price must be non-negative'),
  amount: z.number().nonnegative().optional(),
  note: z.string().optional()
})

// Validation schema for filters
const filtersSchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  residentIds: z.string().optional(), // Comma-separated
  contractIds: z.string().optional(), // Comma-separated
  houseIds: z.string().optional(), // Comma-separated
  statuses: z.string().optional(), // Comma-separated
  serviceCode: z.string().optional(),
  search: z.string().optional()
}).optional()

// Validation schema for sorting
const sortSchema = z.object({
  field: z.enum([
    'occurredAt', 'amount', 'status', 'serviceCode', 
    'createdAt', 'residentName', 'houseName', 'contractType'
  ]).default('occurredAt'),
  direction: z.enum(['asc', 'desc']).default('desc')
}).optional()

// GET /api/transactions - List transactions with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '25', 10), 100)
    
    // Parse and validate filters
    const rawFilters = {
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      residentIds: searchParams.get('residentIds'),
      contractIds: searchParams.get('contractIds'),
      houseIds: searchParams.get('houseIds'),
      statuses: searchParams.get('statuses'),
      serviceCode: searchParams.get('serviceCode'),
      search: searchParams.get('search')
    }
    
    const filtersResult = filtersSchema.safeParse(rawFilters)
    if (!filtersResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid filter parameters',
          details: filtersResult.error.errors
        },
        { status: 400 }
      )
    }
    
    // Convert to TransactionFilters format
    const filters: TransactionFilters = {}
    if (filtersResult.data?.dateFrom && filtersResult.data?.dateTo) {
      filters.dateRange = {
        from: filtersResult.data.dateFrom,
        to: filtersResult.data.dateTo
      }
    }
    if (filtersResult.data?.residentIds) {
      filters.residentIds = filtersResult.data.residentIds.split(',').filter(Boolean)
    }
    if (filtersResult.data?.contractIds) {
      filters.contractIds = filtersResult.data.contractIds.split(',').filter(Boolean)
    }
    if (filtersResult.data?.houseIds) {
      filters.houseIds = filtersResult.data.houseIds.split(',').filter(Boolean)
    }
    if (filtersResult.data?.statuses) {
      filters.statuses = filtersResult.data.statuses.split(',') as any
    }
    if (filtersResult.data?.serviceCode) {
      filters.serviceCode = filtersResult.data.serviceCode
    }
    if (filtersResult.data?.search) {
      filters.search = filtersResult.data.search
    }
    
    // Parse and validate sorting
    const rawSort = {
      field: searchParams.get('sortField') || 'occurredAt',
      direction: searchParams.get('sortDirection') || 'desc'
    }
    
    const sortResult = sortSchema.safeParse(rawSort)
    if (!sortResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid sort parameters',
          details: sortResult.error.errors
        },
        { status: 400 }
      )
    }
    
    const sort: TransactionSortConfig = sortResult.data || { field: 'occurredAt', direction: 'desc' }
    
    // Add delay for loading state demonstration
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Get transactions
    const result = getTransactionsList(filters, sort, page, pageSize)
    
    return NextResponse.json({
      success: true,
      data: result
    })
    
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/transactions - Create a new transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const result = createTransactionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid transaction data',
          details: result.error.errors
        },
        { status: 400 }
      )
    }
    
    const input: TransactionCreateInput = result.data
    
    // Get balance preview to validate the transaction
    const balancePreview = getTransactionBalancePreview(
      input.contractId,
      input.amount || (input.quantity * input.unitPrice)
    )
    
    // Create the transaction
    const transaction = createTransaction(input, 'current-user') // TODO: Get from auth
    
    // Add delay for loading state demonstration
    await new Promise(resolve => setTimeout(resolve, 200))
    
    return NextResponse.json({
      success: true,
      data: transaction,
      balancePreview
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}