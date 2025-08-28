name: "Transactions"
description: |

## Purpose

Capture billable events against clients (residents) that draw down their active contracts over time. Each transaction represents a debit from a client’s available funding under a specific contract line (e.g., SDA rent, SIL support hours). The system must show per-client balances, contract balances, and provide high-volume list UX similar to the shadcnexamples “Tasks” table (dense, sortable, filterable, selectable rows).

Central source of truth for what was billed, to whom, when, and why.

Automates drawdown: when transactions are recorded (manually or generated), the contract’s remaining balance is reduced.

Provide operational visibility for houses → residents → contracts → transactions so providers can reconcile and get paid on time.

## Core Principles
1. **Context is King**: Follow existing Next.js App Router + shadcn/ui + Tailwind patterns.
2. **Validation Loops**: Include proper error handling, loading states, and E2E flow.
3. **Information Dense**: Use project naming, folder structure, and existing storage utilities.
4. **Progressive Success**: Start with basic list loading, then add sorting/filtering later.
5. **Global rules**: Obey CLAUDE.md and repo conventions.

---

## Goal
A Transactions screen showing a table of individual transactions (debits) linked to Clients and Contracts.

Inline running balances: per client and per contract (derived).

Fast filtering (by client, contract, house, date range, status) with a look/feel like /tasks.

## Why
Ensures drawdown accuracy and visibility → fewer claim rejections, better cash-flow predictability.

Aligns with SDA/SIL provider workflows (house head-lease → residents → government-funded contracts → automated billing).

### Data Display Format
As there will be many records, something like this would be great - https://shadcnexamples.com/tasks
Route: /admin/transactions

Header bar: title, date range filter, client filter, contract filter, house filter, status filter, search (serviceCode/note).

Table (TanStack + shadcn Table):

Columns: Checkbox (bulk select), Date (occurredAt), Client, House, Contract, Service Code, Qty, Unit Price, Amount, Status, Note, Actions (view/edit).

Sorting: occurredAt (desc default), amount, client, status.

Filtering: as header controls (above); also column-level quick filters.

Pagination: server-driven or local for now (page size 25).

Density: compact; column visibility menu; sticky header; keyboard nav.

Row actions: View / Edit / Void / Duplicate.

Bulk actions: Post drafts, Void posted (with constraints), Export CSV (selected or filtered).

Empty state: “No transactions yet” with CTA “Create Transaction”.

Create transaction: Sheet or Dialog with:

Client (combobox), Contract (filtered by client & active), Date, Service Code (select), Quantity/Unit Price (auto-calc), Amount (editable override), Note.

Validation preview: “Remaining after post: $X.XX”.

Resident record integration:

On /admin/clients/[id]: small Balances widget (active contracts with remaining), and a Recent Transactions list (last 5 with link “View all”).

### Look and feel suggestions



### User Experience Flow
As long as when in the resident record you can see the balances that is greaat!


### Success Criteria
Can create draft transactions and post them; contract remaining reduces accordingly; void restores balance.

Transactions filter/sort/paginate correctly; selected bulk post works.

From a resident page, balances and recent transactions are visible and link back.

## All Needed Context
how this industry works - https://ndisloanexperts.com.au/head-lease-vs-traditional-lease/
how the scheme works for residents - https://teamdsc.com.au/resources/what-are-the-specialist-disability-accommodation-sda-eligibility-requirements-
how the scheme that funds all of this works - https://www.ndis.gov.au/understanding/how-ndis-works


### Existing Implementation to Build Upon
```yaml
- file: app/api/houses/route.ts (current: POST only)
  why: Add GET handler to existing file for retrieving all houses
  pattern: Follow same error handling and response structure as POST

- file: app/(admin)/houses/page.tsx (current: static mock data)
  why: Replace hardcoded table rows with dynamic data loading
  pattern: Convert to client component with useState/useEffect pattern

- file: lib/utils/house-storage.ts
  why: Already has getHousesFromStorage() function ready to use
  pattern: Use existing storage abstraction for consistent data access

- file: app/(admin)/houses/[id]/page.tsx
  why: Shows proper loading states and error handling patterns
  pattern: Follow same loading/error patterns for consistency

- file: components/houses/HouseForm.tsx
  why: Reference for proper TypeScript types and data structure
  pattern: Use same House type and interfaces
```

### Similar Patterns in Codebase
```yaml
- file: app/(admin)/houses/[id]/page.tsx
  why: Shows proper data fetching with loading states
  pattern: "useEffect + useState + API call + loading/error handling"
  code_example: |
    useEffect(() => {
      const fetchHouse = async () => {
        try {
          const response = await fetch(`/api/houses/${id}`)
          const result = await response.json()
          if (result.success) setData(result.data)
        } catch (error) {
          setError('Failed to load')
        } finally {
          setLoading(false)
        }
      }
      fetchHouse()
    }, [id])

- file: components/houses/HouseForm.tsx  
  why: Shows proper TypeScript types for House data
  pattern: "Import types from types/house and use consistently"
```

### Documentation & References
```yaml
- file: PROJECT-README.md
  why: Project structure, conventions, scripts

- file: CLAUDE.md  
  why: Global rules for agents and coding standards

- file: PLANNING.md
  why: Component co-location patterns and testing requirements

- doc: Next.js App Router (app directory)
  section: API Routes and Server Components
  url: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

- doc: React Hooks
  section: useEffect and useState patterns
  url: https://react.dev/reference/react/useEffect
```

### Technical Implementation Notes
```yaml
API_STRUCTURE:
  - GET /api/houses should return: { success: boolean, data: House[], error?: string }
  - Follow same pattern as existing POST and individual GET endpoints
  - Include realistic delay (300-500ms) for loading state demonstration

DATA_FLOW:
  - Storage: lib/utils/house-storage.ts → getHousesFromStorage()  
  - API: app/api/houses/route.ts → GET handler
  - Frontend: app/(admin)/houses/page.tsx → useEffect fetch
  - Display: Dynamic table rows instead of hardcoded content

ERROR_HANDLING:
  - API errors: Return consistent JSON error structure  
  - Frontend errors: Show user-friendly messages with retry option
  - Loading states: Skeleton placeholders during data fetch
  - Empty states: Guide users to create their first house

PERFORMANCE_CONSIDERATIONS:
  - Client-side data fetching suitable for current localStorage approach
  - Future database migration ready (storage abstraction already exists)
  - No caching needed initially - direct API calls are sufficient
```
            Testing Notes

Unit: amount math, posting/voiding balance updates, validation errors.

Integration: route handlers with draft→posted transitions and negative-balance block.

E2E: create→post→void from the table; filters work; CSV export produces selected rows.

Future Hooks

Automated generation: cron/worker to generate recurring rent/nightly transactions per contract.

Claims export: transform to provider claim formats; NDIA integrations later.

Multi-tenant: scope by provider/org; per-house reporting.

If you want, I can turn this into starter code (types, Zod, route handlers, and the table skeleton) that you can drop straight in—just say the word and which storage you want first (your current local storage abstraction vs Drizzle/Neon).       

### revision notes #1

The filter pane on the top is great, but get rid of service code and string serach, and make that pane take up less space verticlly

