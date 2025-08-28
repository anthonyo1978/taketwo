name: "Simple Login Page - Email/Password Authentication"
description: |

## Purpose
Implement a simple, accessible login page with email/password authentication, form validation, error handling, and redirect capabilities. This feature establishes the foundation for user authentication in the application and can be extended with real auth providers in the future. Uses Salesforce login as design inspiration.

## Core Principles
1. **Context is King**: Follow existing Button component patterns and CVA styling approach
2. **Validation Loops**: Ship with unit tests (form validation) + Playwright integration test (login flow)
3. **Information Dense**: Use Tailwind v4, Radix UI, and established component patterns
4. **Progressive Success**: Start with static UI → add validation → wire mock API → validate end-to-end
5. **Global rules**: Follow claude.md conventions and accessibility standards

---

## Goal
Users can:
- Navigate to `/login`
- See a clean, accessible login form with email/password fields
- Get client-side validation feedback on form errors
- Submit credentials → API call → success redirect or error display
- Experience proper loading states and error handling
- Navigate with keyboard and screen readers

---

## Why
- **Business value**: Essential gateway for user authentication and security
- **User impact**: Professional, accessible login experience matching enterprise expectations
- **Technical**: Establishes authentication patterns and form handling conventions for future features

---

## What
- **Login Page** at `/login` route
- **LoginForm** component with email/password fields, validation, and submit handling
- **Input** component variants for form fields with proper labeling
- **Mock API** endpoint for authentication simulation
- **Error handling** for invalid credentials and network failures
- **Loading states** during authentication attempts
- **Accessibility** features (ARIA labels, keyboard navigation, screen reader support)

### Success Criteria
- [ ] Login page renders with proper form layout and styling
- [ ] Email validation (format, required field)
- [ ] Password validation (minimum length, required field)
- [ ] Form submits to mock API with loading state
- [ ] Success case redirects to dashboard/home
- [ ] Error case displays meaningful error messages
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces form states and errors
- [ ] All tests pass (unit + integration)

---

## All Needed Context

### Documentation & References
```yaml
- file: components/Button/Button.tsx
  why: Follow CVA patterns and styling approach for consistent button implementation

- file: app/layout.tsx
  why: Understand root layout structure for proper page integration

- file: styles/tailwind.css
  why: Reference existing Tailwind configuration and design tokens

- doc: https://www.radix-ui.com/primitives/docs/components/form
  section: Form primitives and validation
  critical: Provides accessible form structure and ARIA compliance

- doc: https://react-hook-form.com/get-started
  section: useForm hook and validation integration
  why: Modern form handling with minimal re-renders

- doc: https://zod.dev/
  section: Schema validation
  critical: Type-safe form validation matching project patterns

- design: https://login.salesforce.com/
  why: Design inspiration for clean, professional login interface
```

### Current Codebase Tree
```
app/
├── api/health/route.ts           # Existing API route pattern
├── layout.tsx                    # Root layout
├── page.tsx                      # Home page
components/
├── Button/
│   ├── Button.tsx               # CVA pattern reference
│   ├── Button.test.tsx          # Testing pattern reference
│   └── Button.stories.tsx       # Storybook pattern
├── Tooltip/Tooltip.tsx          # Component structure reference
styles/tailwind.css              # Design system
```

### Desired Codebase Tree
```
app/
├── api/
│   └── auth/
│       └── login/route.ts       # Mock login API endpoint
├── login/
│   └── page.tsx                 # Login page route
components/
├── login/
│   ├── LoginForm.tsx            # Main login form component
│   ├── LoginForm.test.tsx       # Unit tests
│   └── LoginForm.stories.tsx    # Storybook stories
├── ui/
│   ├── Input.tsx                # Reusable input component
│   ├── Input.test.tsx           # Input component tests
│   └── Input.stories.tsx        # Input component stories
```

### Known Gotchas & Library Quirks
```typescript
# CRITICAL: Next.js 15 App Router → use server actions or /api routes for auth
# CRITICAL: Form validation must happen both client-side (UX) and server-side (security)
# CRITICAL: Radix UI Form components require proper ARIA labeling for accessibility
# CRITICAL: Password fields need proper autocomplete attributes for browser integration
# CRITICAL: Loading states must prevent double-submission
# CRITICAL: Error messages should not reveal whether email exists (security)
```

## Implementation Blueprint

### Data Models
```typescript
// lib/types/auth.ts
export type LoginCredentials = {
  email: string
  password: string
}

export type LoginResponse = {
  success: boolean
  error?: string
  user?: {
    id: string
    email: string
    name: string
  }
}

export type FormErrors = {
  email?: string
  password?: string
  general?: string
}
```

### Tasks
```yaml
Task 1: CREATE components/ui/Input.tsx
  - CVA-based input component with variants (default, error states)
  - Proper TypeScript props interface
  - Forward ref for React Hook Form integration
  - ARIA labeling and accessibility features

Task 2: CREATE app/api/auth/login/route.ts
  - Mock POST endpoint accepting LoginCredentials
  - Basic email/password validation
  - Return appropriate success/error responses
  - Simulate network delay for realistic testing

Task 3: CREATE components/login/LoginForm.tsx
  - React Hook Form integration with Zod schema
  - Email and password validation rules
  - Loading states and error display
  - Proper form submission handling
  - Accessibility features (ARIA, keyboard nav)

Task 4: CREATE app/login/page.tsx
  - Clean page layout following app router conventions
  - Center login form with proper spacing
  - Page metadata and SEO considerations
  - Responsive design for mobile/desktop

Task 5: TESTS
  - Unit test Input component variants and accessibility
  - Unit test LoginForm validation logic and error states
  - Integration test: complete login flow with mock API
  - Playwright test: keyboard navigation and screen reader compatibility
```

### Pseudocode
```tsx
// LoginForm pseudocode
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

function LoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema)
  })
  const [loginError, setLoginError] = useState<string>("")
  
  const onSubmit = async (data: LoginCredentials) => {
    setLoginError("")
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      if (response.ok) {
        // Redirect to dashboard
        window.location.href = "/"
      } else {
        const { error } = await response.json()
        setLoginError(error || "Login failed. Please try again.")
      }
    } catch (error) {
      setLoginError("Network error. Please check your connection.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        {...register("email")}
        type="email"
        label="Email"
        error={errors.email?.message}
        autoComplete="username"
        required
      />
      <Input
        {...register("password")}
        type="password"
        label="Password"
        error={errors.password?.message}
        autoComplete="current-password"
        required
      />
      {loginError && (
        <div role="alert" className="text-red-600 text-sm">
          {loginError}
        </div>
      )}
      <Button
        type="submit"
        intent="primary"
        size="lg"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  )
}
```

### Integration Points
```yaml
ROUTES:
  - Next.js App Router at app/login/page.tsx
  - API route at app/api/auth/login/route.ts

STYLING:
  - Follow existing CVA patterns from Button component
  - Use Tailwind v4 design tokens
  - Maintain consistent spacing and typography

ACCESSIBILITY:
  - ARIA labels and descriptions
  - Proper focus management
  - Screen reader announcements
  - Keyboard navigation support
```

## Validation Loop

### Level 1: Syntax & Style
```bash
pnpm run lint
pnpm run build  # TypeScript compilation check
pnpm run prettier
```

### Level 2: Unit Tests
```tsx
// LoginForm.test.tsx examples
test("displays validation errors for empty fields", async () => {
  render(<LoginForm />)
  
  const submitButton = screen.getByRole("button", { name: /sign in/i })
  fireEvent.click(submitButton)
  
  expect(await screen.findByText("Please enter a valid email address")).toBeInTheDocument()
  expect(await screen.findByText("Password must be at least 8 characters")).toBeInTheDocument()
})

test("submits form with valid credentials", async () => {
  // Mock fetch
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
  )
  
  render(<LoginForm />)
  
  await userEvent.type(screen.getByLabelText(/email/i), "test@example.com")
  await userEvent.type(screen.getByLabelText(/password/i), "password123")
  await userEvent.click(screen.getByRole("button", { name: /sign in/i }))
  
  expect(global.fetch).toHaveBeenCalledWith("/api/auth/login", expect.any(Object))
})

test("displays error message for invalid credentials", async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: "Invalid credentials" }),
    })
  )
  
  render(<LoginForm />)
  
  await userEvent.type(screen.getByLabelText(/email/i), "wrong@example.com")
  await userEvent.type(screen.getByLabelText(/password/i), "wrongpass")
  await userEvent.click(screen.getByRole("button", { name: /sign in/i }))
  
  expect(await screen.findByText("Invalid credentials")).toBeInTheDocument()
})
```

```bash
pnpm run test
```

### Level 3: Integration Test (Playwright)
```typescript
// e2e/login.spec.ts
test("user can login with valid credentials", async ({ page }) => {
  await page.goto("/login")
  
  // Check page loads correctly
  await expect(page.locator("h1")).toContainText("Sign in")
  
  // Fill form
  await page.fill('input[name="email"]', "test@example.com")
  await page.fill('input[name="password"]', "validpassword")
  
  // Submit and check redirect
  await page.click('button[type="submit"]')
  await page.waitForURL("/")
  
  expect(page.url()).toContain("/")
})

test("displays error for invalid credentials", async ({ page }) => {
  await page.goto("/login")
  
  await page.fill('input[name="email"]', "wrong@example.com")
  await page.fill('input[name="password"]', "wrongpass")
  await page.click('button[type="submit"]')
  
  await expect(page.locator('[role="alert"]')).toContainText("Invalid credentials")
})

test("keyboard navigation works correctly", async ({ page }) => {
  await page.goto("/login")
  
  // Tab through form elements
  await page.keyboard.press("Tab")
  await expect(page.locator('input[name="email"]')).toBeFocused()
  
  await page.keyboard.press("Tab")
  await expect(page.locator('input[name="password"]')).toBeFocused()
  
  await page.keyboard.press("Tab")
  await expect(page.locator('button[type="submit"]')).toBeFocused()
})
```

## Final Validation Checklist
- [ ] Login page renders with clean, professional design
- [ ] Form validation works for email and password fields
- [ ] Loading state displays during submission
- [ ] Success case redirects appropriately
- [ ] Error messages display clearly without revealing sensitive info
- [ ] Keyboard navigation flows properly through all elements
- [ ] Screen reader can announce form states and errors
- [ ] All tests pass (pnpm run test)
- [ ] Lint and TypeScript checks pass
- [ ] Storybook stories document component variants
- [ ] Mobile responsiveness works on common screen sizes

## Anti-Patterns to Avoid
❌ Don't store passwords in component state longer than necessary

❌ Don't reveal whether email exists in error messages (security risk)

❌ Don't skip ARIA labeling—accessibility is non-negotiable

❌ Don't allow form submission without proper validation

❌ Don't hardcode styles—use CVA patterns and Tailwind tokens

❌ Don't forget loading states—users need feedback during async operations

❌ Don't bypass TypeScript—maintain strict type safety throughout

---

## Confidence Score: 9/10

This PRP provides comprehensive context for one-pass implementation success. It references existing patterns, includes detailed validation loops, addresses accessibility requirements, and follows established project conventions. The only uncertainty is around specific Radix UI form components that may need discovery during implementation.