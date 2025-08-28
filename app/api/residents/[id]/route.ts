import { NextRequest, NextResponse } from 'next/server'
import { residentUpdateSchema, statusTransitionSchema } from 'lib/schemas/resident'
import { 
  changeResidentStatus, 
  getResidentByIdFromStorage,
  updateResidentInStorage
} from 'lib/utils/resident-storage'
import type { ResidentStatus, ResidentUpdateInput } from 'types/resident'

interface RouteParams {
  id: string
}

// GET /api/residents/[id] - Get specific resident with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id } = await params
    
    // Simulate realistic delay for loading states
    await new Promise(resolve => setTimeout(resolve, 300))
    
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
      data: resident
    })
  } catch (error) {
    console.error('Error fetching resident:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      }, 
      { status: 500 }
    )
  }
}

// PUT /api/residents/[id] - Update resident information
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Check if this is a status change request
    if (body.status && Object.keys(body).length === 1) {
      // Handle status transition separately for proper validation
      const currentResident = getResidentByIdFromStorage(id)
      if (!currentResident) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Resident not found' 
          }, 
          { status: 404 }
        )
      }
      
      // Validate status transition
      const transitionValidation = statusTransitionSchema.safeParse({
        currentStatus: currentResident.status,
        newStatus: body.status as ResidentStatus
      })
      
      if (!transitionValidation.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid status transition',
            details: transitionValidation.error.issues
          }, 
          { status: 400 }
        )
      }
      
      try {
        const updatedResident = changeResidentStatus(id, body.status)
        
        if (!updatedResident) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Failed to update resident status' 
            }, 
            { status: 400 }
          )
        }
        
        return NextResponse.json({
          success: true,
          data: updatedResident
        })
      } catch (error) {
        return NextResponse.json(
          { 
            success: false, 
            error: error instanceof Error ? error.message : 'Status transition failed' 
          }, 
          { status: 400 }
        )
      }
    }
    
    // Regular update validation
    const validation = residentUpdateSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid resident data',
          details: validation.error.issues
        }, 
        { status: 400 }
      )
    }
    
    // Simulate realistic delay for loading states
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const updatedResident = updateResidentInStorage(id, validation.data as ResidentUpdateInput)
    
    if (!updatedResident) {
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
      data: updatedResident
    })
  } catch (error) {
    console.error('Error updating resident:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      }, 
      { status: 500 }
    )
  }
}

// DELETE /api/residents/[id] - Soft delete (deactivate) resident
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id } = await params
    
    // Simulate realistic delay for loading states
    await new Promise(resolve => setTimeout(resolve, 300))
    
    try {
      const deactivatedResident = changeResidentStatus(id, 'Deactivated')
      
      if (!deactivatedResident) {
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
        data: deactivatedResident,
        message: 'Resident has been deactivated'
      })
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to deactivate resident' 
        }, 
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error deactivating resident:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      }, 
      { status: 500 }
    )
  }
}