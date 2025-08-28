import { NextRequest, NextResponse } from 'next/server'
import { postTransaction } from 'lib/utils/transaction-storage'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/transactions/[id]/post - Post a transaction (draft -> posted)
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
    
    // Post the transaction
    const transaction = postTransaction(id, 'current-user') // TODO: Get from auth
    
    // Add delay for loading state demonstration
    await new Promise(resolve => setTimeout(resolve, 200))
    
    return NextResponse.json({
      success: true,
      data: transaction,
      message: 'Transaction posted successfully'
    })
    
  } catch (error) {
    console.error('Error posting transaction:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Transaction not found') {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        )
      }
      if (error.message === 'Can only post draft transactions') {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
      }
      if (error.message.includes('exceed available balance') || 
          error.message.includes('Insufficient balance')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to post transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}