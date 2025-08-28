import { describe, expect, it } from "vitest"

import { residentCreateSchema, residentSchema } from "./resident"

describe("resident schemas", () => {
  describe("residentCreateSchema", () => {
    const validData = {
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: new Date("1990-01-01"),
      gender: "Male" as const,
      phone: "0412345678",
      email: "john.doe@example.com",
      ndisId: "12345678",
      notes: "Test notes",
    }

    describe("firstName validation", () => {
      it("accepts valid first name", () => {
        const result = residentCreateSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it("rejects empty first name", () => {
        const data = { ...validData, firstName: "" }
        const result = residentCreateSchema.safeParse(data)
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("First name is required")
        }
      })

      it("rejects first name over 50 characters", () => {
        const data = { ...validData, firstName: "a".repeat(51) }
        const result = residentCreateSchema.safeParse(data)
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("First name must be no more than 50 characters")
        }
      })
    })

    describe("lastName validation", () => {
      it("accepts valid last name", () => {
        const result = residentCreateSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it("rejects empty last name", () => {
        const data = { ...validData, lastName: "" }
        const result = residentCreateSchema.safeParse(data)
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Last name is required")
        }
      })

      it("rejects last name over 50 characters", () => {
        const data = { ...validData, lastName: "a".repeat(51) }
        const result = residentCreateSchema.safeParse(data)
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Last name must be no more than 50 characters")
        }
      })
    })

    describe("dateOfBirth validation", () => {
      it("accepts valid date", () => {
        const result = residentCreateSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it("coerces string dates", () => {
        const data = { ...validData, dateOfBirth: "1990-01-01" }
        const result = residentCreateSchema.safeParse(data)
        
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.dateOfBirth).toBeInstanceOf(Date)
        }
      })

      it("rejects invalid dates", () => {
        const data = { ...validData, dateOfBirth: "invalid-date" }
        const result = residentCreateSchema.safeParse(data)
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Please select a valid date of birth")
        }
      })
    })

    describe("gender validation", () => {
      it("accepts valid gender options", () => {
        const genders = ["Male", "Female", "Non-binary", "Prefer not to say"] as const
        
        genders.forEach(gender => {
          const data = { ...validData, gender }
          const result = residentCreateSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })

      it("rejects invalid gender", () => {
        const data = { ...validData, gender: "Invalid" as unknown as "Male" }
        const result = residentCreateSchema.safeParse(data)
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Please select a gender")
        }
      })
    })

    describe("phone validation", () => {
      it("accepts valid Australian phone numbers", () => {
        const validPhones = [
          "0412345678",
          "+61412345678",
          "0287654321",
          "+61387654321",
        ]
        
        validPhones.forEach(phoneNumber => {
          const data = { ...validData, phone: phoneNumber }
          const result = residentCreateSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })

      it("rejects invalid phone numbers", () => {
        const invalidPhones = [
          "123456789", // Too short
          "1234567890", // Invalid format
          "0123456789", // Starts with 01
          "+1234567890", // Wrong country code
        ]
        
        invalidPhones.forEach(phoneNumber => {
          const data = { ...validData, phone: phoneNumber }
          const result = residentCreateSchema.safeParse(data)
          expect(result.success).toBe(false)
        })
      })

      it("accepts empty string for optional phone", () => {
        const data = { ...validData, phone: "" }
        const result = residentCreateSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it("accepts undefined for optional phone", () => {
        const { phone: _phone, ...dataWithoutPhone } = validData
        const result = residentCreateSchema.safeParse(dataWithoutPhone)
        expect(result.success).toBe(true)
      })
    })

    describe("email validation", () => {
      it("accepts valid email addresses", () => {
        const validEmails = [
          "test@example.com",
          "user.name@domain.co.uk",
          "user+tag@example.org",
        ]
        
        validEmails.forEach(email => {
          const data = { ...validData, email }
          const result = residentCreateSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })

      it("rejects invalid email addresses", () => {
        const invalidEmails = [
          "invalid-email",
          "@example.com",
          "user@",
          "user@.com",
        ]
        
        invalidEmails.forEach(email => {
          const data = { ...validData, email }
          const result = residentCreateSchema.safeParse(data)
          expect(result.success).toBe(false)
        })
      })

      it("accepts empty string for optional email", () => {
        const data = { ...validData, email: "" }
        const result = residentCreateSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    describe("ndisId validation", () => {
      it("accepts valid NDIS ID lengths", () => {
        const validIds = [
          "12345678", // 8 characters
          "123456789012", // 12 characters
        ]
        
        validIds.forEach(ndisId => {
          const data = { ...validData, ndisId }
          const result = residentCreateSchema.safeParse(data)
          expect(result.success).toBe(true)
        })
      })

      it("rejects NDIS ID too short", () => {
        const data = { ...validData, ndisId: "1234567" } // 7 characters
        const result = residentCreateSchema.safeParse(data)
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("NDIS ID must be at least 8 characters")
        }
      })

      it("rejects NDIS ID too long", () => {
        const data = { ...validData, ndisId: "1234567890123" } // 13 characters
        const result = residentCreateSchema.safeParse(data)
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("NDIS ID must be no more than 12 characters")
        }
      })

      it("accepts empty string for optional NDIS ID", () => {
        const data = { ...validData, ndisId: "" }
        const result = residentCreateSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    describe("notes validation", () => {
      it("accepts valid notes", () => {
        const data = { ...validData, notes: "Some notes about the resident" }
        const result = residentCreateSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it("rejects notes over 500 characters", () => {
        const data = { ...validData, notes: "a".repeat(501) }
        const result = residentCreateSchema.safeParse(data)
        
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Notes must be no more than 500 characters")
        }
      })

      it("accepts undefined notes", () => {
        const { notes: _notes, ...dataWithoutNotes } = validData
        const result = residentCreateSchema.safeParse(dataWithoutNotes)
        expect(result.success).toBe(true)
      })
    })

    describe("photo validation", () => {
      it("accepts empty FileList", () => {
        // Mock empty FileList
        const emptyFileList = {
          length: 0,
          [Symbol.iterator]: function* () {},
        } as FileList
        
        const data = { ...validData, photo: emptyFileList }
        const result = residentCreateSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it("accepts undefined photo", () => {
        const result = residentCreateSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })
  })

  describe("residentSchema", () => {
    const validResidentData = {
      id: "R-2024-001",
      houseId: "H-2024-001",
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: new Date("1990-01-01"),
      gender: "Male" as const,
      phone: "0412345678",
      email: "john.doe@example.com",
      ndisId: "12345678",
      photoBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRg",
      notes: "Test notes",
      createdAt: new Date("2024-01-01"),
      createdBy: "admin",
      updatedAt: new Date("2024-01-01"),
      updatedBy: "admin",
    }

    it("validates complete resident data", () => {
      const result = residentSchema.safeParse(validResidentData)
      expect(result.success).toBe(true)
    })

    it("requires id field", () => {
      const { id: _id, ...dataWithoutId } = validResidentData
      const result = residentSchema.safeParse(dataWithoutId)
      expect(result.success).toBe(false)
    })

    it("requires houseId field", () => {
      const { houseId: _houseId, ...dataWithoutHouseId } = validResidentData
      const result = residentSchema.safeParse(dataWithoutHouseId)
      expect(result.success).toBe(false)
    })

    it("requires audit fields", () => {
      const requiredAuditFields = ['createdAt', 'createdBy', 'updatedAt', 'updatedBy']
      
      requiredAuditFields.forEach(field => {
        const dataWithoutField = { ...validResidentData }
        delete (dataWithoutField as Record<string, unknown>)[field]
        
        const result = residentSchema.safeParse(dataWithoutField)
        expect(result.success).toBe(false)
      })
    })

    it("accepts optional photoBase64", () => {
      const { photoBase64: _photoBase64, ...dataWithoutPhoto } = validResidentData
      const result = residentSchema.safeParse(dataWithoutPhoto)
      expect(result.success).toBe(true)
    })
  })
})