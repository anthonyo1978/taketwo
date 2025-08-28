# Project Architecture & Planning

## Project Overview

**Next.js Enterprise Boilerplate** - A production-ready template for building enterprise applications with modern tooling and best practices.

## Tech Stack

### Core Framework
- **Next.js 15** with App Router
- **React 19** for UI components
- **TypeScript** with strict configuration
- **Tailwind CSS v4** for styling

### Component Architecture
- **Radix UI** for accessible headless components
- **CVA (Class Variance Authority)** for design system consistency
- **Co-located testing** (Component.tsx + Component.test.tsx + Component.stories.tsx)
- **Absolute imports** for clean import paths

### Testing Strategy
- **Vitest** for unit testing
- **React Testing Library** for component testing
- **Playwright** for end-to-end testing
- **Storybook** for component development and visual testing

### Development Tools
- **ESLint 9** + **Prettier** for code quality
- **TypeScript strict mode** with ts-reset
- **Bundle analyzer** for performance monitoring
- **Conventional commits** for consistent git history

## File Structure Conventions

```
app/                    # Next.js App Router pages
├── api/               # API routes
├── layout.tsx         # Root layout
└── page.tsx          # Page components

components/            # Reusable UI components
├── ComponentName/
│   ├── ComponentName.tsx
│   ├── ComponentName.test.tsx
│   └── ComponentName.stories.tsx

styles/               # Global styles
├── tailwind.css     # Tailwind imports

e2e/                 # End-to-end tests
```

## Naming Conventions

- **Components**: PascalCase (e.g., `Button`, `UserProfile`)
- **Files**: Match component name (e.g., `Button.tsx`, `Button.test.tsx`)
- **Props interfaces**: ComponentNameProps (e.g., `ButtonProps`)
- **Variants**: Use CVA for consistent styling variants

## Architecture Patterns

### Component Design
- Use Radix UI primitives for accessibility
- Implement CVA for variant-based styling
- Co-locate tests and stories with components
- Export both component and props interface

### State Management
- React state for local component state
- Context for shared state when needed
- No global state library included (add as needed)

### Styling Approach
- Tailwind utility classes for styling
- CVA for component variants
- `twMerge` for conditional class merging
- Design tokens through Tailwind config

## Development Workflow

1. **Feature Development**
   - Check TASK.md before starting
   - Create component with tests and stories
   - Use Storybook for component development
   - Run tests locally before committing

2. **Code Quality**
   - ESLint + Prettier for formatting
   - TypeScript strict mode enforcement
   - Bundle size monitoring
   - Conventional commit messages

3. **Testing Strategy**
   - Unit tests for component logic
   - Integration tests for user flows
   - E2E tests for critical paths
   - Visual regression with Storybook

## Current Feature Development

### Authentication System
- **Simple Login Page** (In Progress)
  - Email/password authentication with validation
  - Accessible form design following Salesforce login inspiration
  - Mock API integration with proper error handling
  - Foundation for future auth provider integration
  - See: `PRPs/simple-login-page.md` for detailed implementation plan

## Performance Guidelines

- Monitor bundle size with analyzer
- Use Next.js Image component for images
- Implement proper loading states
- Follow React performance best practices

## Deployment

- **Vercel** (recommended, one-click deploy)
- **AWS** with provided Terraform templates
- Health check endpoint: `/api/health`
- OpenTelemetry observability integration