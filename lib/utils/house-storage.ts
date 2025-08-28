// Mock persistence utility for House data using localStorage (client) and memory (server)
// Designed to be easily swapped with real database implementation

import type { House, HouseCreateInput } from "types/house"

const STORAGE_KEY = 'houses_data'

// Server-side in-memory storage for API routes
let serverHouses: House[] = []

// Parse dates correctly when loading from JSON
const reviveDates = (key: string, value: unknown): unknown => {
  const dateFields = ['createdAt', 'updatedAt', 'goLiveDate']
  if (dateFields.includes(key) && typeof value === 'string') {
    return new Date(value)
  }
  return value
}

// Serialize dates correctly when saving to JSON
const replaceDates = (key: string, value: unknown): unknown => {
  if (value instanceof Date) {
    return value.toISOString()
  }
  return value
}

export const getHousesFromStorage = (): House[] => {
  // Server-side: use in-memory storage
  if (typeof window === 'undefined') {
    return serverHouses
  }
  
  // Client-side: use localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const houses = JSON.parse(stored, reviveDates) as House[]
    return Array.isArray(houses) ? houses : []
  } catch (error) {
    console.error('Failed to load houses from storage:', error)
    return []
  }
}

export const saveHousesToStorage = (houses: House[]): void => {
  // Server-side: update in-memory storage
  if (typeof window === 'undefined') {
    serverHouses = [...houses]
    return
  }
  
  // Client-side: update localStorage
  try {
    const serialized = JSON.stringify(houses, replaceDates)
    localStorage.setItem(STORAGE_KEY, serialized)
  } catch (error) {
    console.error('Failed to save houses to storage:', error)
  }
}

export const addHouseToStorage = (houseData: HouseCreateInput, id: string): House => {
  const now = new Date()
  const mockUser = 'admin' // TODO: Replace with real user when auth is implemented
  
  const newHouse: House = {
    id,
    ...houseData,
    createdAt: now,
    createdBy: mockUser,
    updatedAt: now,
    updatedBy: mockUser
  }
  
  const houses = getHousesFromStorage()
  houses.push(newHouse)
  saveHousesToStorage(houses)
  
  return newHouse
}

export const getHouseByIdFromStorage = (id: string): House | null => {
  const houses = getHousesFromStorage()
  return houses.find(house => house.id === id) || null
}

export const isHouseIdTaken = (id: string): boolean => {
  const houses = getHousesFromStorage()
  return houses.some(house => house.id === id)
}

// Utility for testing - clears all house data
export const clearHousesStorage = (): void => {
  // Server-side: clear in-memory storage
  if (typeof window === 'undefined') {
    serverHouses = []
    return
  }
  
  // Client-side: clear localStorage
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear houses storage:', error)
  }
}