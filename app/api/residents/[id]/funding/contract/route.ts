import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { contractStatusTransitionSchema } from 'lib/schemas/contract'
import { 
  createContractRenewal,
  getResidentByIdFromStorage,
  updateContractStatus
} from 'lib/utils/resident-storage'

interface RouteParams {
  id: string
}

// PUT /api/residents/[id]/funding/contract - Update contract status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const { fundingId, status } = body
    
    if (!fundingId || !status) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Funding ID and status are required' 
        }, 
        { status: 400 }
      )
    }
    
    // Simulate realistic delay for loading states
    await new Promise(resolve => setTimeout(resolve, 300))
    
    try {
      const updatedResident = updateContractStatus(id, fundingId, status)
      
      if (!updatedResident) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Resident or funding contract not found' 
          }, 
          { status: 404 }
        )
      }
      
      // Find the updated contract
      const updatedContract = updatedResident.fundingInformation.find(f => f.id === fundingId)
      
      return NextResponse.json({
        success: true,
        data: updatedContract,
        message: `Contract status updated to ${status}`
      })
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: (error as Error).message || 'Failed to update contract status'
        }, 
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error updating contract status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      }, 
      { status: 500 }
    )
  }
}

// POST /api/residents/[id]/funding/contract/renew - Create contract renewal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const renewalSchema = z.object({
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
      drawdownRate: z.enum(['daily', 'weekly', 'monthly'] as const).default('monthly'),
      autoDrawdown: z.boolean().default(true)
    }).refine(
      (data) => !data.endDate || data.startDate <= data.endDate,
      {
        message: "End date must be after start date",
        path: ["endDate"]
      }
    )
    
    const validation = renewalSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid renewal data',
          details: validation.error.issues
        }, 
        { status: 400 }
      )
    }
    
    // Simulate realistic delay for loading states
    await new Promise(resolve => setTimeout(resolve, 400))
    
    try {
      const updatedResident = createContractRenewal(id, validation.data.parentContractId, validation.data)
      
      if (!updatedResident) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Resident not found' 
          }, 
          { status: 404 }
        )
      }
      
      // Find the newly created renewal contract
      const renewalContract = updatedResident.fundingInformation
        .find(f => f.parentContractId === validation.data.parentContractId && f.contractStatus === 'Draft')
      
      return NextResponse.json({
        success: true,
        data: renewalContract,
        message: 'Contract renewal created successfully'
      }, { status: 201 })
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: (error as Error).message || 'Failed to create contract renewal'
        }, 
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error creating contract renewal:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      }, 
      { status: 500 }
    )
  }
}

// GET /api/residents/[id]/funding/contract/balance - Get contract balance summary
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id } = await params
    
    // Simulate realistic delay for loading states
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const resident = getResidentByIdFromStorage(id)
    
    if (!resident) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Resident not found' 
        }, 
        { status: 404 }
      )
    }
    
    // Calculate balance summary
    const contracts = resident.fundingInformation
    let totalOriginal = 0
    let totalCurrent = 0
    let activeContracts = 0
    let expiringSoon = 0
    
    for (const contract of contracts) {
      totalOriginal += contract.originalAmount
      totalCurrent += contract.currentBalance
      
      if (contract.contractStatus === 'Active') {
        activeContracts++
        
        // Check if expiring within 30 days
        if (contract.endDate) {
          const daysUntilExpiry = Math.ceil((new Date(contract.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
            expiringSoon++
          }
        }
      }
    }
    
    const balanceSummary = {
      totalOriginal,
      totalCurrent,
      totalDrawnDown: totalOriginal - totalCurrent,
      activeContracts,
      expiringSoon
    }
    
    return NextResponse.json({
      success: true,
      data: balanceSummary
    })
  } catch (error) {
    console.error('Error fetching contract balance:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      }, 
      { status: 500 }
    )
  }
}