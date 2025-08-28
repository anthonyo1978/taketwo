import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getTransactionById,
  updateTransaction,
  deleteTransaction
} from 'lib/utils/transaction-storage'
import type { TransactionCreateInput } from 'types/transaction'

// Validation schema for updating transactions
const updateTransactionSchema = z.object({
  occurredAt: z.coerce.date().optional(),
  serviceCode: z.string().min(1).optional(),
  description: z.string().optional(),
  quantity: z.number().positive().optional(),
  unitPrice: z.number().nonnegative().optional(),
  amount: z.number().nonnegative().optional(),
  note: z.string().optional()
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/transactions/[id] - Get a single transaction
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      )
    }
    
    const transaction = getTransactionById(id)
    
    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }
    
    // Add delay for loading state demonstration
    await new Promise(resolve => setTimeout(resolve, 150))
    
    return NextResponse.json({
      success: true,
      data: transaction
    })
    
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT /api/transactions/[id] - Update a transaction (draft only)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    
    // Validate input
    const result = updateTransactionSchema.safeParse(body)
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
    
    const updates = result.data
    
    // Update the transaction
    const transaction = updateTransaction(id, updates)
    
    // Add delay for loading state demonstration
    await new Promise(resolve => setTimeout(resolve, 200))
    
    return NextResponse.json({
      success: true,
      data: transaction
    })
    
  } catch (error) {
    console.error('Error updating transaction:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Transaction not found') {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        )
      }
      if (error.message === 'Can only update draft transactions') {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/transactions/[id] - Delete a transaction (draft only)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      )
    }
    
    const deleted = deleteTransaction(id)
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      )
    }
    
    // Add delay for loading state demonstration
    await new Promise(resolve => setTimeout(resolve, 150))
    
    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting transaction:', error)
    
    if (error instanceof Error && error.message === 'Can only delete draft transactions') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}