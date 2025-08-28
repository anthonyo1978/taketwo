import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { 
  bulkPostTransactions, 
  bulkVoidTransactions 
} from 'lib/utils/transaction-storage'

const bulkOperationSchema = z.object({
  transactionIds: z.array(z.string()).min(1, 'At least one transaction ID is required'),
  action: z.enum(['post', 'void']),
  reason: z.string().optional()
}).refine((data) => {
  // Reason is required for void operations
  if (data.action === 'void' && (!data.reason || data.reason.trim().length === 0)) {
    return false
  }
  return true
}, {
  message: 'Reason is required for void operations',
  path: ['reason']
})

// POST /api/transactions/bulk - Bulk operations (post or void multiple transactions)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const result = bulkOperationSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid bulk operation data',
          details: result.error.errors
        },
        { status: 400 }
      )
    }
    
    const { transactionIds, action, reason } = result.data
    const currentUser = 'current-user' // TODO: Get from auth
    
    let operationResult
    
    if (action === 'post') {
      operationResult = bulkPostTransactions(transactionIds, currentUser)
    } else {
      operationResult = bulkVoidTransactions(transactionIds, reason!, currentUser)
    }
    
    // Add delay for loading state demonstration
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const statusCode = operationResult.success ? 200 : 207 // Multi-Status for partial success
    
    return NextResponse.json({
      success: operationResult.success,
      data: operationResult,
      message: operationResult.success 
        ? `All ${transactionIds.length} transactions ${action}ed successfully`
        : `${operationResult.processed} of ${transactionIds.length} transactions ${action}ed successfully`
    }, { status: statusCode })
    
  } catch (error) {
    console.error('Error performing bulk operation:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform bulk operation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}