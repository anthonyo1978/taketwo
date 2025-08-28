import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Resident, ResidentCreateInput } from "types/resident"
import {
  addResidentToStorage,
  clearResidentsStorage,
  fileToBase64,
  getResidentByIdFromStorage,
  getResidentsByHouseId,
  getResidentsFromStorage,
  isResidentIdTaken,
  saveResidentsToStorage,
} from "./resident-storage"


// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

const mockResident: Resident = {
  id: "R-2024-001",
  houseId: "H-2024-001",
  firstName: "John",
  lastName: "Doe",
  dateOfBirth: new Date("1990-01-01"),
  gender: "Male",
  phone: "0412345678",
  email: "john.doe@example.com",
  ndisId: "12345678",
  notes: "Test resident",
  createdAt: new Date("2024-01-01"),
  createdBy: "admin",
  updatedAt: new Date("2024-01-01"),
  updatedBy: "admin",
}

const mockResidentInput: ResidentCreateInput = {
  firstName: "Jane",
  lastName: "Smith",
  dateOfBirth: new Date("1985-06-15"),
  gender: "Female",
  phone: "0487654321",
  email: "jane.smith@example.com",
  ndisId: "87654321",
}

describe("resident-storage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearResidentsStorage()
  })

  describe("getResidentsFromStorage", () => {
    it("returns empty array when no data stored", () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const result = getResidentsFromStorage()
      
      expect(result).toEqual([])
      expect(localStorageMock.getItem).toHaveBeenCalledWith('residents_data')
    })

    it("returns parsed residents from localStorage", () => {
      const storedData = JSON.stringify([mockResident], (key, value) => {
        if (value instanceof Date) return value.toISOString()
        return value
      })
      localStorageMock.getItem.mockReturnValue(storedData)
      
      const result = getResidentsFromStorage()
      
      expect(result).toHaveLength(1)
      expect(result[0].firstName).toBe("John")
      expect(result[0].lastName).toBe("Doe")
      expect(result[0].dateOfBirth).toBeInstanceOf(Date)
    })

    it("handles parsing errors gracefully", () => {
      localStorageMock.getItem.mockReturnValue("invalid-json")
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const result = getResidentsFromStorage()
      
      expect(result).toEqual([])
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it("handles non-array data gracefully", () => {
      localStorageMock.getItem.mockReturnValue('{"not": "array"}')
      
      const result = getResidentsFromStorage()
      
      expect(result).toEqual([])
    })
  })

  describe("saveResidentsToStorage", () => {
    it("saves residents to localStorage", () => {
      const residents = [mockResident]
      
      saveResidentsToStorage(residents)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'residents_data',
        expect.stringContaining('"firstName":"John"')
      )
    })

    it("handles localStorage errors gracefully", () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Storage error")
      })
      
      expect(() => saveResidentsToStorage([mockResident])).not.toThrow()
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe("getResidentsByHouseId", () => {
    it("returns residents for specific house", () => {
      const residents = [
        { ...mockResident, houseId: "H-2024-001" },
        { ...mockResident, id: "R-2024-002", houseId: "H-2024-002" },
      ]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(residents, (key, value) => {
        if (value instanceof Date) return value.toISOString()
        return value
      }))
      
      const result = getResidentsByHouseId("H-2024-001")
      
      expect(result).toHaveLength(1)
      expect(result[0].houseId).toBe("H-2024-001")
    })

    it("returns empty array when no residents for house", () => {
      localStorageMock.getItem.mockReturnValue("[]")
      
      const result = getResidentsByHouseId("H-2024-001")
      
      expect(result).toEqual([])
    })
  })

  describe("addResidentToStorage", () => {
    it("adds new resident with audit fields", () => {
      localStorageMock.getItem.mockReturnValue("[]")
      
      const result = addResidentToStorage(mockResidentInput, "R-2024-001", "H-2024-001")
      
      expect(result.id).toBe("R-2024-001")
      expect(result.houseId).toBe("H-2024-001")
      expect(result.firstName).toBe("Jane")
      expect(result.lastName).toBe("Smith")
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
      expect(result.createdBy).toBe("admin")
      expect(result.updatedBy).toBe("admin")
      
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it("adds resident to existing list", () => {
      const existingResidents = [mockResident]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingResidents, (key, value) => {
        if (value instanceof Date) return value.toISOString()
        return value
      }))
      
      addResidentToStorage(mockResidentInput, "R-2024-002", "H-2024-001")
      
      // Verify the saved data contains both residents
      const saveCall = localStorageMock.setItem.mock.calls[0][1]
      const savedData = JSON.parse(saveCall)
      expect(savedData).toHaveLength(2)
    })
  })

  describe("getResidentByIdFromStorage", () => {
    it("returns resident by id", () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockResident], (key, value) => {
        if (value instanceof Date) return value.toISOString()
        return value
      }))
      
      const result = getResidentByIdFromStorage("R-2024-001")
      
      expect(result?.firstName).toBe("John")
      expect(result?.id).toBe("R-2024-001")
    })

    it("returns null when resident not found", () => {
      localStorageMock.getItem.mockReturnValue("[]")
      
      const result = getResidentByIdFromStorage("R-2024-999")
      
      expect(result).toBeNull()
    })
  })

  describe("isResidentIdTaken", () => {
    it("returns true when id exists", () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockResident], (key, value) => {
        if (value instanceof Date) return value.toISOString()
        return value
      }))
      
      const result = isResidentIdTaken("R-2024-001")
      
      expect(result).toBe(true)
    })

    it("returns false when id does not exist", () => {
      localStorageMock.getItem.mockReturnValue("[]")
      
      const result = isResidentIdTaken("R-2024-999")
      
      expect(result).toBe(false)
    })
  })

  describe("clearResidentsStorage", () => {
    it("removes residents data from localStorage", () => {
      clearResidentsStorage()
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('residents_data')
    })

    it("handles localStorage errors gracefully", () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error("Remove error")
      })
      
      expect(() => clearResidentsStorage()).not.toThrow()
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe("fileToBase64", () => {
    it("converts file to base64 string", async () => {
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      
      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        result: 'data:image/jpeg;base64,dGVzdCBjb250ZW50',
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((event: ProgressEvent<FileReader>) => void) | null,
      }
      
      vi.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader)
      
      const promise = fileToBase64(mockFile)
      
      // Simulate successful read
      if (mockFileReader.onload) {
        mockFileReader.onload({} as ProgressEvent<FileReader>)
      }
      
      const result = await promise
      
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile)
      expect(result).toBe('data:image/jpeg;base64,dGVzdCBjb250ZW50')
    })

    it("handles file read errors", async () => {
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        result: null,
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((event: ProgressEvent<FileReader>) => void) | null,
      }
      
      vi.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader)
      
      const promise = fileToBase64(mockFile)
      
      // Simulate error
      const testError = new Error('Read failed')
      if (mockFileReader.onerror) {
        mockFileReader.onerror(testError)
      }
      
      await expect(promise).rejects.toThrow('Read failed')
    })
  })
})