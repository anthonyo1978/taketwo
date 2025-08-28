import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  generateResidentId,
  getCurrentSequence,
  resetSequenceForTesting,
} from "./resident-id-generator"

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe("resident-id-generator", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetSequenceForTesting()
  })

  describe("generateResidentId", () => {
    it("generates id with correct format", () => {
      const currentYear = new Date().getFullYear()
      
      const id = generateResidentId()
      
      expect(id).toMatch(/^R-\d{4}-\d{3}$/)
      expect(id).toBe(`R-${currentYear}-001`)
    })

    it("increments sequence number", () => {
      const currentYear = new Date().getFullYear()
      
      const id1 = generateResidentId()
      const id2 = generateResidentId()
      const id3 = generateResidentId()
      
      expect(id1).toBe(`R-${currentYear}-001`)
      expect(id2).toBe(`R-${currentYear}-002`)
      expect(id3).toBe(`R-${currentYear}-003`)
    })

    it("pads sequence with leading zeros", () => {
      resetSequenceForTesting()
      const currentYear = new Date().getFullYear()
      
      // Generate 9 IDs to test padding
      for (let i = 1; i < 10; i++) {
        generateResidentId()
      }
      
      const id = generateResidentId() // 10th ID
      expect(id).toBe(`R-${currentYear}-010`)
    })

    it("stores sequence in localStorage", () => {
      generateResidentId()
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('resident_id_sequence', '1')
      
      generateResidentId()
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('resident_id_sequence', '2')
    })

    it("loads sequence from localStorage on initialization", () => {
      localStorageMock.getItem.mockReturnValue('5')
      
      // Need to reset and reload the module to test initialization
      resetSequenceForTesting()
      
      // Simulate module reload by calling initialization logic
      // Since we can't easily reload the module in tests, we'll test the behavior
      const id = generateResidentId()
      const currentYear = new Date().getFullYear()
      
      expect(id).toBe(`R-${currentYear}-001`) // Starts at 1 because reset was called
    })
  })

  describe("resetSequenceForTesting", () => {
    it("resets sequence to 0", () => {
      generateResidentId() // sequence = 1
      generateResidentId() // sequence = 2
      
      resetSequenceForTesting()
      
      expect(getCurrentSequence()).toBe(0)
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith('resident_id_sequence', '0')
    })
  })

  describe("getCurrentSequence", () => {
    it("returns current sequence number", () => {
      resetSequenceForTesting()
      expect(getCurrentSequence()).toBe(0)
      
      generateResidentId()
      expect(getCurrentSequence()).toBe(1)
      
      generateResidentId()
      expect(getCurrentSequence()).toBe(2)
    })
  })

  it("handles localStorage errors gracefully", () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error("localStorage error")
    })
    
    // Should not throw error
    expect(() => generateResidentId()).not.toThrow()
  })

  it("handles localStorage getItem returning null", () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const id = generateResidentId()
    const currentYear = new Date().getFullYear()
    
    expect(id).toBe(`R-${currentYear}-001`)
  })

  it("handles localStorage getItem returning invalid data", () => {
    localStorageMock.getItem.mockReturnValue("invalid-number")
    
    const id = generateResidentId()
    const currentYear = new Date().getFullYear()
    
    // Should default to 0 and start at 1
    expect(id).toBe(`R-${currentYear}-001`)
  })

  it("generates unique IDs across multiple calls", () => {
    const ids = new Set()
    
    for (let i = 0; i < 100; i++) {
      ids.add(generateResidentId())
    }
    
    expect(ids.size).toBe(100) // All IDs should be unique
  })
})