import { NextRequest, NextResponse } from "next/server"

import { getHouseByIdFromStorage } from "lib/utils/house-storage"

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Add delay to simulate realistic API behavior
    await new Promise((resolve) => setTimeout(resolve, 300))

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: "House ID is required" 
        },
        { status: 400 }
      )
    }

    // Get house from storage
    const house = getHouseByIdFromStorage(id)

    if (!house) {
      return NextResponse.json(
        { 
          success: false, 
          error: "House not found" 
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { 
        success: true, 
        data: house 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('House retrieval error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error" 
      },
      { status: 500 }
    )
  }
}