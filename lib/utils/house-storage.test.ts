import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { HouseCreateInput } from 'types/house'

import {
  addHouseToStorage,
  clearHousesStorage,
  getHouseByIdFromStorage,
  getHousesFromStorage,
  isHouseIdTaken,
  saveHousesToStorage
} from './house-storage'

// Mock localStorage for browser environment tests
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

// Mock window object
const mockWindow = {
  localStorage: mockLocalStorage
}

describe('house-storage', () => {
  const validHouseData: HouseCreateInput = {
    address1: '123 Test Street',
    unit: 'Apt 2B',
    suburb: 'Sydney',
    state: 'NSW',
    postcode: '2000',
    country: 'AU',
    status: 'Active',
    notes: 'Test house',
    goLiveDate: new Date('2024-01-01'),
    resident: 'John Doe'
  }

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks()
    
    // Clear storage between tests
    clearHousesStorage()
  })

  describe('server-side environment (no window)', () => {
    beforeEach(() => {
      // Ensure we're in server environment
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true
      })
    })

    it('should return empty array when no houses stored', () => {
      const houses = getHousesFromStorage()
      expect(houses).toEqual([])
    })

    it('should store and retrieve houses in memory', () => {
      const house = addHouseToStorage(validHouseData, 'H-2024-001')
      
      expect(house.id).toBe('H-2024-001')
      expect(house.address1).toBe(validHouseData.address1)
      expect(house.createdBy).toBe('admin')
      expect(house.createdAt).toBeInstanceOf(Date)
      
      // Should be able to retrieve it
      const retrieved = getHouseByIdFromStorage('H-2024-001')
      expect(retrieved).toEqual(house)
    })

    it('should store multiple houses in memory', () => {
      const house1 = addHouseToStorage(validHouseData, 'H-2024-001')
      const house2 = addHouseToStorage({ ...validHouseData, address1: '456 Second St' }, 'H-2024-002')
      
      const allHouses = getHousesFromStorage()
      expect(allHouses).toHaveLength(2)
      expect(allHouses[0]).toEqual(house1)
      expect(allHouses[1]).toEqual(house2)
    })

    it('should return null for non-existent house', () => {
      const house = getHouseByIdFromStorage('H-2024-999')
      expect(house).toBeNull()
    })

    it('should correctly check if house ID is taken', () => {
      expect(isHouseIdTaken('H-2024-001')).toBe(false)
      
      addHouseToStorage(validHouseData, 'H-2024-001')
      
      expect(isHouseIdTaken('H-2024-001')).toBe(true)
      expect(isHouseIdTaken('H-2024-002')).toBe(false)
    })

    it('should clear all houses from memory', () => {
      addHouseToStorage(validHouseData, 'H-2024-001')
      addHouseToStorage(validHouseData, 'H-2024-002')
      
      expect(getHousesFromStorage()).toHaveLength(2)
      
      clearHousesStorage()
      
      expect(getHousesFromStorage()).toHaveLength(0)
    })

    it('should persist houses across function calls', () => {
      addHouseToStorage(validHouseData, 'H-2024-001')
      
      // Different function call should still see the house
      const house = getHouseByIdFromStorage('H-2024-001')
      expect(house).not.toBeNull()
      expect(house?.id).toBe('H-2024-001')
    })

    it('should handle concurrent storage operations', () => {
      const houses = [
        addHouseToStorage(validHouseData, 'H-2024-001'),
        addHouseToStorage({ ...validHouseData, address1: '456 Second St' }, 'H-2024-002'),
        addHouseToStorage({ ...validHouseData, address1: '789 Third St' }, 'H-2024-003')
      ]
      
      // All houses should be stored
      expect(getHousesFromStorage()).toHaveLength(3)
      
      // Each should be retrievable
      houses.forEach(house => {
        const retrieved = getHouseByIdFromStorage(house.id)
        expect(retrieved).toEqual(house)
      })
    })
  })

  describe('client-side environment (with window/localStorage)', () => {
    beforeEach(() => {
      // Mock browser environment
      Object.defineProperty(global, 'window', {
        value: mockWindow,
        writable: true
      })
      
      // Reset localStorage mock
      mockLocalStorage.getItem.mockReturnValue(null)
      mockLocalStorage.setItem.mockImplementation(() => {})
      mockLocalStorage.removeItem.mockImplementation(() => {})
    })

    it('should return empty array when localStorage is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const houses = getHousesFromStorage()
      expect(houses).toEqual([])
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('houses_data')
    })

    it('should load houses from localStorage', () => {
      const storedHouses = [{
        id: 'H-2024-001',
        address1: '123 Test Street',
        suburb: 'Sydney',
        state: 'NSW',
        postcode: '2000',
        country: 'AU',
        status: 'Active',
        goLiveDate: '2024-01-01T00:00:00.000Z',
        createdAt: '2024-01-01T10:00:00.000Z',
        createdBy: 'admin',
        updatedAt: '2024-01-01T10:00:00.000Z',
        updatedBy: 'admin'
      }]
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedHouses))
      
      const houses = getHousesFromStorage()
      expect(houses).toHaveLength(1)
      expect(houses[0].id).toBe('H-2024-001')
      expect(houses[0].goLiveDate).toBeInstanceOf(Date)
      expect(houses[0].createdAt).toBeInstanceOf(Date)
    })

    it('should save houses to localStorage', () => {
      const house = {
        id: 'H-2024-001',
        address1: '123 Test Street',
        suburb: 'Sydney',
        state: 'NSW' as const,
        postcode: '2000',
        country: 'AU',
        status: 'Active' as const,
        goLiveDate: new Date('2024-01-01'),
        createdAt: new Date(),
        createdBy: 'admin',
        updatedAt: new Date(),
        updatedBy: 'admin'
      }
      
      mockLocalStorage.getItem.mockReturnValue(null)
      
      saveHousesToStorage([house])
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'houses_data',
        expect.stringContaining('"id":"H-2024-001"')
      )
    })

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      // Should not throw and return empty array
      const houses = getHousesFromStorage()
      expect(houses).toEqual([])
    })

    it('should handle invalid JSON in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json')
      
      // Should not throw and return empty array
      const houses = getHousesFromStorage()
      expect(houses).toEqual([])
    })

    it('should handle non-array data in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('{"not": "an array"}')
      
      // Should return empty array for non-array data
      const houses = getHousesFromStorage()
      expect(houses).toEqual([])
    })

    it('should clear localStorage', () => {
      clearHousesStorage()
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('houses_data')
    })

    it('should serialize dates correctly', () => {
      const house = {
        id: 'H-2024-001',
        address1: '123 Test Street',
        suburb: 'Sydney',
        state: 'NSW' as const,
        postcode: '2000',
        country: 'AU',
        status: 'Active' as const,
        goLiveDate: new Date('2024-01-01T10:30:00Z'),
        createdAt: new Date('2024-01-01T10:00:00Z'),
        createdBy: 'admin',
        updatedAt: new Date('2024-01-01T10:00:00Z'),
        updatedBy: 'admin'
      }
      
      saveHousesToStorage([house])
      
      const savedData = mockLocalStorage.setItem.mock.calls[0][1]
      expect(savedData).toContain('"goLiveDate":"2024-01-01T10:30:00.000Z"')
      expect(savedData).toContain('"createdAt":"2024-01-01T10:00:00.000Z"')
    })
  })

  describe('addHouseToStorage integration', () => {
    it('should work in server environment', () => {
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true
      })
      
      const house = addHouseToStorage(validHouseData, 'H-2024-001')
      const retrieved = getHouseByIdFromStorage('H-2024-001')
      
      expect(retrieved).toEqual(house)
      expect(isHouseIdTaken('H-2024-001')).toBe(true)
    })

    it('should work in client environment', () => {
      Object.defineProperty(global, 'window', {
        value: mockWindow,
        writable: true
      })
      
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const house = addHouseToStorage(validHouseData, 'H-2024-001')
      
      expect(house.id).toBe('H-2024-001')
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('environment consistency', () => {
    it('should maintain same interface across environments', () => {
      const serverHouse = (() => {
        Object.defineProperty(global, 'window', {
          value: undefined,
          writable: true
        })
        clearHousesStorage()
        return addHouseToStorage(validHouseData, 'H-2024-001')
      })()
      
      const clientHouse = (() => {
        Object.defineProperty(global, 'window', {
          value: mockWindow,
          writable: true
        })
        mockLocalStorage.getItem.mockReturnValue(null)
        return addHouseToStorage(validHouseData, 'H-2024-001')
      })()
      
      // Both should have same structure (ignoring dates which will differ)
      expect(serverHouse.id).toBe(clientHouse.id)
      expect(serverHouse.address1).toBe(clientHouse.address1)
      expect(serverHouse.createdBy).toBe(clientHouse.createdBy)
    })
  })
})