import { NextRequest, NextResponse } from "next/server"

import { residentCreateSchema } from "lib/schemas/resident"
import { getHouseByIdFromStorage } from "lib/utils/house-storage"
import { generateResidentId } from "lib/utils/resident-id-generator"
import { addResidentToStorage, fileToBase64, getResidentsByHouseId } from "lib/utils/resident-storage"

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Add delay to simulate realistic API behavior
    await new Promise((resolve) => setTimeout(resolve, 300))

    const { id: houseId } = await params

    // Verify house exists
    const house = getHouseByIdFromStorage(houseId)
    if (!house) {
      return NextResponse.json(
        { 
          success: false, 
          error: "House not found" 
        },
        { status: 404 }
      )
    }

    // Get residents for this house
    const residents = getResidentsByHouseId(houseId)

    return NextResponse.json(
      { 
        success: true, 
        data: residents 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Residents retrieval error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to load residents" 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Add delay to simulate realistic API behavior
    await new Promise((resolve) => setTimeout(resolve, 800))

    const { id: houseId } = await params

    // Verify house exists
    const house = getHouseByIdFromStorage(houseId)
    if (!house) {
      return NextResponse.json(
        { 
          success: false, 
          error: "House not found" 
        },
        { status: 404 }
      )
    }

    // Parse FormData for file upload support
    const formData = await request.formData()
    
    // Extract form fields
    const body = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      dateOfBirth: formData.get('dateOfBirth') as string,
      gender: formData.get('gender') as string,
      phone: formData.get('phone') as string || undefined,
      email: formData.get('email') as string || undefined,
      ndisId: formData.get('ndisId') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    }

    // Handle photo upload
    const photoFile = formData.get('photo') as File | null
    let photoBase64: string | undefined

    if (photoFile && photoFile.size > 0) {
      try {
        photoBase64 = await fileToBase64(photoFile)
      } catch (error) {
        console.error('Photo conversion error:', error)
        return NextResponse.json(
          { 
            success: false, 
            error: "Failed to process photo upload" 
          },
          { status: 400 }
        )
      }
    }

    // Create validation object for server-side
    const validationData = {
      ...body,
      photo: photoFile || undefined // Server-side validation will pass through
    }

    // Validate request data
    const validation = residentCreateSchema.safeParse(validationData)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Validation failed", 
          details: validation.error.issues 
        },
        { status: 400 }
      )
    }

    // Generate unique ID
    const residentId = generateResidentId()

    // Prepare data for storage
    const residentData = {
      firstName: validation.data.firstName,
      lastName: validation.data.lastName,
      dateOfBirth: validation.data.dateOfBirth,
      gender: validation.data.gender,
      phone: validation.data.phone || undefined,
      email: validation.data.email || undefined,
      ndisId: validation.data.ndisId || undefined,
      photoBase64,
      notes: validation.data.notes || undefined,
    }

    // Save to storage with audit fields
    const newResident = addResidentToStorage(residentData, residentId, houseId)

    return NextResponse.json(
      { 
        success: true, 
        data: newResident 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Resident creation error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error" 
      },
      { status: 500 }
    )
  }
}