import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { voidTransaction } from 'lib/utils/transaction-storage'

const voidTransactionSchema = z.object({
  reason: z.string().min(1, 'Reason is required for voiding transactions')
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/transactions/[id]/void - Void a transaction (posted -> voided)
export async function POST(
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
    const result = voidTransactionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid void data',
          details: result.error.errors
        },
        { status: 400 }
      )
    }
    
    const { reason } = result.data
    
    // Void the transaction
    const transaction = voidTransaction(id, reason, 'current-user') // TODO: Get from auth
    
    // Add delay for loading state demonstration
    await new Promise(resolve => setTimeout(resolve, 200))
    
    return NextResponse.json({
      success: true,
      data: transaction,
      message: 'Transaction voided successfully'
    })
    
  } catch (error) {
    console.error('Error voiding transaction:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Transaction not found') {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        )
      }
      if (error.message === 'Can only void posted transactions') {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to void transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}