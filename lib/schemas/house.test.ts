import { describe, expect, it } from 'vitest'

import { houseCreateSchema } from './house'

describe('houseCreateSchema', () => {
  const validHouseData = {
    address1: '123 Main Street',
    unit: 'Apt 2B',
    suburb: 'Sydney',
    state: 'NSW' as const,
    postcode: '2000',
    country: 'AU',
    status: 'Active' as const,
    notes: 'Test notes',
    goLiveDate: new Date('2024-01-01'),
    resident: 'John Doe'
  }

  describe('successful validation', () => {
    it('should validate with all required fields', () => {
      const minimalData = {
        address1: '123 Main Street',
        suburb: 'Sydney',
        state: 'NSW' as const,
        postcode: '2000',
        country: 'AU',
        status: 'Active' as const,
        goLiveDate: new Date('2024-01-01')
      }

      const result = houseCreateSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
    })

    it('should validate with all fields including optional ones', () => {
      const result = houseCreateSchema.safeParse(validHouseData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.address1).toBe('123 Main Street')
        expect(result.data.unit).toBe('Apt 2B')
        expect(result.data.resident).toBe('John Doe')
      }
    })

    it('should accept all valid Australian states', () => {
      const states = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']
      
      states.forEach(state => {
        const data = { ...validHouseData, state }
        const result = houseCreateSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should accept all valid house statuses', () => {
      const statuses = ['Active', 'Vacant', 'Under maintenance']
      
      statuses.forEach(status => {
        const data = { ...validHouseData, status }
        const result = houseCreateSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('validation failures', () => {
    it('should fail with missing required address1', () => {
      const { address1: _address1, ...data } = validHouseData
      
      const result = houseCreateSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('address1'))).toBe(true)
      }
    })

    it('should fail with address1 too short', () => {
      const data = { ...validHouseData, address1: 'AB' }
      
      const result = houseCreateSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('address1') && issue.message.includes('at least 3 characters')
        )).toBe(true)
      }
    })

    it('should fail with address1 too long', () => {
      const data = { ...validHouseData, address1: 'A'.repeat(121) }
      
      const result = houseCreateSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('address1') && issue.message.includes('no more than 120 characters')
        )).toBe(true)
      }
    })

    it('should fail with missing required suburb', () => {
      const { suburb: _suburb, ...data } = validHouseData
      
      const result = houseCreateSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('suburb'))).toBe(true)
      }
    })

    it('should fail with invalid state', () => {
      const data = { ...validHouseData, state: 'INVALID' }
      
      const result = houseCreateSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('state') && issue.message.includes('valid Australian state')
        )).toBe(true)
      }
    })

    it('should fail with invalid postcode format', () => {
      const invalidPostcodes = ['123', '12345', 'ABCD', '200A']
      
      invalidPostcodes.forEach(postcode => {
        const data = { ...validHouseData, postcode }
        const result = houseCreateSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.some(issue => 
            issue.path.includes('postcode') && issue.message.includes('exactly 4 digits')
          )).toBe(true)
        }
      })
    })

    it('should fail with valid 4-digit postcode', () => {
      const validPostcodes = ['0000', '2000', '9999']
      
      validPostcodes.forEach(postcode => {
        const data = { ...validHouseData, postcode }
        const result = houseCreateSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should fail with invalid status', () => {
      const data = { ...validHouseData, status: 'Invalid Status' }
      
      const result = houseCreateSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('status') && issue.message.includes('valid status')
        )).toBe(true)
      }
    })

    it('should fail with missing required goLiveDate', () => {
      const { goLiveDate: _goLiveDate, ...data } = validHouseData
      
      const result = houseCreateSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('goLiveDate'))).toBe(true)
      }
    })
  })

  describe('date coercion', () => {
    it('should coerce string dates to Date objects', () => {
      const data = { ...validHouseData, goLiveDate: '2024-01-01' }
      
      const result = houseCreateSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.goLiveDate).toBeInstanceOf(Date)
      }
    })
  })
})