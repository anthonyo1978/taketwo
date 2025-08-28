name: "Feature PRP - Funding Engine (NDIS Contract-Based Funding with Balance Tracking)"
description: |

## Purpose
Transform the existing static funding information system into a dynamic NDIS funding engine that models funding as time-based contracts with automatic balance calculations and drawdown tracking. This enables accurate funding allocation management over time periods per resident, essential for NDIS compliance and successful accommodation provider business operations.

## Core Principles
1. **Context is King**: Build upon existing FundingManager component and resident funding infrastructure
2. **Validation Loops**: Include proper error handling, loading states, and comprehensive E2E testing
3. **Information Dense**: Use existing Next.js App Router + Tailwind + TypeScript patterns
4. **Progressive Success**: Start with contract model, add balance tracking, then drawdown mechanisms
5. **Global rules**: Obey CLAUDE.md and repo conventions for co-located testing

---

## Goal
Users can:
- Create funding contracts for residents with upfront allocations and time periods
- View current balance and remaining balance as funding reduces over time
- Make funding contracts active to begin automatic balance drawdown
- Track funding drawdown patterns aligned with NDIS payment structures
- See comprehensive funding status in resident records

---

## Why
- **Business Operations**: Managing funding allocations over time is critical to running accommodation provider businesses
- **NDIS Compliance**: Proper funding management prevents payment rejection when claiming from government
- **Financial Accuracy**: Accurate money management per resident, per house ensures business viability
- **Contract Lifecycle**: Proper contract expiry and renewal workflow maintains continuous funding

---

## What
- **Enhanced FundingInformation** model with contract fields and balance tracking
- **Contract Status Management** (Draft → Active → Expired → Renewed)
- **Balance Calculation Engine** with automatic drawdown over time
- **Funding Dashboard** showing current/remaining balances
- **Integration with existing FundingManager** component

### Success Criteria
- [ ] Funding contracts can be created with upfront amounts and time periods
- [ ] Contract status can be managed (make active, track expiry)
- [ ] Current balance and remaining balance display correctly
- [ ] Balance reduces automatically as time elapses (drawdown simulation)
- [ ] Integration with existing resident funding display
- [ ] All changes maintain proper audit trails
- [ ] All tests pass (unit + E2E integration)

---

## All Needed Context

### Current Funding Architecture Analysis
```typescript
// EXISTING: types/resident.ts - Current funding structure
export interface FundingInformation {
  id: string
  type: FundingType // 'NDIS' | 'Government' | 'Private' | 'Family' | 'Other'
  amount: number // Currently static amount
  startDate: Date
  endDate?: Date
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// EXISTING: Comprehensive FundingManager component with CRUD operations
// EXISTING: API endpoints at /api/residents/[id]/funding for full CRUD
// EXISTING: Zod validation schemas in lib/schemas/resident.ts
// EXISTING: Storage layer with resident-storage.ts utilities
```

### NDIS Industry Context & Requirements
```yaml
NDIS_FUNDING_STRUCTURE:
  - Funding is allocated in periodic blocks (typically 3-month periods as of 2025)
  - SDA providers receive direct NDIA payments plus participant rent contributions
  - Maximum rent contribution is 25% of disability support pension + 100% Commonwealth Rental Assistance
  - Funding periods allow staged release rather than full upfront allocation
  - Evidence required for all service delivery when invoicing

ACCOMMODATION_PROVIDER_REQUIREMENTS:
  - Must track funding allocation vs actual drawdown for NDIA claiming
  - Service agreements must align with funding periods
  - Fair pricing and transparent cost structures mandatory
  - Registration required for all SDA providers

BUSINESS_IMPACT:
  - Funding mismanagement leads to payment rejections
  - Proper occupancy maintenance critical for business viability
  - Contract renewal workflow essential for continuous funding
```

### Documentation & References
```yaml
- file: components/residents/FundingManager.tsx
  why: Existing comprehensive funding CRUD component - extend for contracts
  critical: 449 lines of production code with forms, validation, API integration

- file: types/resident.ts
  why: Current FundingInformation interface - extend for contract fields
  critical: Follow same audit field patterns for new contract data

- file: lib/schemas/resident.ts  
  why: Existing zod validation with fundingInformationSchema - extend
  critical: Lines 9-29 show current validation - add contract validation

- file: app/api/residents/[id]/funding/route.ts
  why: Full REST API with GET/POST/PUT/DELETE - extend for contract operations
  critical: 252 lines of production API code - add contract status endpoints

- file: lib/utils/resident-storage.ts
  why: Storage abstraction for residents - add contract balance calculations
  critical: Use same localStorage/server-side memory pattern

- file: components/residents/StatusManager.tsx
  why: State transition pattern - mirror for contract status transitions
  critical: Proper validation and confirmation dialogs for status changes

- doc: https://www.ndis.gov.au/providers/pricing-arrangements
  section: SDA pricing and payment structures
  critical: Understanding funding flow for accurate contract modeling

- doc: https://react-hook-form.com/get-started
  section: Complex form validation patterns
  critical: Contract form with dates, amounts, and status management

- doc: https://date-fns.org/docs/Getting-Started
  section: Date calculations for funding periods
  critical: Accurate time-based balance calculations
```

### Current Codebase Tree (Funding-Related)
```
components/residents/
├── FundingManager.tsx           # EXISTING: Full CRUD for funding
├── FundingManager.test.tsx      # EXISTING: 18 comprehensive test scenarios
├── StatusManager.tsx            # EXISTING: Status transition pattern to mirror
├── GlobalResidentTable.tsx      # EXISTING: Shows funding totals in table
└── ResidentAvatars.tsx         # EXISTING: Integration point for display

app/api/residents/[id]/
├── funding/route.ts            # EXISTING: Full REST API for funding CRUD
└── route.ts                    # EXISTING: Resident update API

types/
├── resident.ts                 # EXISTING: FundingInformation interface
└── house.ts                    # EXISTING: Status enum patterns to mirror

lib/
├── schemas/resident.ts         # EXISTING: fundingInformationSchema validation
└── utils/resident-storage.ts   # EXISTING: Storage utilities to extend
```

### Desired Codebase Tree
```
types/resident.ts               # EXTEND: Add contract fields to FundingInformation
lib/schemas/resident.ts         # EXTEND: Add contract validation schemas
components/residents/
├── FundingManager.tsx          # ENHANCE: Add contract management UI
├── ContractStatusManager.tsx   # NEW: Contract status transitions
└── FundingBalanceDisplay.tsx   # NEW: Balance visualization component
lib/utils/
├── resident-storage.ts         # EXTEND: Add contract balance calculations
└── funding-calculations.ts     # NEW: Balance drawdown logic
app/api/residents/[id]/funding/
└── contract/route.ts           # NEW: Contract-specific operations
```

## Known Gotchas & Library Quirks

```typescript
// CRITICAL: Date-based balance calculations must handle timezone consistently
const calculateRemainingBalance = (
  originalAmount: number,
  startDate: Date,
  endDate: Date,
  drawdownRate: 'daily' | 'weekly' | 'monthly'
) => {
  const now = new Date()
  // Must use same timezone for all calculations
  const elapsed = differenceInDays(now, startDate)
  const totalPeriod = differenceInDays(endDate, startDate)
  const drawdownPercentage = elapsed / totalPeriod
  return Math.max(0, originalAmount * (1 - drawdownPercentage))
}

// CRITICAL: Contract status transitions must mirror StatusManager pattern
const contractStatusTransitions = {
  'Draft': ['Active', 'Cancelled'],
  'Active': ['Expired', 'Cancelled'],
  'Expired': ['Renewed', 'Cancelled'],
  'Cancelled': [], // Terminal state
  'Renewed': ['Active'] // New contract created
}

// CRITICAL: Extend existing FundingInformation rather than replace
interface FundingContract extends FundingInformation {
  contractStatus: 'Draft' | 'Active' | 'Expired' | 'Cancelled' | 'Renewed'
  originalAmount: number        // Initial contract value
  currentBalance: number        // Calculated current balance
  drawdownRate: 'daily' | 'weekly' | 'monthly'
  autoDrawdown: boolean        // Enable automatic balance reduction
  lastDrawdownDate?: Date      // Track last calculation
  renewalDate?: Date          // When contract should be renewed
}

// CRITICAL: React Hook Form with complex contract fields
const contractSchema = fundingInformationSchema.extend({
  contractStatus: z.enum(['Draft', 'Active', 'Expired', 'Cancelled', 'Renewed']),
  originalAmount: z.number().min(0).max(999999.99),
  drawdownRate: z.enum(['daily', 'weekly', 'monthly']),
  autoDrawdown: z.boolean().default(true),
  renewalDate: z.coerce.date().optional()
})

// CRITICAL: Balance calculations must be performed server-side for consistency
// Client-side display only - never calculate balances in components
```

## Implementation Blueprint

### Extended Data Models
```typescript
// types/resident.ts - Enhanced contract-based funding
export type ContractStatus = 'Draft' | 'Active' | 'Expired' | 'Cancelled' | 'Renewed'
export type DrawdownRate = 'daily' | 'weekly' | 'monthly'

export interface FundingContract {
  // Existing FundingInformation fields
  id: string
  type: FundingType
  amount: number              // Now represents original contract amount
  startDate: Date
  endDate?: Date
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  
  // New contract-specific fields
  contractStatus: ContractStatus
  originalAmount: number      // Stores initial allocation
  currentBalance: number      // Calculated remaining balance
  drawdownRate: DrawdownRate  // How frequently balance reduces
  autoDrawdown: boolean       // Enable automatic drawdown
  lastDrawdownDate?: Date     // Track last balance calculation
  renewalDate?: Date          // When contract needs renewal
  parentContractId?: string   // Link to previous contract if renewed
}

export interface ContractBalanceSummary {
  totalOriginal: number
  totalCurrent: number
  totalDrawnDown: number
  activeContracts: number
  expiringSoon: number // Contracts expiring within 30 days
}
```

### Tasks (Implementation Order)
```yaml
Task 1: Extend Type System and Validation
UPDATE types/resident.ts
  - Add ContractStatus and DrawdownRate types
  - Extend FundingInformation to FundingContract interface
  - Add ContractBalanceSummary interface for dashboard display

CREATE lib/schemas/contract.ts
  - Extend fundingInformationSchema with contract fields
  - Add contractStatusTransitionSchema with validation rules
  - Add contractRenewalSchema for contract renewal workflow

Task 2: Create Balance Calculation Engine
CREATE lib/utils/funding-calculations.ts
  - calculateCurrentBalance() function with drawdown logic
  - calculateDrawdownAmount() based on elapsed time and rate
  - isContractExpiringSoon() helper for alerts
  - generateContractRenewal() for creating successor contracts

UPDATE lib/utils/resident-storage.ts
  - Add updateContractBalance() function
  - Add getContractBalanceSummary() aggregation
  - Add automatic balance updates on resident fetch
  - Maintain existing storage patterns

Task 3: Create Contract Status Management Component
CREATE components/residents/ContractStatusManager.tsx
  - Status transition buttons with validation (mirror StatusManager pattern)
  - Confirmation dialogs for status changes
  - Contract activation with balance initialization
  - Contract renewal workflow with new contract creation
  - Visual status indicators with contract timeline

Task 4: Enhance FundingManager with Contract Features
UPDATE components/residents/FundingManager.tsx
  - Add contract status display in funding cards
  - Add contract activation controls
  - Show current balance vs original amount
  - Add contract renewal UI
  - Maintain existing CRUD operations

CREATE components/residents/FundingBalanceDisplay.tsx
  - Visual balance representation (progress bars)
  - Contract timeline display
  - Drawdown rate indicators
  - Balance history charts
  - Expiry warnings

Task 5: Create Contract-Specific API Endpoints
CREATE app/api/residents/[id]/funding/contract/route.ts
  - POST: Activate contract (set status to Active, initialize balances)
  - PUT: Update contract status with validation
  - POST /renew: Create renewal contract linked to expiring contract
  - GET /balance: Return current calculated balance

UPDATE app/api/residents/[id]/funding/route.ts
  - Integrate balance calculations in all funding operations
  - Add contract status filtering
  - Include balance summary in responses

Task 6: Create Balance Calculation Background Service
CREATE lib/services/balance-updater.ts
  - Scheduled balance updates for all active contracts
  - Batch processing for multiple residents
  - Configurable update frequency
  - Integration with existing storage layer

Task 7: Update Resident Display Integration
UPDATE components/residents/GlobalResidentTable.tsx
  - Add contract balance columns
  - Show contract status indicators
  - Add contract expiry warnings
  - Include balance summaries in totals

UPDATE app/(admin)/residents/[id]/page.tsx
  - Add FundingBalanceDisplay component
  - Show ContractStatusManager
  - Display contract balance summary
  - Integrate with existing resident detail layout

Task 8: COMPREHENSIVE TESTS
Unit Tests:
  - Balance calculation accuracy across different drawdown rates
  - Contract status transition validation
  - Contract renewal workflow
  - Balance summary aggregation

Integration Tests:
  - Contract creation → activation → balance tracking workflow
  - Contract expiry → renewal → new contract creation
  - Multi-contract balance aggregation
  - Funding manager integration with contract features

E2E Tests:
  - Complete contract lifecycle from creation to renewal
  - Balance tracking over time simulation
  - Status management across multiple contracts
  - Integration with existing resident management workflow
```

### Pseudocode
```tsx
// components/residents/ContractStatusManager.tsx
function ContractStatusManager({ contract, onContractChange }) {
  const [isChanging, setIsChanging] = useState(false)
  
  const validTransitions = contractStatusTransitions[contract.contractStatus] || []
  
  const handleStatusChange = async (newStatus: ContractStatus) => {
    if (newStatus === 'Active') {
      // Initialize balance tracking
      await activateContract(contract.id)
    } else if (newStatus === 'Renewed') {
      // Create new contract linked to current
      const renewalContract = await renewContract(contract.id)
      onContractChange?.(renewalContract)
    }
    
    const updatedContract = await updateContractStatus(contract.id, newStatus)
    onContractChange?.(updatedContract)
  }
  
  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">Contract Management</h3>
      
      <div className="mb-4">
        <ContractStatusBadge status={contract.contractStatus} />
        <ContractTimelineDisplay contract={contract} />
      </div>
      
      {validTransitions.length > 0 && (
        <div className="space-y-2">
          {validTransitions.map(status => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className="w-full text-left px-3 py-2 rounded-md border hover:bg-gray-50"
            >
              {getStatusTransitionLabel(status)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// components/residents/FundingBalanceDisplay.tsx
function FundingBalanceDisplay({ contracts }) {
  const balanceSummary = calculateBalanceSummary(contracts)
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Balance Overview */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <div className="text-2xl font-bold text-blue-800">
          ${balanceSummary.totalCurrent.toLocaleString()}
        </div>
        <div className="text-sm text-blue-600">Current Balance</div>
      </div>
      
      <div className="p-4 bg-green-50 rounded-lg">
        <div className="text-2xl font-bold text-green-800">
          ${balanceSummary.totalOriginal.toLocaleString()}
        </div>
        <div className="text-sm text-green-600">Original Allocation</div>
      </div>
      
      <div className="p-4 bg-orange-50 rounded-lg">
        <div className="text-2xl font-bold text-orange-800">
          ${balanceSummary.totalDrawnDown.toLocaleString()}
        </div>
        <div className="text-sm text-orange-600">Total Drawn Down</div>
      </div>
      
      {/* Contract Details */}
      <div className="md:col-span-3 space-y-4">
        {contracts.filter(c => c.contractStatus === 'Active').map(contract => (
          <ContractBalanceCard 
            key={contract.id}
            contract={contract}
            showProgressBar
            showTimelineIndicator
          />
        ))}
      </div>
    </div>
  )
}

// lib/utils/funding-calculations.ts
export function calculateCurrentBalance(contract: FundingContract): number {
  if (contract.contractStatus !== 'Active' || !contract.autoDrawdown) {
    return contract.originalAmount
  }
  
  const now = new Date()
  const elapsed = getElapsedPeriods(contract.startDate, now, contract.drawdownRate)
  const totalPeriods = getElapsedPeriods(contract.startDate, contract.endDate || now, contract.drawdownRate)
  
  if (totalPeriods === 0) return contract.originalAmount
  
  const drawdownPercentage = Math.min(1, elapsed / totalPeriods)
  const drawnDown = contract.originalAmount * drawdownPercentage
  
  return Math.max(0, contract.originalAmount - drawnDown)
}
```

### Integration Points
```yaml
EXISTING_COMPONENTS:
  - FundingManager: Extend with contract management features
  - StatusManager: Mirror pattern for contract status transitions
  - GlobalResidentTable: Add balance columns and contract indicators
  - AuditTrail: Track all contract status changes and balance updates

API_ENDPOINTS:
  - GET /api/residents/[id]/funding: Include calculated balances
  - POST /api/residents/[id]/funding/contract/activate: Activate contract
  - PUT /api/residents/[id]/funding/contract/status: Update contract status
  - POST /api/residents/[id]/funding/contract/renew: Create renewal contract

DATABASE_STORAGE:
  - Extend existing localStorage pattern with balance calculations
  - Maintain audit trails for all contract changes
  - Store balance update timestamps for performance

BUSINESS_LOGIC:
  - Contract activation initializes balance tracking
  - Automatic balance calculations on resident fetch
  - Contract expiry notifications and renewal workflow
  - Integration with existing resident status management
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
// lib/utils/funding-calculations.test.ts
test("calculateCurrentBalance reduces linearly over time", () => {
  const contract = {
    originalAmount: 12000,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    drawdownRate: 'monthly' as const,
    contractStatus: 'Active' as const,
    autoDrawdown: true
  }
  
  // Mock current date to 6 months in
  vi.setSystemTime(new Date('2024-07-01'))
  
  const balance = calculateCurrentBalance(contract)
  expect(balance).toBe(6000) // 50% drawn down after 6 months
})

// components/residents/ContractStatusManager.test.tsx
test("shows valid contract status transitions only", () => {
  const draftContract = { contractStatus: 'Draft', ...otherFields }
  render(<ContractStatusManager contract={draftContract} onContractChange={vi.fn()} />)
  
  expect(screen.getByText('Activate Contract')).toBeInTheDocument()
  expect(screen.getByText('Cancel Contract')).toBeInTheDocument()
  expect(screen.queryByText('Renew Contract')).not.toBeInTheDocument()
})

// components/residents/FundingBalanceDisplay.test.tsx
test("displays correct balance summary calculations", () => {
  const contracts = [
    { originalAmount: 10000, currentBalance: 8000, contractStatus: 'Active' },
    { originalAmount: 5000, currentBalance: 2000, contractStatus: 'Active' }
  ]
  
  render(<FundingBalanceDisplay contracts={contracts} />)
  
  expect(screen.getByText('$15,000')).toBeInTheDocument() // Total original
  expect(screen.getByText('$10,000')).toBeInTheDocument() // Total current
  expect(screen.getByText('$5,000')).toBeInTheDocument()  // Total drawn down
})
```

```bash
pnpm run test
```

### Level 3: Integration Test (Playwright)
```typescript
// e2e/funding-contracts.spec.ts
test("admin can create and activate funding contract", async ({ page }) => {
  // Navigate to resident detail page
  await page.goto("/residents/R001")
  
  // Add new funding with contract features
  await page.click("text=Add Funding")
  await page.selectOption('select[name="type"]', 'NDIS')
  await page.fill('input[name="amount"]', '15000')
  await page.fill('input[name="startDate"]', '2024-01-01')
  await page.fill('input[name="endDate"]', '2024-12-31')
  await page.selectOption('select[name="drawdownRate"]', 'monthly')
  
  await page.click('button[type="submit"]')
  
  // Contract should be created in Draft status
  await expect(page.locator('text=Draft')).toBeVisible()
  await expect(page.locator('text=$15,000')).toBeVisible()
  
  // Activate contract
  await page.click('text=Activate Contract')
  await page.click('button:has-text("Activate")')
  
  // Should show Active status and balance tracking
  await expect(page.locator('text=Active')).toBeVisible()
  await expect(page.locator('text=Current Balance')).toBeVisible()
})

test("contract balance reduces over time simulation", async ({ page }) => {
  // Navigate to active contract
  await page.goto("/residents/R001")
  
  // Should show current balance
  const initialBalance = await page.locator('[data-testid="current-balance"]').textContent()
  
  // Simulate time passage (this would be server-side in real implementation)
  await page.click('[data-testid="simulate-time-passage"]')
  
  // Balance should have reduced
  const newBalance = await page.locator('[data-testid="current-balance"]').textContent()
  expect(newBalance).not.toBe(initialBalance)
})
```

## Final Validation Checklist
- [ ] Funding contracts can be created with all required fields
- [ ] Contract status transitions work with proper validation
- [ ] Balance calculations are accurate across different drawdown rates
- [ ] Contract activation initializes balance tracking correctly
- [ ] Contract renewal creates linked successor contracts
- [ ] Balance display shows current vs original amounts
- [ ] Integration with existing FundingManager maintains all CRUD operations
- [ ] Audit trails capture all contract status changes
- [ ] All tests pass (`pnpm run test` and `pnpm run e2e:headless`)
- [ ] Lint/typecheck clean (`pnpm run lint && pnpm run typecheck`)
- [ ] Contract expiry warnings display appropriately
- [ ] Balance summary calculations aggregate correctly

## Anti-Patterns to Avoid
❌ Don't calculate balances client-side → always use server-calculated values for consistency
❌ Don't bypass contract status validation → enforce proper transition rules
❌ Don't store balance as static field → calculate dynamically based on time elapsed
❌ Don't allow contract modification when Active → require status change first
❌ Don't forget audit logging → track all contract changes and balance updates
❌ Don't hardcode drawdown rates → make configurable per contract
❌ Don't skip timezone handling → use consistent date calculations
❌ Don't replace existing funding → extend FundingInformation interface

## Confidence Score: 9/10

This PRP provides comprehensive context for one-pass implementation success:
- ✅ Detailed analysis of existing funding infrastructure (FundingManager, API, storage)
- ✅ Complete NDIS industry context with 2025 regulatory requirements
- ✅ Thorough technical specification extending current types and schemas
- ✅ Step-by-step implementation blueprint building on proven patterns
- ✅ Comprehensive validation strategy with executable unit and E2E tests
- ✅ Clear integration points with existing resident management system
- ✅ Proper contract lifecycle and balance calculation workflow design
- ✅ Professional UI components following established design patterns

The high confidence (9/10) reflects the solid foundation of existing funding infrastructure and the clear business requirements. The implementation extends proven patterns rather than creating new architecture, reducing risk while delivering essential NDIS funding management capabilities.