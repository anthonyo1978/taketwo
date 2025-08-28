name: "Feature PRP - Dynamic House Listing (Replace Static Mock Data with Real Data Loading)"
description: |

## Purpose
Transform the static house listing page into a dynamic system that loads real houses from storage. This critical feature bridges the gap between house creation and visibility, enabling administrators to see all houses they've created and manage growing property portfolios effectively.

## Core Principles
1. **Context is King**: Leverage existing Next.js App Router + localStorage + API patterns already proven in the codebase.
2. **Validation Loops**: Implement proper loading/error states with comprehensive testing coverage.
3. **Information Dense**: Use existing storage utilities, TypeScript types, and component patterns.
4. **Progressive Success**: Start with basic data loading, then enhance with sorting/filtering later.
5. **Global Rules**: Follow PLANNING.md architecture and CLAUDE.md coding standards exactly.

---

## Goal
Eliminate the disconnect between house creation and listing visibility. When administrators create houses via `/houses/new`, they should immediately see their new houses in the main `/houses` listing table, with the list growing dynamically as more properties are added.

## Why
- **Critical Business Gap**: Houses are being created but remain invisible to users (stored ≠ displayed)
- **Scale Management**: Organizations scaling fast need reliable property portfolio visibility
- **User Trust**: Immediate feedback loop confirms successful house creation
- **Foundation Pattern**: Establishes reusable dynamic listing pattern for future entities
- **Data Consistency**: Eliminates confusion between what exists vs. what's shown

---

## What

### Current Problem Analysis
**Existing Static Implementation (`/app/(admin)/houses/page.tsx`):**
```tsx
// PROBLEM: Hardcoded static data
<tbody className="bg-white divide-y divide-gray-200">
  <tr>
    <td>Modern Family Home</td> {/* Static mock data */}
    <td>123 Main St, Springfield</td>
  </tr>
  <tr>
    <td>Luxury Condo</td> {/* Static mock data */}
    <td>456 Oak Ave, Downtown</td>
  </tr>
</tbody>
```

**The Gap:**
- Houses created via form → stored in localStorage ✅
- Individual house pages work perfectly ✅  
- Main listing shows only static data ❌
- No API endpoint for fetching all houses ❌

### Required Implementation

#### 1. Backend API Enhancement
**Add GET Handler to `/app/api/houses/route.ts`:**
- Extend existing POST-only route with GET method
- Use existing `getHousesFromStorage()` utility function
- Return consistent JSON structure matching existing patterns
- Include realistic delay for loading state demonstration

#### 2. Frontend Dynamic Loading  
**Transform Static Page to Dynamic (`/app/(admin)/houses/page.tsx`):**
- Convert from server component to client component pattern
- Implement `useEffect` + `useState` data fetching pattern
- Replace hardcoded table rows with dynamic data rendering
- Add comprehensive loading, error, and empty states

#### 3. Data Display Format
**Dynamic Table Rows (per house record):**
- House ID (clickable link to detail page): `H-2025-001`
- Full address: `"123 Test Street, Unit 2B"` 
- Location: `"Sydney, NSW 2000, AU"`
- Status badge: `Active` | `Vacant` | `Under Maintenance`
- Current resident: `"John Doe"` (if available)
- Created date: `"Dec 25, 2024 at 2:30 PM"`
- Actions: View Details (Edit/Delete for future)

#### 4. User Experience States
**Loading State:** Skeleton placeholders matching table structure
**Empty State:** Guide users to create their first house  
**Error State:** User-friendly retry mechanism
**Success State:** Dynamic table grows with each new house

---

## All Needed Context

### Existing Implementation Patterns

**Perfect Reference Implementation:**
```yaml
- file: app/(admin)/houses/[id]/page.tsx
  why: Shows exact pattern for client-side data fetching with loading/error states
  pattern: "useEffect + useState + API call + loading/error handling"
  critical_code: |
    const [house, setHouse] = useState<House | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
      const fetchHouse = async () => {
        try {
          const response = await fetch(`/api/houses/${id}`)
          const result = await response.json()
          if (result.success && result.data) {
            setHouse(result.data)
          } else {
            setError(result.error || 'House not found')
          }
        } catch (err) {
          setError('Failed to load house details')
        } finally {
          setLoading(false)
        }
      }
      fetchHouse()
    }, [id])
```

**Storage Layer Ready:**
```yaml
- file: lib/utils/house-storage.ts
  why: Already has getHousesFromStorage() function - no changes needed
  function: getHousesFromStorage(): House[]
  critical: Works on both client and server side with proper date handling

- file: types/house.ts
  why: TypeScript types already defined and used consistently
  pattern: Import and use House interface for proper type safety
```

**API Pattern to Follow:**
```yaml  
- file: app/api/houses/[id]/route.ts
  why: Shows exact error handling and response structure pattern
  pattern: "Try/catch + NextResponse.json + consistent error structure"
  critical_response_format: |
    Success: { success: true, data: House }
    Error: { success: false, error: "Error message" }
```

### Documentation & Best Practices

**2025 React Data Fetching Guidance:**
```yaml
- url: https://nextjs.org/docs/app/building-your-application/data-fetching/patterns
  section: Client-side Fetching Patterns
  critical: Use Route Handlers for client-side data fetching (not Server Actions)

- url: https://blog.logrocket.com/ui-design-best-practices-loading-error-empty-state-react/
  section: Loading, Error, and Empty States
  critical: Skeleton placeholders preferred over spinners for table loading

- url: https://react.dev/reference/react/useEffect
  section: useEffect Best Practices
  critical: Proper cleanup and dependency array management
```

**Modern Loading State Patterns:**
```yaml
- pattern: React Loading Skeleton
  why: Preferred over spinners for table loading in 2025
  implementation: Skeleton placeholders matching table structure

- pattern: Error Boundaries
  why: Graceful error handling at component level  
  implementation: Try/catch with user-friendly error messages
```

### Known Gotchas & Critical Requirements

```yaml
# CRITICAL: Client Component Requirements
- Must add "use client" directive for useEffect + useState
- Convert from server component pattern to client component pattern
- Maintain existing page layout and styling structure

# CRITICAL: API Response Consistency  
- GET /api/houses must return: { success: boolean, data: House[], error?: string }
- Follow exact same pattern as existing POST and individual GET endpoints
- Include 300-500ms delay for realistic loading state demonstration

# CRITICAL: Type Safety
- Import House type from types/house consistently
- Use proper TypeScript interfaces for API responses
- Handle Date objects properly in JSON serialization

# CRITICAL: Loading State Management
- Show skeleton placeholders during data fetch
- Prevent UI flicker with proper loading state transitions
- Handle both initial load and subsequent data updates

# CRITICAL: Error Handling
- Network errors: "Failed to load houses. Please try again."
- API errors: Display server-provided error messages
- Empty state: "No houses found. Create your first house!"
- Include retry mechanism for failed requests

# CRITICAL: Performance Considerations
- Direct API calls appropriate for current localStorage approach
- No caching layer needed initially (simple and effective)
- Client-side rendering suitable for admin interface
```

---

## Implementation Blueprint

### Task Execution Order

```yaml
Task 1: Add GET API Endpoint
FILE: app/api/houses/route.ts
ACTION: Add GET handler function alongside existing POST
IMPLEMENTATION:
  - Import getHousesFromStorage from lib/utils/house-storage
  - Add 300ms delay for loading state demonstration  
  - Return { success: true, data: houses } format
  - Handle errors with consistent error structure
  - Follow same try/catch pattern as existing POST handler

Task 2: Transform Page to Client Component  
FILE: app/(admin)/houses/page.tsx
ACTION: Convert from server component to client component
IMPLEMENTATION:
  - Add "use client" directive at top
  - Import useState, useEffect from React
  - Import House type from types/house
  - Set up state management for houses, loading, error
  - Implement data fetching in useEffect

Task 3: Implement Dynamic Table Rendering
FILE: app/(admin)/houses/page.tsx (continued)
ACTION: Replace static tbody with dynamic rendering
IMPLEMENTATION:
  - Map over houses array to generate table rows
  - Format address display consistently
  - Add clickable links to house detail pages
  - Include status badges with proper styling
  - Format dates using consistent date formatting

Task 4: Add Loading/Error/Empty States
FILE: app/(admin)/houses/page.tsx (continued)  
ACTION: Implement comprehensive state handling
IMPLEMENTATION:
  - Loading: Skeleton table rows matching structure
  - Error: User-friendly message with retry button
  - Empty: Guidance message with "Create First House" CTA
  - Success: Dynamic table with proper data display

Task 5: Comprehensive Testing
CREATE: components/houses/HouseList.test.tsx (if extracted)
CREATE: e2e/house-listing.spec.ts
ACTION: Test all states and user flows
IMPLEMENTATION:
  - Unit tests for data loading and error handling
  - E2E tests for create→list→view flow
  - Test loading states and error conditions
  - Verify dynamic list growth as houses are added
```

### Pseudocode Implementation

```tsx
// app/api/houses/route.ts - GET Handler Addition
export async function GET() {
  try {
    // Realistic API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Use existing storage utility
    const houses = getHousesFromStorage()
    
    return NextResponse.json(
      { success: true, data: houses },
      { status: 200 }
    )
  } catch (error) {
    console.error('Houses retrieval error:', error)
    return NextResponse.json(
      { success: false, error: "Failed to load houses" },
      { status: 500 }
    )
  }
}

// app/(admin)/houses/page.tsx - Dynamic Implementation
"use client"

import { useEffect, useState } from "react"
import type { House } from "types/house"

interface ApiResponse {
  success: boolean
  data?: House[]
  error?: string  
}

export default function HousesPage() {
  const [houses, setHouses] = useState<House[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHouses = async () => {
      try {
        const response = await fetch('/api/houses')
        const result: ApiResponse = await response.json()
        
        if (result.success && result.data) {
          setHouses(result.data)
        } else {
          setError(result.error || 'Failed to load houses')
        }
      } catch (err) {
        setError('Network error. Please check your connection.')
      } finally {
        setLoading(false)
      }
    }

    fetchHouses()
  }, [])

  // Loading state with skeleton table
  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header stays the same */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Houses</h1>
            <Link href="/houses/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg">
              Add New House
            </Link>
          </div>
          
          {/* Skeleton table */}
          <div className="bg-white rounded-lg border">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">House ID</th>
                  <th className="px-6 py-3 text-left">Address</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {[1,2,3].map(i => (
                  <tr key={i} className="border-t">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // Error state with retry
  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-600 text-lg mb-4">{error}</div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (houses.length === 0) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Houses</h1>
            <Link href="/houses/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg">
              Add New House
            </Link>
          </div>
          
          <div className="text-center py-12 bg-white rounded-lg border">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No houses found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first house.</p>
            <Link 
              href="/houses/new"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create First House
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Success state - dynamic table
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header unchanged */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Houses</h1>
          <Link href="/houses/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New House
          </Link>
        </div>
        
        {/* Dynamic table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Property Listings ({houses.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    House ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resident
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {houses.map((house) => (
                  <tr key={house.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        href={`/houses/${house.id}`}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        {house.id}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {house.address1}{house.unit && `, ${house.unit}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {house.suburb}, {house.state} {house.postcode}, {house.country}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        house.status === 'Active' 
                          ? 'bg-green-100 text-green-800'
                          : house.status === 'Vacant'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {house.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {house.resident || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(house.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link 
                        href={`/houses/${house.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## Validation Loop

### Level 1: Syntax & Style
```bash
# Code quality and type checking
pnpm run lint        # ESLint validation
pnpm run typecheck   # TypeScript strict mode
pnpm run prettier    # Code formatting

# Expected: No errors, clean formatting, proper TypeScript types
```

### Level 2: Unit Testing  
```tsx
// e2e/house-listing.spec.ts - Core functionality tests
test("displays dynamic house list after creation", async ({ page }) => {
  // Navigate to houses page
  await page.goto("/houses")
  
  // Should show empty state initially
  await expect(page.getByText("No houses found")).toBeVisible()
  
  // Create a new house
  await page.getByRole("link", { name: /add new house/i }).click()
  await page.getByLabel(/address line 1/i).fill("123 Dynamic Street")
  await page.getByLabel(/suburb\/city/i).fill("Sydney")
  await page.getByLabel(/state/i).selectOption("NSW")
  await page.getByLabel(/postcode/i).fill("2000")
  await page.getByLabel(/go-live date/i).fill("2025-01-01")
  
  await page.getByRole("button", { name: /create house/i }).click()
  await page.waitForURL(/\/houses\/H-\d{4}-\d{3}/)
  
  // Navigate back to listing
  await page.getByRole("link", { name: /houses/i }).first().click()
  
  // Should now show the created house
  await expect(page.getByText("123 Dynamic Street")).toBeVisible()
  await expect(page.getByText("Sydney, NSW 2000, AU")).toBeVisible()
  await expect(page.getByText("Active")).toBeVisible()
})

test("shows loading state during data fetch", async ({ page }) => {
  await page.goto("/houses")
  
  // Should show skeleton loading placeholders
  await expect(page.locator(".animate-pulse")).toBeVisible()
})

test("handles API errors gracefully", async ({ page }) => {
  // Mock API failure
  await page.route("/api/houses", route => route.abort())
  
  await page.goto("/houses")
  
  // Should show error message and retry button
  await expect(page.getByText("Network error")).toBeVisible()
  await expect(page.getByRole("button", { name: /try again/i })).toBeVisible()
})

test("creates multiple houses and shows growing list", async ({ page }) => {
  await page.goto("/houses")
  
  // Create first house
  await page.getByRole("link", { name: /add new house/i }).click()
  await fillHouseForm(page, "First House Street", "Brisbane", "QLD", "4000")
  await page.getByRole("button", { name: /create house/i }).click()
  await page.waitForURL(/\/houses\/H-\d{4}-\d{3}/)
  
  // Navigate back and create second house
  await page.goto("/houses")
  await expect(page.getByText("Property Listings (1)")).toBeVisible()
  
  await page.getByRole("link", { name: /add new house/i }).click()  
  await fillHouseForm(page, "Second House Street", "Perth", "WA", "6000")
  await page.getByRole("button", { name: /create house/i }).click()
  await page.waitForURL(/\/houses\/H-\d{4}-\d{3}/)
  
  // Verify both houses appear in list
  await page.goto("/houses")
  await expect(page.getByText("Property Listings (2)")).toBeVisible()
  await expect(page.getByText("First House Street")).toBeVisible()
  await expect(page.getByText("Second House Street")).toBeVisible()
})
```

```bash
# Run comprehensive tests
pnpm run e2e:headless

# Expected: All user journeys pass, including API integration and state handling
```

### Level 3: Manual Acceptance Testing
```yaml
NAVIGATION_FLOW:
  ✓ Navigate to /houses shows loading skeleton
  ✓ Loading completes and shows appropriate state (empty/list/error)
  ✓ "Add New House" button maintains functionality
  ✓ Created houses appear in list when returning from detail page

DYNAMIC_DATA_DISPLAY:
  ✓ House ID clickable and links to correct detail page
  ✓ Address formatted correctly with unit if present
  ✓ Status badges show correct colors (Active=green, Vacant=yellow, Maintenance=red)
  ✓ Resident field shows name or "-" if empty
  ✓ Created date formatted consistently

STATE_MANAGEMENT:
  ✓ Loading state shows skeleton placeholders (no spinners)
  ✓ Error state shows user-friendly message with retry button
  ✓ Empty state guides users to create first house
  ✓ Success state grows dynamically as more houses added

API_INTEGRATION:
  ✓ GET /api/houses returns proper JSON format
  ✓ Network errors handled gracefully with retry option
  ✓ Server errors display user-friendly messages
  ✓ Loading delay provides realistic user experience

SCALABILITY_TEST:
  ✓ List grows correctly from 0 → 1 → 5 → 10+ houses
  ✓ Table remains responsive with larger datasets
  ✓ No performance degradation with typical dataset sizes
```

---

## Final Validation Checklist

**Core Functionality:**
- [ ] GET `/api/houses` endpoint returns all stored houses
- [ ] Dynamic table replaces all static mock data
- [ ] Loading states prevent UI flicker and provide feedback
- [ ] Error handling covers network and API failures
- [ ] Empty state guides users to create first house
- [ ] Created houses appear immediately in listing

**User Experience:**
- [ ] Skeleton loading preferred over spinners (2025 best practice)
- [ ] Click-to-detail navigation works for all house IDs
- [ ] Table maintains responsive design on mobile/desktop
- [ ] Status badges use consistent color coding
- [ ] Addresses formatted clearly with proper hierarchy

**Technical Quality:**
- [ ] TypeScript strict mode passes without errors
- [ ] Client component conversion maintains page structure
- [ ] API responses follow existing pattern consistency
- [ ] Date handling works correctly across JSON serialization
- [ ] Loading state management prevents double-fetching

**Testing Coverage:**
- [ ] E2E tests verify complete create→list→view flow  
- [ ] Loading, error, and empty states tested
- [ ] Multiple house creation shows list growth
- [ ] API failure scenarios handled properly
- [ ] Performance acceptable with realistic datasets

**Production Readiness:**
- [ ] Error logging maintains existing patterns
- [ ] No console errors in browser during normal operation
- [ ] Storage abstraction maintains future database migration path
- [ ] Component patterns support future enhancements (sorting, filtering)

---

## Anti-Patterns to Avoid

**❌ Data Fetching:**
- Don't use Server Actions for data fetching → use Route Handlers
- Don't ignore loading states → always show skeleton placeholders
- Don't cache aggressively → simple API calls sufficient for current scale
- Don't overcomplicate → direct useEffect pattern appropriate here

**❌ State Management:**
- Don't fetch on every render → use useEffect dependency array correctly
- Don't ignore error cleanup → handle component unmounting
- Don't mix server/client patterns → stick to client component approach
- Don't bypass TypeScript → maintain strict type safety

**❌ UI/UX Design:**
- Don't use spinners for table loading → skeleton placeholders preferred
- Don't hide errors → show clear retry mechanisms
- Don't ignore empty states → guide users to first action
- Don't break responsive design → maintain mobile compatibility

**❌ API Design:**
- Don't change existing response patterns → follow established conventions
- Don't ignore realistic delays → include loading demonstration
- Don't skip error handling → cover network and server failures
- Don't expose internal errors → return user-friendly messages

---

## PRP Quality Assessment

**Confidence Score: 9.5/10**

**Strengths:**
- ✅ Leverages existing proven patterns from codebase (house detail page loading)
- ✅ All required utilities already exist (getHousesFromStorage, types, storage layer)
- ✅ Clear implementation path with specific file modifications
- ✅ Comprehensive testing strategy covering all user scenarios
- ✅ Modern 2025 best practices integrated (skeleton loading, proper error handling)
- ✅ Follows established project conventions exactly
- ✅ Future-proof architecture (database migration ready)

**Minor Challenges:**
- ⚠️ Client component conversion requires careful "use client" placement
- ⚠️ Loading state timing needs to feel natural (300ms delay)

**Recommendation:**
This PRP provides everything needed for successful one-pass implementation. The existing codebase contains all necessary patterns and utilities, making this a straightforward enhancement that closes the critical gap between house creation and listing visibility. The detailed pseudocode and validation loops minimize implementation risk while ensuring professional-quality results.