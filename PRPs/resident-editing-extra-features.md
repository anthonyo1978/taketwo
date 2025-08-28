name: "Feature PRP - Resident Editing and Extra Features"
description: |

## Purpose
Enable comprehensive resident record management by adding status transitions, funding information, and detailed notes/preferences. This feature transforms basic resident creation into full resident lifecycle management, allowing housing providers to track resident status (Active/Draft/Deactivated), funding details, and enriched resident information for proper house management.

## Core Principles
1. **Context is King**: Follow existing Next.js App Router + shadcn/ui + Tailwind patterns from resident and house management.
2. **Validation Loops**: Include proper error handling, loading states, and E2E flow testing.
3. **Information Dense**: Use project naming, folder structure, and existing storage utilities.
4. **Progressive Success**: Start with resident detail view, then add status management, then funding information.
5. **Global rules**: Obey CLAUDE.md and repo conventions for co-located testing.

---

## Goal
Users can:
- Navigate to a resident detail page from residents table
- Edit existing resident information (name, contact, etc.)
- Change resident status through clear state transitions (Draft → Active → Deactivated)
- Add and manage funding information against residents
- Capture detailed notes and preferences
- View comprehensive resident history and audit trail

---

## Why
- **Business Operations**: Housing providers need to track resident lifecycle and funding status
- **Compliance**: Required funding information and status tracking for housing regulations
- **User Experience**: Centralized resident management with clear status flows
- **Data Integrity**: Proper audit trails for resident changes and status transitions

---

## What
- **Resident Detail Page** (`/residents/[id]`) with comprehensive information display
- **Resident Edit Form** with all current fields plus new enriched data
- **Status Management System** with proper state transitions and validation
- **Funding Information Module** with financial tracking capabilities
- **Notes & Preferences System** with rich text support
- **Audit Trail Component** showing resident change history

### Success Criteria
- [ ] Resident detail page displays all current information
- [ ] Edit form allows modification of existing fields
- [ ] Status can be changed with proper validation (Draft → Active → Deactivated)
- [ ] Status changes are logged with timestamps and user information
- [ ] Funding information can be added, edited, and removed
- [ ] Notes and preferences are editable with rich text support
- [ ] All changes maintain proper audit trails
- [ ] Integration with existing resident avatars and house associations
- [ ] All tests pass (unit + E2E integration)

---

## All Needed Context

### Current Resident Architecture
```typescript
// types/resident.ts - Current structure
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
```

### Documentation & References
```yaml
- file: types/resident.ts
  why: Current resident data structure - needs extension for status and funding
  critical: Follow same audit field patterns for new fields

- file: components/residents/ResidentForm.tsx
  why: Existing form pattern for resident creation - extend for editing
  critical: Use same validation structure and error handling

- file: lib/schemas/resident.ts  
  why: Existing zod validation - extend for new fields
  critical: Follow same validation patterns and error messages

- file: lib/utils/resident-storage.ts
  why: Storage abstraction for residents - extend for updates
  critical: Use same localStorage/server-side memory pattern

- file: app/api/houses/[id]/residents/route.ts
  why: Existing resident API patterns
  critical: Follow same { success: boolean, data?, error? } format

- file: components/residents/GlobalResidentTable.tsx
  why: Current table with click-to-edit patterns
  critical: Add navigation to detail page from existing table

- file: app/(admin)/houses/[id]/page.tsx
  why: Detail page pattern with loading states and error handling
  critical: Use same loading/error patterns for resident detail page

- file: types/house.ts
  why: Status enum patterns (Active, Vacant, Maintenance)
  critical: Mirror status pattern approach for resident statuses

- doc: https://react-hook-form.com/get-started
  section: Form state management and validation patterns
  critical: Proper form handling for complex resident editing

- doc: https://zod.dev/
  section: Schema composition and refinement for complex objects
  critical: Validate funding information and status transitions

- doc: https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes
  section: Dynamic routes for resident detail pages
  critical: Proper routing for /residents/[id] pages
```

### Current Codebase Tree
```
app/api/
├── houses/[id]/residents/route.ts  # GET/POST residents for house
└── residents/route.ts              # GET all residents globally
components/residents/
├── ResidentForm.tsx                # Creation form - extend for editing
├── ResidentTable.tsx               # House-specific resident table
├── GlobalResidentTable.tsx         # All residents table - add detail navigation
└── ResidentAvatars.tsx            # Avatar display in houses
types/resident.ts                   # Current resident interface
lib/
├── schemas/resident.ts            # Zod validation - extend
└── utils/resident-storage.ts      # Storage abstraction - extend
```

### Desired Codebase Tree  
```
app/
├── api/residents/
│   ├── route.ts                   # GET/POST all residents
│   └── [id]/
│       ├── route.ts               # GET/PUT/DELETE specific resident
│       └── funding/route.ts       # GET/POST/PUT funding information
├── (admin)/residents/
│   ├── page.tsx                   # Current global residents table
│   └── [id]/
│       ├── page.tsx               # Resident detail page
│       └── edit/page.tsx          # Resident edit form page
components/residents/
├── ResidentDetail.tsx             # Comprehensive resident display
├── ResidentEditForm.tsx           # Extended edit form
├── StatusManager.tsx              # Status transition component
├── FundingManager.tsx             # Funding information management
├── NotesEditor.tsx                # Rich text notes editor
└── AuditTrail.tsx                 # Change history display
types/
├── resident.ts                    # Extended resident interface
├── funding.ts                     # Funding information types
└── audit.ts                       # Audit trail types
lib/schemas/
├── resident-update.ts             # Update validation schemas
├── funding.ts                     # Funding validation
└── status-transition.ts           # Status change validation
```

## Known Gotchas & Library Quirks

```typescript
// CRITICAL: Status transitions must be validated server-side
const statusTransitions = {
  'Draft': ['Active', 'Deactivated'],
  'Active': ['Deactivated'],
  'Deactivated': ['Active'] // Reactivation allowed
}

// CRITICAL: React Hook Form with dynamic fields requires useFieldArray
const { fields, append, remove } = useFieldArray({
  control,
  name: "fundingInformation"
})

// CRITICAL: Next.js dynamic routes require proper error handling
export async function generateStaticParams() {
  return [] // Dynamic rendering for resident IDs
}

// CRITICAL: Date handling for audit trails requires consistent timezone
const auditEntry = {
  timestamp: new Date().toISOString(),
  action: 'STATUS_CHANGE',
  oldValue: 'Draft',
  newValue: 'Active',
  userId: 'current-user'
}

// CRITICAL: Rich text editor state management with React Hook Form
const notesRef = register("detailedNotes", { 
  validate: (value) => value.length <= 5000 || "Notes must be under 5000 characters"
})

// CRITICAL: Funding amounts must be handled as numbers with proper precision
const fundingAmount = z.number().min(0).max(999999.99)
  .refine(val => Number.isFinite(val), "Invalid funding amount")
```

## Implementation Blueprint

### Extended Data Models
```typescript
// types/resident.ts - Extended interface
export type ResidentStatus = 'Draft' | 'Active' | 'Deactivated'

export interface FundingInformation {
  id: string
  type: 'NDIS' | 'Government' | 'Private' | 'Family' | 'Other'
  amount: number
  startDate: Date
  endDate?: Date
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ResidentPreferences {
  dietary?: string[]
  medical?: string[]
  accessibility?: string[]
  communication?: string[]
  social?: string[]
  other?: string
}

export interface AuditLogEntry {
  id: string
  residentId: string
  action: string
  field?: string
  oldValue?: string
  newValue?: string
  timestamp: Date
  userId: string
  userEmail: string
}

export interface Resident {
  // ... existing fields
  status: ResidentStatus
  fundingInformation: FundingInformation[]
  preferences: ResidentPreferences
  detailedNotes?: string
  emergencyContact?: {
    name: string
    relationship: string
    phone: string
    email?: string
  }
  auditTrail: AuditLogEntry[]
}

export interface ResidentUpdateInput {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  status?: ResidentStatus
  detailedNotes?: string
  preferences?: ResidentPreferences
  emergencyContact?: {
    name: string
    relationship: string
    phone: string
    email?: string
  }
}
```

### Tasks (Implementation Order)
```yaml
Task 1: Extend Types and Schemas
UPDATE types/resident.ts
  - Add ResidentStatus type and FundingInformation interface
  - Add ResidentPreferences and AuditLogEntry interfaces
  - Extend Resident interface with new fields
  - Create ResidentUpdateInput interface

Task 2: Create Validation Schemas
CREATE lib/schemas/resident-update.ts
  - Create residentUpdateSchema with optional fields
  - Add status transition validation
  - Include funding information validation
  - Add preferences and notes validation

CREATE lib/schemas/funding.ts
  - Create fundingInformationSchema
  - Validate funding types and amounts
  - Date range validation for funding periods

Task 3: Extend Storage Layer
UPDATE lib/utils/resident-storage.ts
  - Add updateResidentInStorage() function
  - Add getResidentById() function
  - Add addAuditLogEntry() function
  - Handle status transition logging

Task 4: Create API Endpoints
CREATE app/api/residents/[id]/route.ts
  - GET: return specific resident with all details
  - PUT: update resident information with audit logging
  - DELETE: soft delete (set status to Deactivated)

CREATE app/api/residents/[id]/funding/route.ts
  - GET: return funding information for resident
  - POST: add new funding information
  - PUT: update existing funding information

Task 5: Create Resident Detail Page
CREATE app/(admin)/residents/[id]/page.tsx
  - Display comprehensive resident information
  - Show current status with visual indicators
  - Display funding information summary
  - Show recent audit trail entries
  - Include navigation to edit page

Task 6: Create Status Management Component
CREATE components/residents/StatusManager.tsx
  - Status transition buttons with validation
  - Confirmation modals for status changes
  - Visual status indicators
  - Status change history display

Task 7: Create Funding Management Component
CREATE components/residents/FundingManager.tsx
  - Add/edit/remove funding information
  - Calculate total funding amounts
  - Show funding period timelines
  - Funding status indicators

Task 8: Create Resident Edit Form
CREATE app/(admin)/residents/[id]/edit/page.tsx
  - Extended form with all editable fields
  - Status transition controls
  - Funding information management
  - Rich text editor for detailed notes
  - Emergency contact management

Task 9: Update Global Residents Table
UPDATE components/residents/GlobalResidentTable.tsx
  - Add status column with visual indicators
  - Add funding summary column
  - Add click-to-detail navigation
  - Include edit/deactivate action buttons

Task 10: Create Audit Trail Component
CREATE components/residents/AuditTrail.tsx
  - Display chronological change history
  - Filter by action type and date range
  - Show user information for changes
  - Expandable details for complex changes

Task 11: TESTS
  - Unit test status transition validation
  - Unit test funding information CRUD operations
  - Unit test ResidentEditForm with all new fields
  - E2E test: navigate to resident detail → edit → save changes
  - E2E test: status transitions with proper validation
  - E2E test: funding information management
```

### Pseudocode
```tsx
// app/(admin)/residents/[id]/page.tsx
function ResidentDetailPage({ params }: { params: { id: string } }) {
  const [resident, setResident] = useState<Resident | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchResident = async () => {
      try {
        const response = await fetch(`/api/residents/${params.id}`)
        const result = await response.json()
        if (result.success) setResident(result.data)
      } catch (error) {
        // Handle error
      } finally {
        setLoading(false)
      }
    }
    fetchResident()
  }, [params.id])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <div className="lg:col-span-2">
          <ResidentDetail resident={resident} />
        </div>
        
        {/* Status & Actions */}
        <div>
          <StatusManager 
            resident={resident}
            onStatusChange={handleStatusChange}
          />
          <FundingManager
            residentId={resident.id}
            fundingInfo={resident.fundingInformation}
          />
        </div>
        
        {/* Full Width Sections */}
        <div className="lg:col-span-3">
          <AuditTrail entries={resident.auditTrail} />
        </div>
      </div>
    </div>
  )
}

// components/residents/StatusManager.tsx  
function StatusManager({ resident, onStatusChange }) {
  const [isChanging, setIsChanging] = useState(false)
  
  const validTransitions = statusTransitions[resident.status] || []
  
  const handleStatusChange = async (newStatus: ResidentStatus) => {
    setIsChanging(true)
    try {
      const response = await fetch(`/api/residents/${resident.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      const result = await response.json()
      if (result.success) {
        onStatusChange?.(result.data)
      }
    } catch (error) {
      // Handle error
    } finally {
      setIsChanging(false)
    }
  }
  
  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">Status Management</h3>
      
      <div className="mb-4">
        <StatusBadge status={resident.status} />
      </div>
      
      {validTransitions.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Change Status To:
          </label>
          {validTransitions.map(status => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={isChanging}
              className="w-full text-left px-3 py-2 rounded-md border hover:bg-gray-50"
            >
              <StatusBadge status={status} size="sm" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// components/residents/FundingManager.tsx
function FundingManager({ residentId, fundingInfo }) {
  const [funding, setFunding] = useState(fundingInfo)
  const [showAddForm, setShowAddForm] = useState(false)
  
  const totalActive = funding
    .filter(f => f.isActive)
    .reduce((sum, f) => sum + f.amount, 0)
  
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Funding Information</h3>
        <button 
          onClick={() => setShowAddForm(true)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Add Funding
        </button>
      </div>
      
      <div className="mb-4 p-3 bg-green-50 rounded-lg">
        <div className="text-2xl font-bold text-green-800">
          ${totalActive.toLocaleString()}
        </div>
        <div className="text-sm text-green-600">
          Total Active Funding
        </div>
      </div>
      
      <div className="space-y-3">
        {funding.map(fund => (
          <FundingItem 
            key={fund.id}
            funding={fund}
            onUpdate={handleFundingUpdate}
          />
        ))}
      </div>
      
      {showAddForm && (
        <FundingForm
          residentId={residentId}
          onSave={handleFundingAdd}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  )
}
```

### Integration Points
```yaml
NAVIGATION:
  - Add "View Details" links to GlobalResidentTable
  - Add "Edit" button on resident detail page
  - Breadcrumb navigation: Residents → [Name] → Edit

API_ENDPOINTS:
  - GET /api/residents/[id] - Get resident with full details
  - PUT /api/residents/[id] - Update resident information
  - POST /api/residents/[id]/funding - Add funding information
  - PUT /api/residents/[id]/funding/[fundingId] - Update funding
  - DELETE /api/residents/[id]/funding/[fundingId] - Remove funding

STATUS_WORKFLOW:
  - Draft: Initial creation state, can edit all fields
  - Active: Resident is living in house, limited editing
  - Deactivated: Resident moved out, read-only with reactivation option

FUNDING_TYPES:
  - NDIS: National Disability Insurance Scheme funding
  - Government: Other government assistance
  - Private: Private insurance or funding
  - Family: Family-provided financial support
  - Other: Custom funding sources

AUDIT_ACTIONS:
  - CREATED, UPDATED, STATUS_CHANGED, FUNDING_ADDED, 
  - FUNDING_UPDATED, FUNDING_REMOVED, PHOTO_UPDATED, DEACTIVATED
```

## Validation Loop

### Level 1: Syntax & Style
```bash
pnpm run lint
pnpm run prettier  
pnpm run typecheck
```

### Level 2: Unit Tests
```typescript
// components/residents/StatusManager.test.tsx
test("StatusManager shows valid transitions only", () => {
  const mockResident = { status: 'Draft', ...otherFields }
  render(<StatusManager resident={mockResident} onStatusChange={vi.fn()} />)
  
  expect(screen.getByText('Active')).toBeInTheDocument()
  expect(screen.getByText('Deactivated')).toBeInTheDocument()
  expect(screen.queryByText('Draft')).not.toBeInTheDocument()
})

// components/residents/FundingManager.test.tsx  
test("FundingManager calculates total correctly", () => {
  const mockFunding = [
    { amount: 1000, isActive: true },
    { amount: 500, isActive: false },
    { amount: 750, isActive: true }
  ]
  
  render(<FundingManager fundingInfo={mockFunding} residentId="R001" />)
  expect(screen.getByText('$1,750')).toBeInTheDocument()
})

// lib/schemas/resident-update.test.ts
test("status transitions validate correctly", () => {
  const schema = residentUpdateSchema
  
  expect(() => schema.parse({ status: 'Active', currentStatus: 'Draft' })).not.toThrow()
  expect(() => schema.parse({ status: 'Draft', currentStatus: 'Active' })).toThrow()
})
```

```bash
pnpm run test
```

### Level 3: Integration Test (Playwright)
```typescript
// e2e/resident-editing.spec.ts
test("admin can edit resident and change status", async ({ page }) => {
  // Navigate to residents page
  await page.goto("/residents")
  
  // Click on first resident to view details
  await page.click("tbody tr:first-child a")
  
  // Should be on resident detail page
  await expect(page.locator("h1")).toContainText("Resident Details")
  
  // Click edit button
  await page.click("text=Edit Resident")
  
  // Update resident information
  await page.fill('input[name="phone"]', "0412999888")
  await page.selectOption('select[name="status"]', "Active")
  
  // Add funding information
  await page.click("text=Add Funding")
  await page.selectOption('select[name="fundingType"]', "NDIS")
  await page.fill('input[name="amount"]', "1500")
  await page.fill('input[name="startDate"]', "2024-01-01")
  
  // Save changes
  await page.click('button[type="submit"]')
  
  // Should redirect back to detail page with updated info
  await expect(page.locator("text=Active")).toBeVisible()
  await expect(page.locator("text=$1,500")).toBeVisible()
  await expect(page.locator("text=0412999888")).toBeVisible()
})

test("status transitions are properly validated", async ({ page }) => {
  // Create resident in Draft status
  await page.goto("/residents/new")
  // ... create resident ...
  
  // Navigate to detail page
  await page.goto(`/residents/${residentId}`)
  
  // Change status to Active
  await page.click("text=Change Status")
  await page.click("text=Active")
  await page.click("text=Confirm")
  
  // Verify status changed
  await expect(page.locator("text=Active")).toBeVisible()
  
  // Try to change back to Draft (should not be allowed)
  await page.click("text=Change Status")
  await expect(page.locator("text=Draft")).not.toBeVisible()
  await expect(page.locator("text=Deactivated")).toBeVisible()
})
```

## Final Validation Checklist
- [ ] Resident detail page displays all information correctly
- [ ] Edit form allows modification of all appropriate fields
- [ ] Status transitions work with proper validation
- [ ] Status changes are logged in audit trail
- [ ] Funding information can be added, edited, and removed
- [ ] Funding totals calculate correctly
- [ ] Notes editor supports rich text input
- [ ] Emergency contact information can be managed
- [ ] All changes maintain audit trails with user information
- [ ] Integration with existing resident avatars works
- [ ] Navigation from residents table to detail page works
- [ ] All tests pass (`pnpm run test` and `pnpm run e2e:headless`)
- [ ] Lint/typecheck clean (`pnpm run lint && pnpm run typecheck`)
- [ ] Error states display user-friendly messages
- [ ] Loading states show during all async operations

## Anti-Patterns to Avoid
❌ Don't bypass status transition validation → always validate on both client and server
❌ Don't store funding amounts as strings → use proper number types with precision
❌ Don't forget audit logging → every change must be tracked
❌ Don't allow direct status manipulation → use proper transition methods
❌ Don't skip form validation → validate all inputs including funding information  
❌ Don't forget error handling → handle all API failures gracefully
❌ Don't hardcode status values → use TypeScript enums and constants
❌ Don't skip loading states → show feedback during all async operations

## Confidence Score: 8/10

This PRP provides comprehensive context for one-pass implementation success:
- ✅ Detailed analysis of current resident architecture and required extensions
- ✅ Complete technical specification with proper TypeScript interfaces
- ✅ Step-by-step implementation blueprint with proper task sequencing
- ✅ Full validation strategy with executable unit and E2E tests
- ✅ Clear integration points with existing resident management system
- ✅ Proper audit trail and status transition workflow design
- ✅ Comprehensive error handling and user experience considerations

The slight uncertainty (8/10 vs 9/10) comes from the complexity of funding information management and the need to ensure proper integration with existing resident avatars and house associations, but all patterns are well-established in the codebase.