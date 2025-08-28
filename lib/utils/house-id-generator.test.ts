import { beforeEach, describe, expect, it } from 'vitest'

import { generateHouseId, getCurrentSequence, resetSequenceForTesting } from './house-id-generator'

describe('house-id-generator', () => {
  beforeEach(() => {
    // Reset sequence before each test
    resetSequenceForTesting()
  })

  describe('generateHouseId', () => {
    it('should generate ID with correct format', () => {
      const id = generateHouseId()
      const currentYear = new Date().getFullYear()
      
      expect(id).toMatch(new RegExp(`^H-${currentYear}-\\d{3}$`))
    })

    it('should generate ID with current year', () => {
      const id = generateHouseId()
      const currentYear = new Date().getFullYear()
      
      expect(id.startsWith(`H-${currentYear}-`)).toBe(true)
    })

    it('should generate sequential IDs', () => {
      const id1 = generateHouseId()
      const id2 = generateHouseId()
      const id3 = generateHouseId()
      
      const currentYear = new Date().getFullYear()
      expect(id1).toBe(`H-${currentYear}-001`)
      expect(id2).toBe(`H-${currentYear}-002`)
      expect(id3).toBe(`H-${currentYear}-003`)
    })

    it('should pad sequence numbers with leading zeros', () => {
      // Generate first ID
      const id = generateHouseId()
      const currentYear = new Date().getFullYear()
      
      expect(id).toBe(`H-${currentYear}-001`)
      
      // Generate multiple IDs to test padding
      for (let i = 2; i <= 9; i++) {
        const nextId = generateHouseId()
        expect(nextId).toBe(`H-${currentYear}-${i.toString().padStart(3, '0')}`)
      }
    })

    it('should generate unique IDs', () => {
      const ids = new Set()
      
      // Generate multiple IDs
      for (let i = 0; i < 10; i++) {
        const id = generateHouseId()
        expect(ids.has(id)).toBe(false)
        ids.add(id)
      }
      
      expect(ids.size).toBe(10)
    })

    it('should increment sequence correctly', () => {
      expect(getCurrentSequence()).toBe(0)
      
      generateHouseId()
      expect(getCurrentSequence()).toBe(1)
      
      generateHouseId()
      expect(getCurrentSequence()).toBe(2)
      
      generateHouseId()
      expect(getCurrentSequence()).toBe(3)
    })

    it('should handle sequence numbers above 100', () => {
      // Reset and generate enough IDs to go above 100
      resetSequenceForTesting()
      
      // Generate 150 IDs
      let lastId = ''
      for (let i = 1; i <= 150; i++) {
        lastId = generateHouseId()
      }
      
      const currentYear = new Date().getFullYear()
      expect(lastId).toBe(`H-${currentYear}-150`)
    })
  })

  describe('resetSequenceForTesting', () => {
    it('should reset sequence to 0', () => {
      // Generate a few IDs first
      generateHouseId()
      generateHouseId()
      expect(getCurrentSequence()).toBe(2)
      
      // Reset
      resetSequenceForTesting()
      expect(getCurrentSequence()).toBe(0)
      
      // Next ID should be 001
      const id = generateHouseId()
      const currentYear = new Date().getFullYear()
      expect(id).toBe(`H-${currentYear}-001`)
    })
  })

  describe('getCurrentSequence', () => {
    it('should return current sequence number', () => {
      expect(getCurrentSequence()).toBe(0)
      
      generateHouseId()
      expect(getCurrentSequence()).toBe(1)
      
      generateHouseId()
      expect(getCurrentSequence()).toBe(2)
    })
  })

  describe('edge cases', () => {
    it('should handle rapid consecutive calls', () => {
      const ids = []
      
      // Generate IDs rapidly
      for (let i = 0; i < 5; i++) {
        ids.push(generateHouseId())
      }
      
      // All should be unique and sequential
      const currentYear = new Date().getFullYear()
      expect(ids).toEqual([
        `H-${currentYear}-001`,
        `H-${currentYear}-002`,
        `H-${currentYear}-003`,
        `H-${currentYear}-004`,
        `H-${currentYear}-005`
      ])
    })
  })
})