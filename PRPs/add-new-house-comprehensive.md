name: "Feature PRP - Add New House (Comprehensive Implementation Guide)"
description: |

## Purpose
Create a complete house management feature for administrators to add properties via a dedicated `/houses/new` page. This PRP serves as a comprehensive implementation guide based on the existing successful implementation, providing patterns for future similar CRUD features.

## Core Principles
1. **Context is King**: Follow established Next.js 15 App Router + shadcn/ui + Tailwind patterns already proven in the codebase.
2. **Validation Loops**: Implement comprehensive client/server validation using Zod schemas with full test coverage.
3. **Information Dense**: Leverage existing project architecture, naming conventions, and component patterns.
4. **Progressive Success**: Start with core functionality, validate thoroughly, then enhance.
5. **Global Rules**: Strictly adhere to PLANNING.md architecture and CLAUDE.md coding standards.

---

## Goal
Administrators can navigate to `/houses/new`, complete a comprehensive property form with validation, and successfully create house records. Upon success, users receive confirmation toast and redirect to the house detail page with auto-generated unique IDs.

## Why
- **Business Value**: Streamline property onboarding process for rapid portfolio expansion
- **User Impact**: Provide intuitive, error-free data entry experience for administrators
- **Technical Value**: Establish reusable CRUD patterns for future entity management features
- **System Integration**: Create foundation for property management workflows

---

## What

### Entry Points & Navigation
- **Primary Route**: `/houses/new` (dedicated page in admin section)
- **Access**: Admin-authenticated users only (route protection required)
- **Navigation**: Breadcrumb navigation (Houses > New House) with cancel option

### Form Architecture & Fields

**Address Details Section:**
- Address Line 1 (required: 3-120 characters)
- Unit/Apartment (optional: additional address detail)
- Suburb/City (required: location identifier)
- State (required: Australian states enum - ACT/NSW/NT/QLD/SA/TAS/VIC/WA)
- Postcode (required: 4-digit Australian format validation)
- Country (default: AU, configurable)

**Property Details Section:**
- Status (required: Active/Vacant/Under Maintenance enum)
- Go-Live Date (required: ISO date format)

**Additional Information Section:**
- Current Resident (optional: display name)
- Notes (optional: admin comments/details)

### Validation Strategy

**Client-Side (React Hook Form + Zod):**
```typescript
const houseCreateSchema = z.object({
  address1: z.string().min(3, "Address must be at least 3 characters").max(120),
  unit: z.string().optional(),
  suburb: z.string().min(1, "Suburb/City is required"),
  state: z.enum(AUSTRALIAN_STATES),
  postcode: z.string().regex(/^\d{4}$/, "Postcode must be exactly 4 digits"),
  country: z.string().default("AU"),
  status: z.enum(HOUSE_STATUSES),
  goLiveDate: z.date(),
  resident: z.string().optional(),
  notes: z.string().optional(),
})
```

**Server-Side (API Route Validation):**
- Duplicate schema validation in `/api/houses` POST endpoint
- Unique ID generation with collision detection
- Audit field population (createdAt, updatedAt, createdBy, updatedBy)

### ID Generation System
- Format: `H-YYYY-NNN` (H-2025-001, H-2025-002, etc.)
- Year-based sequence numbering
- Server-side generation to ensure uniqueness
- Collision detection and retry mechanism

### Success Flow
1. Form validation passes
2. API call with loading state
3. Server creates house with auto-generated ID
4. Success toast: "House {ID} created successfully!"
5. 1-second delay for user feedback
6. Redirect to `/houses/{id}` detail page

### Error Handling
- **Validation Errors**: Inline field-level error messages
- **Network Errors**: Toast notification with retry guidance
- **Server Errors**: User-friendly error messages with fallbacks
- **Loading States**: Form disabled with visual feedback

---

## All Needed Context

### Documentation & References

**Core Framework Documentation:**
```yaml
- doc: https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts
  section: App Router Pages and Layouts
  critical: Proper page.tsx structure for /houses/new route

- doc: https://react-hook-form.com/get-started
  section: Zod Resolver Integration  
  critical: Client-side validation patterns with zodResolver

- doc: https://zod.dev/
  section: Schema Validation and TypeScript Integration
  critical: Shared validation schemas for client/server consistency

- doc: https://ui.shadcn.com/docs/components/form
  section: Form Component with React Hook Form
  critical: Accessible form components and validation display
```

**External Best Practices (2025):**
```yaml
- url: https://markus.oberlehner.net/blog/using-react-hook-form-with-react-19-use-action-state-and-next-js-15-app-router
  section: React Hook Form with Next.js 15 App Router
  critical: Modern form patterns for React 19 + Next.js 15

- url: https://wasp.sh/blog/2025/01/22/advanced-react-hook-form-zod-shadcn
  section: Advanced React Hook Form, Zod and Shadcn Integration
  critical: 2025 best practices for form validation stack

- url: https://ui.shadcn.com/docs/components/form
  section: ShadCN Form Components
  critical: Accessible form patterns with proper ARIA support
```

### Existing Codebase Patterns

**Current Implementation Files:**
```yaml
- file: app/(admin)/houses/new/page.tsx
  why: Complete page implementation with form integration, error handling, and navigation
  pattern: "Page component handles API calls, loading state, success/error feedback, and routing"

- file: components/houses/HouseForm.tsx  
  why: Reusable form component with comprehensive validation and accessibility
  pattern: "Component accepts onSubmit callback, loading state, and className for reusability"

- file: components/houses/HouseForm.test.tsx
  why: Comprehensive unit test coverage (11 test scenarios)
  pattern: "Tests validation, form behavior, accessibility, and user interactions"

- file: components/houses/HouseForm.stories.tsx
  why: Storybook stories for component development and documentation
  pattern: "Multiple stories showing different states and use cases"

- file: app/api/houses/route.ts
  why: Server-side validation and house creation API endpoint
  pattern: "POST handler with Zod validation, ID generation, and error handling"

- file: lib/schemas/house.ts
  why: Shared Zod schema for client/server validation consistency
  pattern: "Single source of truth for validation rules"

- file: lib/utils/house-id-generator.ts
  why: Unique ID generation with year-based sequence logic
  pattern: "Utility function with collision detection and retry mechanism"

- file: lib/utils/house-storage.ts
  why: Abstracted storage layer for future database migration
  pattern: "Storage interface allows easy swapping from localStorage to database"

- file: e2e/add-house.spec.ts
  why: Comprehensive E2E test coverage (11 test scenarios)
  pattern: "Tests full user journey, API integration, and edge cases"
```

### Known Gotchas & Library Quirks

```yaml
# CRITICAL: Next.js 15 App Router Patterns
- Route structure must use (admin) group folder for protected routes
- page.tsx files must export default function for Next.js App Router
- Client components need "use client" directive for form interactions

# CRITICAL: React Hook Form + Zod Integration  
- zodResolver must be imported from @hookform/resolvers/zod
- Form validation mode should be set to "onBlur" for better UX
- Date inputs require proper conversion between string and Date types

# CRITICAL: ShadCN Form Components
- FormField component requires control, name, and render props
- FormMessage automatically displays Zod validation errors
- FormControl wraps the actual input component for proper styling

# CRITICAL: API Route Validation
- Server-side validation must duplicate client-side Zod schema
- NextResponse.json() required for proper API responses
- Error responses need consistent structure for client consumption

# CRITICAL: TypeScript Integration
- Use z.infer<typeof schema> for automatic type generation
- Proper typing for form data prevents runtime errors
- Export both schema and TypeScript type for reuse

# CRITICAL: Loading State Management
- Disable form during submission to prevent double-submission
- Visual loading feedback improves user experience
- Toast notifications need proper timing for user visibility
```

---

## Implementation Blueprint

### Data Models
```typescript
// lib/schemas/house.ts
import { z } from "zod"

export const houseCreateSchema = z.object({
  address1: z.string().min(3, "Address must be at least 3 characters").max(120),
  unit: z.string().optional(),
  suburb: z.string().min(1, "Suburb/City is required"),
  state: z.enum(["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"]),
  postcode: z.string().regex(/^\d{4}$/, "Postcode must be exactly 4 digits"),
  country: z.string().default("AU"),
  status: z.enum(["Active", "Vacant", "Under maintenance"]),
  goLiveDate: z.date(),
  resident: z.string().optional(),
  notes: z.string().optional(),
})

export type HouseCreateSchemaType = z.infer<typeof houseCreateSchema>

// types/house.ts  
export interface House extends HouseCreateSchemaType {
  id: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
}
```

### Task Implementation Order

```yaml
Task 1: Core Schema & Types
CREATE lib/schemas/house.ts
  - Define houseCreateSchema with Zod validation rules
  - Export TypeScript types for reuse across components
  - Include comprehensive field validation with error messages

Task 2: ID Generation Utility  
CREATE lib/utils/house-id-generator.ts
  - Implement H-YYYY-NNN format generation
  - Add collision detection and retry logic
  - Export generateHouseId() function

Task 3: Storage Abstraction Layer
CREATE lib/utils/house-storage.ts  
  - Abstract storage operations for future database migration
  - Implement addHouseToStorage() with audit fields
  - Handle data persistence and retrieval

Task 4: API Route Implementation
CREATE app/api/houses/route.ts
  - POST endpoint with server-side validation
  - Integrate ID generation and storage utilities
  - Proper error handling and response formatting

Task 5: Reusable Form Component
CREATE components/houses/HouseForm.tsx
  - Multi-section form layout (Address, Property, Additional)
  - React Hook Form integration with Zod validation
  - Accessibility features and loading states
  - Accept onSubmit callback for reusability

Task 6: Page Component Integration
CREATE app/(admin)/houses/new/page.tsx
  - Form submission handling with API integration
  - Loading state management and error handling
  - Success flow with toast and redirect
  - Breadcrumb navigation and cancel functionality

Task 7: Comprehensive Testing
CREATE components/houses/HouseForm.test.tsx
  - Unit tests for form validation and behavior
  - Accessibility testing and user interaction flows
  - Edge cases and error conditions

CREATE e2e/add-house.spec.ts
  - End-to-end user journey testing
  - API integration validation
  - Success and error flow verification

Task 8: Component Documentation
CREATE components/houses/HouseForm.stories.tsx
  - Storybook stories for development and documentation
  - Multiple states: default, loading, validation, pre-filled
  - Interactive examples for design system
```

### Pseudocode Implementation

```tsx
// app/(admin)/houses/new/page.tsx - Page Component Pattern
export default function NewHousePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: HouseCreateSchemaType) => {
    setIsLoading(true)
    try {
      // API call with proper error handling
      const response = await fetch('/api/houses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(`House ${result.data.id} created successfully!`)
        setTimeout(() => router.push(`/houses/${result.data.id}`), 1000)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error('Failed to create house. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8">
          <Link href="/houses">Houses</Link> / New House
        </nav>
        
        {/* Form Card */}
        <div className="bg-white rounded-lg border p-8">
          <HouseForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}

// components/houses/HouseForm.tsx - Form Component Pattern
export function HouseForm({ onSubmit, isLoading }: HouseFormProps) {
  const form = useForm<HouseCreateSchemaType>({
    resolver: zodResolver(houseCreateSchema),
    defaultValues: { country: "AU", status: "Active" }
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Address Section */}
        <div className="space-y-4">
          <h3>Address Details</h3>
          <FormField
            control={form.control}
            name="address1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address Line 1 *</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main Street" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Additional fields... */}
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create House"}
        </Button>
      </form>
    </Form>
  )
}

// app/api/houses/route.ts - API Endpoint Pattern
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Server-side validation
    const validation = houseCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      )
    }

    // Generate unique ID and save
    const houseId = generateHouseId()
    const newHouse = addHouseToStorage(validation.data, houseId)
    
    return NextResponse.json({ success: true, data: newHouse }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

### Integration Points

```yaml
ROUTING:
  - Next.js App Router: app/(admin)/houses/new/page.tsx
  - API Endpoint: app/api/houses/route.ts
  - Protected route group: (admin) folder structure

AUTHENTICATION:
  - Admin-only access control
  - Route protection middleware
  - User context for audit fields

STYLING:
  - Tailwind CSS utility classes
  - ShadCN component library
  - Responsive design patterns

VALIDATION:
  - Shared Zod schemas
  - Client-side form validation
  - Server-side API validation

STORAGE:
  - Abstracted storage layer
  - Future database migration ready
  - Audit trail implementation
```

---

## Validation Loop

### Level 1: Syntax & Style
```bash
# Code quality checks
pnpm run lint
pnpm run typecheck
pnpm run prettier

# Expected: No errors, clean formatting
```

### Level 2: Unit Tests
```tsx
// components/houses/HouseForm.test.tsx
describe("HouseForm", () => {
  it("validates required fields", async () => {
    render(<HouseForm onSubmit={mockSubmit} />)
    fireEvent.click(screen.getByRole("button", { name: /create house/i }))
    
    expect(screen.getByText(/address must be at least 3 characters/i)).toBeInTheDocument()
    expect(screen.getByText(/suburb\/city is required/i)).toBeInTheDocument()
  })

  it("submits valid form data", async () => {
    render(<HouseForm onSubmit={mockSubmit} />)
    
    await userEvent.type(screen.getByLabelText(/address line 1/i), "123 Test Street")
    await userEvent.type(screen.getByLabelText(/suburb\/city/i), "Sydney") 
    await userEvent.selectOptions(screen.getByLabelText(/state/i), "NSW")
    await userEvent.type(screen.getByLabelText(/postcode/i), "2000")
    
    fireEvent.click(screen.getByRole("button", { name: /create house/i }))
    
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        address1: "123 Test Street",
        suburb: "Sydney",
        state: "NSW",
        postcode: "2000"
      })
    )
  })
})
```

```bash
# Run unit tests
pnpm run test

# Expected: All tests pass with comprehensive coverage
```

### Level 3: Integration Tests (Playwright E2E)
```typescript
// e2e/add-house.spec.ts
test("creates house with complete user journey", async ({ page }) => {
  await page.goto("/houses/new")
  
  // Fill required fields
  await page.getByLabel(/address line 1/i).fill("123 Test Street")
  await page.getByLabel(/suburb\/city/i).fill("Sydney")
  await page.getByLabel(/state/i).selectOption("NSW")
  await page.getByLabel(/postcode/i).fill("2000")
  await page.getByLabel(/go-live date/i).fill("2024-01-15")
  
  // Submit and verify
  await page.getByRole("button", { name: /create house/i }).click()
  await expect(page.getByText(/house.*created successfully/i)).toBeVisible()
  await page.waitForURL(/\/houses\/H-\d{4}-\d{3}/)
  
  // Verify house details page
  await expect(page.getByRole("heading", { name: /123 Test Street/i })).toBeVisible()
})

test("validates form fields", async ({ page }) => {
  await page.goto("/houses/new")
  await page.getByRole("button", { name: /create house/i }).click()
  
  await expect(page.getByText(/address must be at least 3 characters/i)).toBeVisible()
  await expect(page.getByText(/suburb\/city is required/i)).toBeVisible()
})
```

```bash
# Run E2E tests
pnpm run e2e:headless

# Expected: All user journeys pass, including API integration
```

### Level 4: Manual Acceptance Testing
```yaml
NAVIGATION:
  ✓ Navigate to /houses/new from houses list
  ✓ Breadcrumb navigation works correctly
  ✓ Cancel link returns to houses list

FORM VALIDATION:
  ✓ Required field validation prevents submission
  ✓ Postcode format validation (4 digits)
  ✓ Australian state dropdown populated correctly
  ✓ Date input accepts valid dates

USER EXPERIENCE:
  ✓ Form disables during submission
  ✓ Loading state provides visual feedback
  ✓ Success toast appears with house ID
  ✓ Redirect to house detail page works
  ✓ Error handling displays user-friendly messages

ACCESSIBILITY:
  ✓ Keyboard navigation through form fields
  ✓ Screen reader compatibility
  ✓ ARIA labels and error announcements
  ✓ Form validation errors properly associated
```

---

## Final Validation Checklist

**Core Functionality:**
- [ ] Form renders with all required fields
- [ ] Client-side validation prevents invalid submissions
- [ ] Server-side validation catches edge cases
- [ ] Unique ID generation works consistently
- [ ] Success flow completes with toast and redirect
- [ ] Error handling covers all scenarios

**Code Quality:**
- [ ] TypeScript strict mode passes
- [ ] ESLint rules satisfied
- [ ] Prettier formatting applied
- [ ] No console errors in browser
- [ ] Responsive design works on mobile/desktop

**Testing Coverage:**
- [ ] Unit tests cover form validation logic
- [ ] Integration tests validate API endpoints
- [ ] E2E tests cover complete user journeys
- [ ] Edge cases and error conditions tested
- [ ] Accessibility requirements verified

**Documentation & Patterns:**
- [ ] Component documented in Storybook
- [ ] Code follows established project patterns
- [ ] TASK.md updated with implementation details
- [ ] Future enhancement opportunities identified

**Production Readiness:**
- [ ] Performance tested with large forms
- [ ] Security validation for admin-only access
- [ ] Error logging and monitoring ready
- [ ] Database migration path prepared

---

## Anti-Patterns to Avoid

**❌ Form Implementation:**
- Don't bypass Zod validation → always validate user input
- Don't store dates as locale strings → use ISO-8601 format
- Don't allow double-submission → disable form during loading
- Don't ignore accessibility → implement proper ARIA support

**❌ API Design:**
- Don't trust client data → always validate server-side
- Don't expose internal errors → return user-friendly messages
- Don't ignore audit trails → record created/updated metadata
- Don't hardcode IDs → use proper generation utilities

**❌ State Management:**
- Don't mutate form state directly → use React Hook Form methods
- Don't ignore loading states → provide visual feedback
- Don't forget error cleanup → clear errors on retry
- Don't cache sensitive data → handle form resets properly

**❌ Testing Strategy:**
- Don't skip validation testing → test both success and failure
- Don't ignore accessibility testing → verify screen reader support
- Don't mock everything → test real API integration in E2E
- Don't forget edge cases → test boundary conditions

---

## PRP Quality Assessment

**Confidence Score: 9/10**

**Strengths:**
- ✅ Comprehensive existing implementation provides proven patterns
- ✅ Detailed validation strategy with client/server consistency
- ✅ Complete testing coverage (unit + integration + E2E)
- ✅ Modern tech stack with 2025 best practices
- ✅ Accessibility and user experience considerations
- ✅ Clear implementation blueprint with task ordering
- ✅ Extensive context and documentation references

**Potential Challenges:**
- ⚠️ Database migration path needs planning for production
- ⚠️ Admin authentication integration not fully specified
- ⚠️ Performance testing requirements for large datasets

**Recommendation:**
This PRP provides everything needed for successful one-pass implementation using Claude Code. The existing codebase provides proven patterns, comprehensive testing validates functionality, and modern best practices ensure maintainable code. The detailed context and validation loops minimize implementation risk.