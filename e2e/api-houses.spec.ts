import { test, expect } from "@playwright/test"

test.describe("Houses API Routes", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing data by navigating to houses page
    await page.goto("/houses")
  })

  test("POST /api/houses creates house with server-side storage", async ({ page }) => {
    const houseData = {
      address1: "API Test Street",
      suburb: "API City",
      state: "NSW",
      postcode: "2000",
      country: "AU", 
      status: "Active",
      goLiveDate: "2024-01-15T00:00:00.000Z",
      resident: "API Test User",
      notes: "Created via API test"
    }

    // Make POST request to create house
    const createResponse = await page.request.post("/api/houses", {
      data: houseData
    })

    expect(createResponse.status()).toBe(201)
    
    const createResult = await createResponse.json()
    expect(createResult.success).toBe(true)
    expect(createResult.data.id).toMatch(/^H-\d{4}-\d{3}$/)
    expect(createResult.data.address1).toBe(houseData.address1)
    expect(createResult.data.createdBy).toBe("admin")
    expect(createResult.data.createdAt).toBeDefined()

    const houseId = createResult.data.id

    // Test that we can immediately retrieve the house via API (server-side storage)
    const getResponse = await page.request.get(`/api/houses/${houseId}`)
    expect(getResponse.status()).toBe(200)

    const getResult = await getResponse.json()
    expect(getResult.success).toBe(true)
    expect(getResult.data.id).toBe(houseId)
    expect(getResult.data.address1).toBe(houseData.address1)
    expect(getResult.data.suburb).toBe(houseData.suburb)
    expect(getResult.data.resident).toBe(houseData.resident)
    expect(getResult.data.notes).toBe(houseData.notes)
  })

  test("GET /api/houses/[id] returns 404 for non-existent house", async ({ page }) => {
    const response = await page.request.get("/api/houses/H-2024-999")
    
    expect(response.status()).toBe(404)
    
    const result = await response.json()
    expect(result.success).toBe(false)
    expect(result.error).toBe("House not found")
  })

  test("POST /api/houses validates required fields", async ({ page }) => {
    const invalidData = {
      address1: "AB", // Too short
      // Missing suburb
      state: "INVALID",
      postcode: "123", // Too short
      country: "AU",
      status: "Active"
      // Missing goLiveDate
    }

    const response = await page.request.post("/api/houses", {
      data: invalidData
    })

    expect(response.status()).toBe(400)
    
    const result = await response.json()
    expect(result.success).toBe(false)
    expect(result.error).toBe("Validation failed")
  })

  test("API endpoints maintain data consistency across requests", async ({ page }) => {
    // Create multiple houses
    const houses = [
      {
        address1: "First Street", 
        suburb: "First City",
        state: "NSW",
        postcode: "2000", 
        country: "AU",
        status: "Active",
        goLiveDate: "2024-01-01T00:00:00.000Z"
      },
      {
        address1: "Second Street",
        suburb: "Second City", 
        state: "VIC",
        postcode: "3000",
        country: "AU", 
        status: "Vacant",
        goLiveDate: "2024-01-02T00:00:00.000Z"
      }
    ]

    const createdIds = []

    // Create houses via API
    for (const houseData of houses) {
      const response = await page.request.post("/api/houses", { data: houseData })
      expect(response.status()).toBe(201)
      
      const result = await response.json()
      createdIds.push(result.data.id)
    }

    // Verify both houses can be retrieved and maintain their data
    for (let i = 0; i < createdIds.length; i++) {
      const id = createdIds[i]
      const expectedHouse = houses[i]
      
      const response = await page.request.get(`/api/houses/${id}`)
      expect(response.status()).toBe(200)
      
      const result = await response.json()
      expect(result.success).toBe(true)
      expect(result.data.id).toBe(id)
      expect(result.data.address1).toBe(expectedHouse.address1)
      expect(result.data.suburb).toBe(expectedHouse.suburb)
      expect(result.data.state).toBe(expectedHouse.state)
      expect(result.data.status).toBe(expectedHouse.status)
    }
  })

  test("Server-side storage persists across different API calls", async ({ page }) => {
    const houseData = {
      address1: "Persistence Test Street",
      suburb: "Persistence City", 
      state: "QLD",
      postcode: "4000",
      country: "AU",
      status: "Active", 
      goLiveDate: "2024-01-15T00:00:00.000Z"
    }

    // Create house
    const createResponse = await page.request.post("/api/houses", {
      data: houseData
    })
    
    const createResult = await createResponse.json()
    const houseId = createResult.data.id

    // Make multiple GET requests to ensure data persists
    for (let i = 0; i < 3; i++) {
      const getResponse = await page.request.get(`/api/houses/${houseId}`)
      expect(getResponse.status()).toBe(200)
      
      const getResult = await getResponse.json()
      expect(getResult.success).toBe(true)
      expect(getResult.data.address1).toBe(houseData.address1)
    }
  })
})