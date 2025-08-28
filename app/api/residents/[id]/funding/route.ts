import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { fundingInformationSchema } from 'lib/schemas/resident'
import { 
  addFundingToResident,
  getResidentByIdFromStorage,
  removeFundingFromResident,
  updateFundingInResident
} from 'lib/utils/resident-storage'

interface RouteParams {
  id: string
}

// GET /api/residents/[id]/funding - Get funding information for resident
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
    
    return NextResponse.json({
      success: true,
      data: resident.fundingInformation
    })
  } catch (error) {
    console.error('Error fetching funding information:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      }, 
      { status: 500 }
    )
  }
}

// POST /api/residents/[id]/funding - Add new funding information
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Validate funding information with contract fields
    const createFundingSchema = z.object({
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
      drawdownRate: z.enum(['daily', 'weekly', 'monthly'] as const).default('monthly'),
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
    
    const validation = createFundingSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid funding information',
          details: validation.error.issues
        }, 
        { status: 400 }
      )
    }
    
    // Simulate realistic delay for loading states
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const updatedResident = addFundingToResident(id, validation.data)
    
    if (!updatedResident) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Resident not found' 
        }, 
        { status: 404 }
      )
    }
    
    // Return the newly added funding information
    const newFunding = updatedResident.fundingInformation[updatedResident.fundingInformation.length - 1]
    
    return NextResponse.json({
      success: true,
      data: newFunding,
      message: 'Funding information added successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding funding information:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      }, 
      { status: 500 }
    )
  }
}

// PUT /api/residents/[id]/funding - Update existing funding information
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { fundingId, ...fundingUpdates } = body
    
    if (!fundingId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Funding ID is required' 
        }, 
        { status: 400 }
      )
    }
    
    // Validate funding updates
    const validation = fundingInformationSchema.partial().safeParse(fundingUpdates)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid funding information',
          details: validation.error.issues
        }, 
        { status: 400 }
      )
    }
    
    // Simulate realistic delay for loading states
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const updatedResident = updateFundingInResident(id, fundingId, validation.data)
    
    if (!updatedResident) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Resident or funding information not found' 
        }, 
        { status: 404 }
      )
    }
    
    // Find the updated funding information
    const updatedFunding = updatedResident.fundingInformation.find(f => f.id === fundingId)
    
    return NextResponse.json({
      success: true,
      data: updatedFunding,
      message: 'Funding information updated successfully'
    })
  } catch (error) {
    console.error('Error updating funding information:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      }, 
      { status: 500 }
    )
  }
}

// DELETE /api/residents/[id]/funding - Remove funding information
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const fundingId = searchParams.get('fundingId')
    
    if (!fundingId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Funding ID is required' 
        }, 
        { status: 400 }
      )
    }
    
    // Simulate realistic delay for loading states
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const updatedResident = removeFundingFromResident(id, fundingId)
    
    if (!updatedResident) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Resident or funding information not found' 
        }, 
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: updatedResident.fundingInformation,
      message: 'Funding information removed successfully'
    })
  } catch (error) {
    console.error('Error removing funding information:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      }, 
      { status: 500 }
    )
  }
}