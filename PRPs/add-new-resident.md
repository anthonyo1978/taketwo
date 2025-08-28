name: "Feature PRP - Add A New Resident"
description: |

## Purpose
Enable admins to capture basic resident details and associate them with a house. Most houses will have one or two residents, but in some circumstances, there may be up to four residents. This feature establishes a repeatable dynamic listing pattern for future entities and scales management capabilities for providers.

## Core Principles
1. **Context is King**: Follow existing Next.js App Router + shadcn/ui + Tailwind patterns from house management.
2. **Validation Loops**: Include proper error handling, loading states, and E2E flow testing.
3. **Information Dense**: Use project naming, folder structure, and existing storage utilities.
4. **Progressive Success**: Start with basic resident creation, then add photo uploads and listing.
5. **Global rules**: Obey CLAUDE.md and repo conventions for co-located testing.

---

## Goal
Users can:
- Navigate to a house detail page
- Click "Add Resident" → modal form opens
- Fill resident details (Name, DOB, Gender, Contact, NDIS ID, Photo)
- Submit → new resident appears in house's resident list
- View residents with photos in consistent table format

---

## Why
- **Scale Management**: Providers are scaling fast – managing many residents is a critical need
- **User Feedback Loop**: Admins must quickly locate residents within houses and view their details
- **Data Consistency**: Reduce confusion between what is created vs. displayed
- **Foundation Pattern**: Establish a repeatable dynamic listing pattern for future entities

---

## What
- **Resident Type System** with proper TypeScript interfaces
- **ResidentForm Component** (shadcn Dialog, React Hook Form, zod validation)
- **Resident Storage Layer** following house storage patterns
- **API integration** with `/api/houses/[id]/residents` endpoints
- **Photo Upload** with validation and display capabilities

### Success Criteria
- [ ] "Add Resident" button exists on house detail page
- [ ] Modal opens/closes correctly with proper form validation
- [ ] Required fields validate (Name, DOB, Gender, Contact)
- [ ] Optional NDIS ID accepts valid format
- [ ] Photo upload works with file validation (max 5MB, image types)
- [ ] Successful create adds resident to house's resident list
- [ ] Resident appears immediately after save (optimistic update)
- [ ] All tests pass (unit + E2E integration)

---

## All Needed Context

### Documentation & References
```yaml
- file: components/houses/HouseForm.tsx
  why: Follow form pattern, React Hook Form + zod integration
  critical: Use same validation structure and error handling

- file: lib/schemas/house.ts
  why: Mirror zod schema patterns for resident validation
  critical: Follow same enum patterns and validation messages

- file: lib/utils/house-storage.ts
  why: Follow storage abstraction pattern for resident data
  critical: Use same localStorage/server-side memory pattern

- file: app/api/houses/route.ts
  why: Follow API response structure and error handling
  critical: Use same { success: boolean, data?, error? } format

- file: app/(admin)/houses/page.tsx
  why: Follow loading states, error handling, and table patterns
  critical: Use same skeleton loading and retry mechanisms

- file: types/house.ts
  why: Follow TypeScript interface patterns and naming conventions
  critical: Use same audit fields (createdAt, updatedAt, createdBy, etc.)

- doc: https://react-hook-form.com/get-started
  section: ZodResolver integration + File Upload handling
  critical: Prevents invalid resident submissions and file validation

- doc: https://nextjs.org/docs/app/getting-started/images
  section: Image optimization and file upload best practices
  critical: Secure file handling for resident photos

- doc: https://zod.dev/
  section: File validation with refine() method
  critical: Validate file size, type, and optional fields
```

### Current Codebase tree
```
app/
├── api/houses/
│   ├── route.ts              # GET/POST houses
│   └── [id]/route.ts         # GET individual house
├── (admin)/houses/
│   ├── page.tsx              # Houses listing with table
│   ├── [id]/page.tsx         # Individual house details
│   └── new/page.tsx          # Add new house form
components/houses/
├── HouseForm.tsx             # Form component with validation
├── HouseForm.test.tsx        # Unit tests
└── HouseForm.stories.tsx     # Storybook stories
lib/
├── schemas/house.ts          # Zod validation schemas
└── utils/house-storage.ts    # Storage abstraction layer
types/house.ts                # TypeScript interfaces
```

### Desired Codebase tree
```
app/api/houses/[id]/residents/
└── route.ts                  # GET/POST residents for house
components/residents/
├── ResidentForm.tsx          # Modal form component
├── ResidentForm.test.tsx     # Unit tests
├── ResidentForm.stories.tsx  # Storybook stories
├── ResidentTable.tsx         # Resident listing table
└── ResidentTable.test.tsx    # Table component tests
lib/
├── schemas/resident.ts       # Zod validation schemas
└── utils/resident-storage.ts # Storage abstraction layer
types/resident.ts             # TypeScript interfaces
e2e/add-resident.spec.ts      # End-to-end tests
```

## Known Gotchas & Library Quirks

```typescript
// CRITICAL: File upload with React Hook Form requires register() not Controller
const fileRef = form.register("photo")
return <Input type="file" {...fileRef} accept="image/*" />

// CRITICAL: Zod file validation requires instanceof FileList
const schema = z.object({
  photo: z.instanceof(FileList).optional()
    .refine((files) => !files || files.length === 0 || files[0]?.size <= 5 * 1024 * 1024, 
      "File must be less than 5MB")
})

// CRITICAL: Next.js App Router requires FormData for file uploads in API routes
const formData = await request.formData()
const photo = formData.get('photo') as File | null

// CRITICAL: localStorage doesn't support File objects - convert to base64
const photoBase64 = photo ? await fileToBase64(photo) : undefined

// CRITICAL: Australian date format for DOB - use ISO strings internally
goLiveDate: z.coerce.date() // Same pattern as house schema

// CRITICAL: NDIS ID format is not publicly documented - use optional string with length validation
ndisId: z.string().min(8).max(12).optional()
```

## Implementation Blueprint

### Data Models
```typescript
// types/resident.ts
export type Gender = 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say'

export interface Resident {
  id: string
  houseId: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  gender: Gender
  phone?: string
  email?: string
  ndisId?: string
  photoBase64?: string
  notes?: string
  createdAt: Date
  createdBy: string
  updatedAt: Date
  updatedBy: string
}

export interface ResidentCreateInput {
  firstName: string
  lastName: string
  dateOfBirth: Date
  gender: Gender
  phone?: string
  email?: string
  ndisId?: string
  photoBase64?: string
  notes?: string
}
```

### Tasks (Implementation Order)
```yaml
Task 1:
CREATE types/resident.ts
  - Define Resident interface following house.ts patterns
  - Include audit fields (createdAt, updatedAt, createdBy, updatedBy)
  - Define ResidentCreateInput interface

Task 2: 
CREATE lib/schemas/resident.ts
  - Create residentCreateSchema with zod validation
  - Include file upload validation for photo
  - Follow same patterns as house.ts schema
  - Validate NDIS ID as optional 8-12 character string

Task 3:
CREATE lib/utils/resident-storage.ts  
  - Follow house-storage.ts patterns exactly
  - Implement getResidentsByHouseId(), addResidentToStorage()
  - Handle photo base64 conversion for localStorage
  - Use same error handling and date serialization

Task 4:
CREATE app/api/houses/[id]/residents/route.ts
  - GET: return residents for specific house
  - POST: create new resident with photo upload
  - Follow same response format as houses API
  - Handle FormData for file uploads

Task 5:
CREATE components/residents/ResidentForm.tsx
  - Use shadcn Dialog component (same as invoice example)
  - React Hook Form + zodResolver integration
  - File upload input for photo with validation
  - Follow HouseForm.tsx styling and structure

Task 6:
CREATE components/residents/ResidentTable.tsx
  - Display residents in table format (same as houses page)
  - Show photo thumbnails, basic info, and actions
  - Follow same loading/error states as houses table

Task 7:
UPDATE app/(admin)/houses/[id]/page.tsx
  - Add "Add Resident" button
  - Include ResidentTable component
  - Handle resident creation success state

Task 8:
TESTS
  - Unit test ResidentForm validation and file upload
  - Unit test ResidentTable rendering and interactions  
  - E2E test: navigate to house → add resident → verify in list
```

### Pseudocode
```tsx
// components/residents/ResidentForm.tsx
const residentCreateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"), 
  dateOfBirth: z.coerce.date(),
  gender: z.enum(['Male', 'Female', 'Non-binary', 'Prefer not to say']),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  ndisId: z.string().min(8).max(12).optional().or(z.literal('')),
  photo: z.instanceof(FileList).optional()
    .refine((files) => !files || files.length === 0 || files[0]?.size <= 5 * 1024 * 1024, 
      "Photo must be less than 5MB")
})

function ResidentForm({ houseId, onClose, onSuccess }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(residentCreateSchema)
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const onSubmit = async (data) => {
    setIsSubmitting(true)
    const formData = new FormData()
    
    // Add all form fields
    Object.keys(data).forEach(key => {
      if (key === 'photo' && data.photo?.[0]) {
        formData.append('photo', data.photo[0])
      } else if (data[key]) {
        formData.append(key, data[key])
      }
    })
    
    try {
      const response = await fetch(`/api/houses/${houseId}/residents`, {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        onSuccess?.(result.data)
        onClose()
      } else {
        // Handle error
      }
    } catch (error) {
      // Handle error
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Dialog>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input {...register("firstName")} placeholder="First Name" />
          <Input {...register("lastName")} placeholder="Last Name" />
          <Input type="date" {...register("dateOfBirth")} />
          <select {...register("gender")}>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-binary">Non-binary</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
          <Input type="file" {...register("photo")} accept="image/*" />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Resident"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### Integration Points
```yaml
CONFIG:
  - Add RESIDENT_PHOTO_MAX_SIZE to lib/constants.ts (5MB)
  - Add GENDER_OPTIONS constant array

ROUTES:
  - API: /api/houses/[id]/residents (GET/POST)
  - Updated house detail page includes resident management

STORAGE:
  - Extend resident-storage.ts with localStorage + server memory pattern
  - Convert photos to base64 for localStorage compatibility

PHOTO_HANDLING:
  - Use Next.js Image component for optimized display
  - Validate file type (image/*) and size (max 5MB)
  - Store as base64 in localStorage, File objects in memory
```

## Validation Loop

### Level 1: Syntax & Style
```bash
pnpm run lint
pnpm run prettier
npm run typecheck  # TypeScript compilation
```

### Level 2: Unit Tests
```tsx
// components/residents/ResidentForm.test.tsx
test("ResidentForm validates required fields", () => {
  render(<ResidentForm houseId="H001" onClose={vi.fn()} />)
  userEvent.click(screen.getByText("Add Resident"))
  expect(screen.getByText("First name is required")).toBeInTheDocument()
  expect(screen.getByText("Last name is required")).toBeInTheDocument()
})

test("ResidentForm validates photo file size", () => {
  const largeMockFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
    type: 'image/jpeg'
  })
  
  render(<ResidentForm houseId="H001" onClose={vi.fn()} />)
  const fileInput = screen.getByLabelText(/photo/i)
  userEvent.upload(fileInput, largeMockFile)
  userEvent.click(screen.getByText("Add Resident"))
  expect(screen.getByText("Photo must be less than 5MB")).toBeInTheDocument()
})
```

```bash
pnpm run test
```

### Level 3: Integration Test (Playwright)
```typescript
// e2e/add-resident.spec.ts
test("admin can add resident to house", async ({ page }) => {
  // First create a house or navigate to existing house
  await page.goto("/houses/H001")
  
  // Click add resident button
  await page.click("text=Add Resident")
  
  // Fill resident form
  await page.fill('input[name="firstName"]', "John")
  await page.fill('input[name="lastName"]', "Doe") 
  await page.fill('input[name="dateOfBirth"]', "1990-01-01")
  await page.selectOption('select[name="gender"]', "Male")
  await page.fill('input[name="phone"]', "0412345678")
  await page.fill('input[name="ndisId"]', "12345678")
  
  // Upload photo
  await page.setInputFiles('input[type="file"]', {
    name: 'test-photo.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('fake-image-data')
  })
  
  // Submit form
  await page.click("text=Add Resident")
  
  // Verify resident appears in table
  await expect(page.locator("table")).toContainText("John Doe")
  await expect(page.locator("table")).toContainText("Male")
  await expect(page.locator("table")).toContainText("0412345678")
})

test("resident form validates required fields", async ({ page }) => {
  await page.goto("/houses/H001")
  await page.click("text=Add Resident")
  await page.click("text=Add Resident")  // Submit without filling
  
  await expect(page.locator("text=First name is required")).toBeVisible()
  await expect(page.locator("text=Last name is required")).toBeVisible()
})
```

## Final Validation Checklist
- [ ] Modal opens with form validation working
- [ ] Required fields validate properly (firstName, lastName, dateOfBirth, gender)
- [ ] Optional fields accept valid input (phone, email, ndisId, photo)
- [ ] Photo upload validates file size (max 5MB) and type (images only)
- [ ] Form submission creates resident record
- [ ] Resident appears in house's resident table immediately
- [ ] Photo displays as thumbnail in resident table
- [ ] All tests pass (`pnpm run test` and `pnpm run e2e:headless`)
- [ ] Lint/typecheck clean (`pnpm run lint && pnpm run typecheck`)
- [ ] Error states display user-friendly messages
- [ ] Loading states show during form submission

## Anti-Patterns to Avoid
❌ Don't use Controller for file inputs → always use register() method
❌ Don't store File objects in localStorage → convert to base64
❌ Don't bypass zod validation → always validate file size and type
❌ Don't hardcode NDIS format → use flexible string validation until official spec
❌ Don't duplicate form patterns → follow HouseForm.tsx exactly
❌ Don't forget audit fields → include createdAt, updatedAt, createdBy, updatedBy
❌ Don't skip error handling → follow house API error response patterns

## Confidence Score: 9/10

This PRP provides comprehensive context for one-pass implementation success:
- ✅ All existing patterns identified and referenced
- ✅ Complete technical specification with gotchas documented  
- ✅ Step-by-step implementation blueprint
- ✅ Full validation strategy with executable test cases
- ✅ Clear anti-patterns to avoid common mistakes
- ✅ Follows established project conventions exactly

The only uncertainty is the exact NDIS ID format, but the implementation uses a flexible validation approach that can be tightened when official specifications become available.