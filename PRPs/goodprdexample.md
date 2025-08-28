name: "Feature PRP Example - Invoice UI (List + Create Form)"
description: |

## Purpose
Add a simple Invoice management UI to the dashboard. Users should be able to view a list of invoices and create a new invoice via a modal form. This feature will introduce a consistent UI pattern for CRUD-style entities and set the foundation for future billing/finance features.

## Core Principles
1. **Context is King**: Reference existing UI patterns (tables, forms, modals) in the codebase.
2. **Validation Loops**: Ship with unit tests (form validation) + Playwright integration test (create invoice flow).
3. **Information Dense**: Use shadcn/ui, Tailwind, and React Query patterns already in the project.
4. **Progressive Success**: Start with static UI → wire API → validate end-to-end.
5. **Global rules**: Follow CLAUDE.md and existing frontend conventions.

---

## Goal
Users can:
- Navigate to `/invoices`
- See a table of invoices (id, customer, amount, status, due date)
- Click “New Invoice” → modal form
- Submit → new invoice appears in list (optimistic update)

---

## Why
- **Business value**: Tangible step toward full billing system.
- **User impact**: Gives finance/admin users visibility into invoices.
- **Technical**: Provides a reusable “CRUD page pattern” for future entities.

---

## What
- **Invoices Page** at `/invoices`
- **InvoiceTable** component (shadcn Table, paginated, sortable)
- **InvoiceFormModal** (shadcn Dialog, React Hook Form, zod validation)
- **API integration** with `/api/invoices` (fetch + create)

### Success Criteria
- [ ] Invoices render in a responsive table
- [ ] Modal opens/closes correctly
- [ ] Form validates (required fields, numeric amount, valid date)
- [ ] Successful create adds invoice to list
- [ ] All tests pass (unit + integration)

---

## All Needed Context

### Documentation & References
```yaml
- file: src/components/ui/Table.tsx
  why: Follow table styling + pagination pattern

- file: src/components/ui/Modal.tsx
  why: Follow modal/dialog pattern

- doc: https://react-hook-form.com/get-started
  section: ZodResolver integration
  critical: Prevents invalid invoice submissions

- doc: https://tanstack.com/query/latest
  section: useMutation + invalidation
  why: Handle optimistic updates for invoice creation
Current Codebase tree
bash
Copy
Edit
src/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── layout.tsx
├── components/ui/...
├── lib/api.ts
└── tests/
Desired Codebase tree
bash
Copy
Edit
src/
├── app/invoices/page.tsx          # Invoices route
├── components/invoices/
│   ├── InvoiceTable.tsx           # Table UI
│   ├── InvoiceFormModal.tsx       # Modal + form
│   └── InvoiceRow.tsx             # Row rendering
├── lib/api/invoices.ts            # API client wrappers
└── tests/
    ├── invoices.test.tsx          # Unit + integration tests
Known Gotchas & Library Quirks


# CRITICAL: We use Next.js App Router → must use server actions or /api routes
# CRITICAL: React Query requires query keys to match for cache invalidation
# CRITICAL: Zod + RHF integration required for strong validation
# CRITICAL: Shadcn Dialog requires Portal wrapper for modals to render correctly
# CRITICAL: Dates must be stored ISO-8601, not locale strings
Implementation Blueprint
Data models
typescript
Copy
Edit
// lib/types.ts
export type Invoice = {
  id: string
  customer: string
  amount: number
  status: "draft" | "sent" | "paid"
  dueDate: string // ISO-8601
}
Tasks
yaml
Copy
Edit
Task 1:
CREATE src/lib/api/invoices.ts
  - export async function listInvoices(): Promise<Invoice[]>
  - export async function createInvoice(payload: InvoiceInput): Promise<Invoice>

Task 2:
CREATE src/components/invoices/InvoiceTable.tsx
  - Use shadcn/ui Table
  - Display invoices with sorting/pagination
  - Accept prop: invoices[]

Task 3:
CREATE src/components/invoices/InvoiceFormModal.tsx
  - Use shadcn Dialog
  - React Hook Form + zod schema for validation
  - onSubmit → calls createInvoice mutation

Task 4:
CREATE src/app/invoices/page.tsx
  - Fetch invoices via listInvoices()
  - Render InvoiceTable + “New Invoice” button → InvoiceFormModal

Task 5:
TESTS
  - Unit test InvoiceFormModal validation
  - Integration test: open modal → fill form → submit → invoice appears
Pseudocode
tsx
Copy
Edit
// InvoiceFormModal pseudocode
const schema = z.object({
  customer: z.string().min(1),
  amount: z.number().positive(),
  dueDate: z.string().datetime(),
})

function InvoiceFormModal({ onClose }) {
  const { register, handleSubmit } = useForm({ resolver: zodResolver(schema) })
  const mutation = useMutation(createInvoice, {
    onSuccess: () => queryClient.invalidateQueries(["invoices"]),
  })

  return (
    <Dialog>
      <DialogContent>
        <form onSubmit={handleSubmit(mutation.mutate)}>
          <Input {...register("customer")} />
          <Input type="number" {...register("amount")} />
          <Input type="date" {...register("dueDate")} />
          <Button type="submit">Create</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
Integration Points
yaml
Copy
Edit
CONFIG:
  - Add INVOICE_PAGE_SIZE to config/settings.ts

ROUTES:
  - Next.js App Router at src/app/invoices/page.tsx

API:
  - Implement /api/invoices (mocked backend first)
Validation Loop
Level 1: Syntax & Style
bash
Copy
Edit
npm run lint
npm run typecheck
Level 2: Unit Tests
tsx
Copy
Edit
test("InvoiceFormModal validates fields", () => {
  render(<InvoiceFormModal />)
  userEvent.click(screen.getByText("Create"))
  expect(screen.getByText("Customer is required")).toBeInTheDocument()
})
bash
Copy
Edit
npm run test
Level 3: Integration Test (Playwright)
ts
Copy
Edit
test("user can create invoice", async ({ page }) => {
  await page.goto("/invoices")
  await page.click("text=New Invoice")
  await page.fill('input[name="customer"]', "ACME Inc")
  await page.fill('input[name="amount"]', "500")
  await page.fill('input[name="dueDate"]', "2025-09-01")
  await page.click("text=Create")
  await expect(page.locator("table")).toContainText("ACME Inc")
})
Final Validation Checklist
 Table renders with mock invoices

 Modal opens, validates, closes

 Form submission adds invoice

 All tests pass (npm run test)

 Lint/typecheck clean

 Docs updated (README section: Invoices)

Anti-Patterns to Avoid
❌ Don’t fetch data client-side without React Query (avoid flicker)

❌ Don’t bypass zod → always validate user input

❌ Don’t store dates as locale strings (must be ISO)

❌ Don’t duplicate table/form logic—reuse shadcn/ui patterns