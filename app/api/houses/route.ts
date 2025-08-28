import { NextRequest, NextResponse } from "next/server"

import { houseCreateSchema } from "lib/schemas/house"
import { generateHouseId } from "lib/utils/house-id-generator"
import { addHouseToStorage, getHousesFromStorage } from "lib/utils/house-storage"

export async function POST(request: NextRequest) {
  try {
    // Add delay to simulate realistic API behavior
    await new Promise((resolve) => setTimeout(resolve, 800))

    const body = await request.json()

    // Validate request data
    const validation = houseCreateSchema.safeParse(body)
    
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
    const houseId = generateHouseId()

    // Save to storage with audit fields
    const newHouse = addHouseToStorage(validation.data, houseId)

    return NextResponse.json(
      { 
        success: true, 
        data: newHouse 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('House creation error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error" 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Add delay to simulate realistic API behavior
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Get all houses from storage
    const houses = getHousesFromStorage()

    return NextResponse.json(
      { 
        success: true, 
        data: houses 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Houses retrieval error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to load houses" 
      },
      { status: 500 }
    )
  }
}