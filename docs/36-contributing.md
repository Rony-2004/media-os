# Contributing Guide

## Overview

Welcome to AI Social OS. This guide covers everything you need to set up the development environment, understand the codebase, and contribute effectively.

---

## Getting Started

### Prerequisites

| Tool | Version | Installation |
|------|---------|-------------|
| Node.js | 20.x LTS | [nodejs.org](https://nodejs.org) or nvm |
| pnpm | 9.x | `corepack enable && corepack prepare pnpm@latest --activate` |
| Docker | Latest | [docker.com](https://docker.com) |
| Git | Latest | [git-scm.com](https://git-scm.com) |

### Initial Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/ai-social-os.git
cd ai-social-os

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your local values (see docs/23-environment.md)

# 4. Start infrastructure services
docker-compose up -d

# 5. Set up the database
pnpm turbo db:generate   # Generate Prisma client
pnpm turbo db:migrate    # Apply migrations
pnpm turbo db:seed       # Seed development data

# 6. Start development servers
pnpm turbo dev
```

After setup:
- Frontend: http://localhost:3000
- API: http://localhost:4000
- API Health: http://localhost:4000/api/health

### Test Accounts (after seeding)

| Email | Password | Plan |
|-------|----------|------|
| free@test.com | Password123 | Free |
| pro@test.com | Password123 | Pro |
| business@test.com | Password123 | Business |

---

## Development Workflow

### 1. Pick a Task
- Check the project board for unassigned tasks
- Assign yourself and move to "In Progress"
- If task is unclear, ask for clarification before starting

### 2. Create a Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

Branch naming:
- `feature/linkedin-oauth` — New features
- `fix/token-refresh-loop` — Bug fixes
- `chore/update-dependencies` — Maintenance
- `docs/update-api-reference` — Documentation

### 3. Develop

```bash
# Start development mode (watches all apps)
pnpm turbo dev

# Run only specific app
pnpm turbo dev --filter=api
pnpm turbo dev --filter=web

# Run linting
pnpm turbo lint

# Run type checking
pnpm turbo typecheck

# Run tests
pnpm turbo test
pnpm turbo test --filter=api
```

### 4. Commit

Follow Conventional Commits:

```bash
# Good commits
git commit -m "feat(api): add LinkedIn OAuth connection flow"
git commit -m "fix(worker): handle token refresh failure gracefully"
git commit -m "test(api): add integration tests for post scheduling"
git commit -m "docs: update API endpoint documentation"

# Bad commits
git commit -m "fixed stuff"
git commit -m "WIP"
git commit -m "update"
```

Commit often with small, focused changes. Each commit should be a logical unit of work.

### 5. Push and Create PR

```bash
git push -u origin feature/your-feature-name
```

Then create a Pull Request with:
- Clear title (same as would be a commit message)
- Description of what and why
- Screenshots for UI changes
- Testing notes (how to verify)
- Link to relevant issue/task

### 6. Code Review

- At least 1 approval required
- CI must pass (lint, typecheck, tests)
- Address all review comments
- Request re-review after changes

### 7. Merge

- Squash merge to main (default)
- Delete branch after merge
- Verify staging deployment succeeds

---

## Project Structure Quick Reference

```
apps/
  web/          → Next.js frontend (port 3000)
  api/          → Express API (port 4000)
  worker/       → BullMQ background workers

packages/
  database/     → Prisma schema and client
  types/        → Shared TypeScript types
  config/       → Shared configuration
  logger/       → Pino logger
  utils/        → Shared utilities
  shared/       → Shared business logic (validators, constants)
  ui/           → Shared React components (shadcn/ui)
```

---

## Adding a New Feature

### Backend Feature Checklist

1. Create feature directory: `apps/api/src/features/{feature}/`
2. Create files:
   - `{feature}.controller.ts`
   - `{feature}.service.ts`
   - `{feature}.repository.ts`
   - `{feature}.routes.ts`
   - `{feature}.schema.ts`
   - `{feature}.types.ts`
3. Register routes in main router
4. Add Zod schemas for all inputs
5. Add proper error handling (custom errors)
6. Write unit tests for service
7. Write integration tests for routes
8. Update API documentation

### Frontend Feature Checklist

1. Create page: `apps/web/src/app/(dashboard)/{feature}/page.tsx`
2. Create components: `apps/web/src/components/{feature}/`
3. Create hook: `apps/web/src/hooks/use-{feature}.ts`
4. Add TanStack Query hooks for API calls
5. Add form validation (React Hook Form + Zod)
6. Handle loading, error, and empty states
7. Ensure responsive design
8. Test keyboard navigation
9. Add to sidebar navigation

---

## Common Tasks

### Adding a Database Table

```bash
# 1. Edit Prisma schema
# packages/database/prisma/schema.prisma

# 2. Create migration
pnpm --filter database prisma migrate dev --name add_new_table

# 3. Generate updated client
pnpm --filter database prisma generate

# 4. Create repository class
# 5. Update seed script if needed
```

### Adding an API Endpoint

```typescript
// 1. Define Zod schema
const createWidgetSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    type: z.enum(['typeA', 'typeB'])
  })
});

// 2. Add route
router.post('/', validate(createWidgetSchema), controller.create);

// 3. Add controller method
async create(req: Request, res: Response) {
  const result = await this.service.create(req.userId, req.validated.body);
  res.status(201).json({ data: result });
}

// 4. Add service logic
async create(userId: string, input: CreateWidgetInput) {
  // business logic, validation, repository calls
}

// 5. Add repository method
async create(data: WidgetCreateData) {
  return this.prisma.widget.create({ data });
}
```

### Adding a shadcn/ui Component

```bash
# Use the shadcn CLI to add components to the UI package
pnpm --filter ui dlx shadcn-ui@latest add button
pnpm --filter ui dlx shadcn-ui@latest add dialog
```

### Adding a Background Job

```typescript
// 1. Add job to appropriate queue
await myQueue.add('job-name', { data }, { options });

// 2. Create job processor
async function processMyJob(job: Job) {
  const { data } = job.data;
  // process job
}

// 3. Register with worker
const worker = new Worker('my-queue', processMyJob, { connection: redis });
```

---

## Troubleshooting

### Common Issues

**Prisma client not generating**:
```bash
pnpm --filter database prisma generate
```

**Database connection fails**:
- Check Docker is running: `docker ps`
- Check .env DATABASE_URL is correct
- Try: `docker-compose down && docker-compose up -d`

**Port already in use**:
```bash
# Find and kill process on port
npx kill-port 3000 4000
```

**pnpm install fails**:
```bash
pnpm store prune
rm -rf node_modules
pnpm install
```

**Type errors after pulling latest**:
```bash
pnpm turbo build --filter=types --filter=database
```

---

## Code Style Quick Reference

- **Indentation**: 2 spaces
- **Quotes**: Single quotes
- **Semicolons**: Always
- **Trailing commas**: ES5 (objects, arrays)
- **Line width**: 100 characters
- **Imports**: Organized by category (see coding standards)
- **Types**: Explicit return types on exported functions
- **Errors**: Custom error classes, never throw raw strings
- **Logging**: Use `logger` package, never `console.log`
- **Comments**: Explain *why*, not *what* (code should be self-documenting)

---

## Getting Help

- **Architecture questions**: Check docs/ folder first
- **How-to questions**: Search existing code for similar patterns
- **Bugs**: Create a GitHub issue with reproduction steps
- **Discussions**: Use GitHub Discussions for open-ended questions
- **Urgent**: Tag maintainers in PR or issue

---

## Definition of a Good PR

- [ ] Focused: does one thing well
- [ ] Small: < 400 lines changed (split large features into multiple PRs)
- [ ] Tested: includes relevant tests
- [ ] Documented: updates docs if API or behavior changes
- [ ] Clean: no console.logs, no commented-out code, no TODOs without issues
- [ ] Passing: CI is green
- [ ] Described: PR description explains what and why
