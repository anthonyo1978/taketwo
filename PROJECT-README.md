# Project Overview

## About This Project

This is a production-ready Next.js application built on the [next-enterprise boilerplate](https://github.com/Blazity/next-enterprise). It provides a solid foundation with modern tooling, enterprise-grade features, and a comprehensive development workflow.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Run tests
pnpm run test

# Build for production
pnpm run build
```

## Project Structure

```
├── app/                    # Next.js App Router pages & API routes
├── components/             # Reusable UI components (co-located with tests/stories)
├── styles/                 # Global styles and Tailwind imports
├── e2e/                   # End-to-end tests (Playwright)
├── PRPs/                  # Project Requirements Packages
├── claude.md              # Claude Code configuration & guidelines
├── PLANNING.md            # Project architecture & development guidelines
├── TASK.md               # Task tracking and project management
├── requirements.md        # Feature requirements template
└── generate-prp.md       # PRP generation workflow
```

## Documentation System

### 📋 Development Workflow
- **[claude.md](./claude.md)** - AI assistant configuration, scripts, and coding guidelines
- **[PLANNING.md](./PLANNING.md)** - Project architecture, conventions, and technical decisions
- **[TASK.md](./TASK.md)** - Task tracking system for project management

### 🎯 Feature Development
- **[requirements.md](./requirements.md)** - Template for defining feature requirements
- **[generate-prp.md](./generate-prp.md)** - Comprehensive PRP generation workflow
- **[PRPs/](./PRPs/)** - Project Requirements Packages for feature implementation

## Development Guidelines

### Before Starting Work
1. Read **PLANNING.md** to understand project architecture and conventions
2. Check **TASK.md** for existing tasks or add new ones
3. Follow patterns established in **claude.md** for consistent development

### Feature Development Process
1. Define requirements using **requirements.md** template
2. Generate comprehensive PRP using **generate-prp.md** workflow
3. Implement following established patterns and testing requirements
4. Update task tracking in **TASK.md**

## Tech Stack

### Core Framework
- **Next.js 15** with App Router
- **React 19** for UI components  
- **TypeScript** with strict configuration
- **Tailwind CSS v4** for styling

### Development Tools
- **Vitest** + **React Testing Library** for unit testing
- **Playwright** for end-to-end testing
- **Storybook** for component development
- **ESLint 9** + **Prettier** for code quality

### Key Features
- **Radix UI** components for accessibility
- **CVA** for consistent design system
- **Bundle analyzer** for performance monitoring
- **OpenTelemetry** for observability
- **Health checks** for production monitoring

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start development server with Turbo |
| `pnpm run build` | Build for production |
| `pnpm run start` | Start production server |
| `pnpm run test` | Run unit tests |
| `pnpm run test:watch` | Run tests in watch mode |
| `pnpm run e2e:headless` | Run E2E tests |
| `pnpm run lint` | Check code quality |
| `pnpm run lint:fix` | Fix linting issues |
| `pnpm run storybook` | Start component development |
| `pnpm run analyze` | Analyze bundle size |

## Common Problems, le growing list

 - It is quite common that I accidentally run many terminsal and as such ports become used, please bare this in mind and feel free to kill terminals or ask me if thats ok. Sometimes this could be the answer.
  - I need to perhaps better share some UI examples of things that I am looking for, so please alloe me to do this, or dont be afraid to ask
   - a lot of issues that i have are end to end simple integration problems, i will add a next context to each requirement called # 1 test case, that clearly calls out the MVP assertion! 

### Testing Strategy
- **Unit Tests**: Co-located with components (`Component.test.tsx`)
- **Integration Tests**: User flow testing with React Testing Library
- **E2E Tests**: Critical path validation with Playwright
- **Visual Tests**: Component documentation with Storybook

### Code Quality
- TypeScript strict mode for type safety
- ESLint + Prettier for consistent formatting
- Conventional commits for clean git history
- Bundle size monitoring for performance

## Deployment

### Quick Deploy
- **Vercel**: One-click deployment (recommended)
- **Health Check**: Available at `/api/health`

### Enterprise Infrastructure
- **AWS**: Terraform templates included
- **Docker**: Production containerization ready
- **CI/CD**: GitHub Actions pre-configured

## Getting Help

### Development Questions
- Check **PLANNING.md** for architectural decisions
- Review **claude.md** for coding guidelines
- Look at existing components for patterns

### Feature Implementation
- Use **requirements.md** to define needs
- Follow **generate-prp.md** for thorough planning
- Reference **PRPs/goodprpexample.md** for structure

---

Built with ❤️ on the [next-enterprise boilerplate](./README.md)