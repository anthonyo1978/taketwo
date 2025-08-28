import { NextRequest, NextResponse } from "next/server"

import { residentCreateSchema } from "lib/schemas/resident"
import { getHouseByIdFromStorage } from "lib/utils/house-storage"
import { generateResidentId } from "lib/utils/resident-id-generator"
import { addResidentToStorage, fileToBase64, getAllResidents } from "lib/utils/resident-storage"

export async function GET() {
  try {
    // Add delay to simulate realistic API behavior
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Get all residents across all houses
    const residents = getAllResidents()

    return NextResponse.json(
      { 
        success: true, 
        data: residents 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Global residents retrieval error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to load residents" 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Add delay to simulate realistic API behavior
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Parse FormData for file upload support
    const formData = await request.formData()
    
    // Extract form fields including houseId for global creation
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

    // Get houseId from form data (required for global creation)
    const houseId = formData.get('houseId') as string

    if (!houseId) {
      return NextResponse.json(
        { 
          success: false, 
          error: "House ID is required" 
        },
        { status: 400 }
      )
    }

    // Verify house exists
    const house = getHouseByIdFromStorage(houseId)
    if (!house) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Selected house not found" 
        },
        { status: 404 }
      )
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
    console.error('Global resident creation error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error" 
      },
      { status: 500 }
    )
  }
}