# PRD: Transactions System for NDIS Provider Management

## Overview

The Transactions system provides a comprehensive billing and contract drawdown management solution for NDIS accommodation providers. It serves as the central source of truth for all billable events, automatically reducing contract balances and providing operational visibility for reconciliation and payment claims.

## Problem Statement

NDIS providers need to:
- Track billable events against resident contracts with precision
- Automatically drawdown contract balances as services are provided
- Maintain audit trails for government compliance and claim processing
- Provide operational dashboards showing house → resident → contract → transaction visibility
- Enable bulk processing of transactions for efficiency
- Export data for external claim systems

## Solution

A dense, high-performance transactions table with inline balance calculations, comprehensive filtering, bulk operations, and deep integration with the existing resident/contract system.

## Key Features

### 1. Transaction Management Table
- **Route**: `/admin/transactions`
- **Design Pattern**: Based on shadcnexamples.com/tasks for high-density UX
- **Technology**: TanStack Table + shadcn/ui components
- **Pagination**: 25 records per page (configurable)

### 2. Comprehensive Filtering & Search
- **Header Controls**: Date range, client, contract, house, status filters
- **Quick Search**: Service codes and transaction notes
- **Column Filters**: Individual column quick filters
- **Sorting**: Date (desc default), amount, client, status

### 3. Transaction States & Lifecycle
- **Draft**: Created but not posted to contract balance
- **Posted**: Applied to contract balance, deducting available funds
- **Voided**: Reversed transaction, restores balance
- **Validation**: Prevents negative balances, shows remaining after post

### 4. Bulk Operations
- **Bulk Post**: Convert multiple draft transactions to posted
- **Bulk Void**: Reverse multiple posted transactions (with constraints)
- **CSV Export**: Export selected or filtered transactions
- **Bulk Select**: Checkbox-based row selection

### 5. Contract Integration
- **Balance Updates**: Automatic contract balance reduction on post
- **Balance Restoration**: Automatic balance restoration on void
- **Real-time Validation**: Show remaining balance preview before posting
- **Active Contract Filtering**: Only show active contracts for new transactions

### 6. Resident Page Integration
- **Balance Widget**: Show active contracts with remaining balances
- **Recent Transactions**: Last 5 transactions with link to full view
- **Quick Actions**: Direct link to create transaction for resident

## Technical Specifications

### Data Model

```typescript
interface Transaction {
  id: string
  residentId: string
  contractId: string
  occurredAt: Date
  serviceCode: string
  description?: string
  quantity: number
  unitPrice: number
  amount: number // quantity * unitPrice (can be overridden)
  status: 'draft' | 'posted' | 'voided'
  note?: string
  createdAt: Date
  createdBy: string
  postedAt?: Date
  postedBy?: string
  voidedAt?: Date
  voidedBy?: string
  voidReason?: string
}

interface TransactionCreateInput {
  residentId: string
  contractId: string
  occurredAt: Date
  serviceCode: string
  description?: string
  quantity: number
  unitPrice: number
  amount?: number // Optional override
  note?: string
}

interface TransactionFilters {
  dateRange?: { from: Date; to: Date }
  residentIds?: string[]
  contractIds?: string[]
  houseIds?: string[]
  statuses?: TransactionStatus[]
  serviceCode?: string
  search?: string
}
```

### API Endpoints

- `GET /api/transactions` - List with filtering, sorting, pagination
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/[id]` - Update transaction
- `POST /api/transactions/bulk-post` - Bulk post drafts
- `POST /api/transactions/bulk-void` - Bulk void posted
- `DELETE /api/transactions/[id]` - Delete draft transaction
- `GET /api/transactions/export` - CSV export

### Storage Layer

Following existing localStorage pattern:
- `lib/utils/transaction-storage.ts`
- Extends current storage abstraction
- Maintains contract balance consistency
- Atomic operations for balance updates

## User Experience Flow

### Primary Workflow
1. **View Transactions**: Dense table with all filtering options
2. **Create Transaction**: Sheet/dialog with resident→contract selection
3. **Bulk Operations**: Select multiple rows, apply actions
4. **Balance Monitoring**: Real-time balance updates and validation
5. **Export**: CSV download for external processing

### Resident Integration
1. **Balance Widget**: Quick view of contract balances from resident page
2. **Recent Activity**: Last 5 transactions with links
3. **Quick Create**: Direct transaction creation from resident context

## Success Criteria

### Functional
- ✅ Create draft transactions with validation
- ✅ Post transactions with automatic balance deduction
- ✅ Void transactions with balance restoration
- ✅ Bulk operations work correctly with constraints
- ✅ Filtering and sorting perform smoothly
- ✅ CSV export produces correct data
- ✅ Balance calculations are accurate
- ✅ Integration with resident pages works seamlessly

### Performance
- ✅ Table loads within 500ms for 1000+ records
- ✅ Filtering responds within 100ms
- ✅ Bulk operations process within 2s for 50+ items
- ✅ Export completes within 5s for filtered results

### UX
- ✅ Dense table layout maximizes screen real estate
- ✅ Keyboard navigation works throughout
- ✅ Mobile responsive design
- ✅ Clear visual feedback for all operations
- ✅ Error states are informative and actionable

## Implementation Priority

### Phase 1 (Core Foundation)
1. Transaction type definitions and validation schemas
2. Storage utilities with balance calculation logic
3. Basic API routes (CRUD operations)
4. Simple transactions table with mock data

### Phase 2 (Table Enhancement)
1. TanStack Table implementation with full feature set
2. Filtering and sorting implementation
3. Transaction creation dialog
4. Status transitions (draft→posted→voided)

### Phase 3 (Integration & Polish)
1. Resident page balance widgets
2. Bulk operations and CSV export
3. Advanced filtering and search
4. Comprehensive testing suite

### Phase 4 (Future Enhancements)
1. Automated transaction generation
2. Claims export formatting
3. Multi-tenant scoping
4. Advanced reporting dashboards

## Risks & Mitigation

### Risk: Balance Calculation Accuracy
**Mitigation**: Atomic operations, comprehensive unit tests, balance validation on every operation

### Risk: Performance with Large Datasets
**Mitigation**: Pagination, lazy loading, optimized filtering, eventual database migration path

### Risk: Complex State Management
**Mitigation**: Clear state machine for transaction statuses, comprehensive error handling

### Risk: Integration Complexity
**Mitigation**: Leveraging existing patterns, incremental development, thorough testing

## Dependencies

- Existing resident and contract system
- TanStack Table for advanced table functionality
- shadcn/ui components for consistent design
- Current localStorage storage abstraction
- date-fns for date handling and formatting

## Testing Strategy

### Unit Tests
- Transaction model validation
- Balance calculation logic
- State transition rules
- Amount calculations and overrides

### Integration Tests
- API route handlers
- Storage layer operations
- Contract balance updates
- Bulk operation atomicity

### E2E Tests
- Complete transaction lifecycle
- Filtering and sorting accuracy
- CSV export functionality
- Resident page integration

This PRD provides the foundation for a comprehensive transaction management system that integrates seamlessly with the existing NDIS provider management application while providing the high-performance, dense UX required for operational efficiency.