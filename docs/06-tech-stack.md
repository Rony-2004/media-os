# Tech Stack

## Overview

AI Social OS uses a modern TypeScript-first stack optimized for developer productivity, type safety, and production reliability.

---

## Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 14.x | React framework with App Router, SSR, API routes |
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Utility-first styling |
| shadcn/ui | Latest | Pre-built accessible UI components |
| TanStack Query | 5.x | Server state management, caching, mutations |
| React Hook Form | 7.x | Performant form handling |
| Zod | 3.x | Schema validation (shared with backend) |
| Zustand | 4.x | Minimal client state (if needed) |
| Lucide React | Latest | Icon library |
| date-fns | 3.x | Date manipulation |
| Recharts | 2.x | Analytics charts and visualizations |
| next-themes | Latest | Dark/light mode support |

### Frontend Architecture Decisions

**Why Next.js?**
- App Router provides server components for performance
- Built-in API routes for auth callbacks
- Optimized image handling
- SEO capabilities for marketing pages
- Excellent developer experience with hot reload

**Why TanStack Query over Redux/Zustand for server state?**
- Built for server state (cache invalidation, refetching, optimistic updates)
- Reduces boilerplate significantly
- Background refetching keeps data fresh
- Built-in loading/error states

**Why shadcn/ui?**
- Not a component library dependency — copies code into your project
- Full control over styling and behavior
- Built on Radix UI (accessible primitives)
- Tailwind-native, consistent with our styling approach
- Easy to customize per brand guidelines

---

## Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 20.x LTS | Runtime |
| Express.js | 4.x | HTTP framework |
| TypeScript | 5.x | Type safety |
| Prisma | 5.x | ORM, migrations, type-safe queries |
| PostgreSQL | 16.x | Primary relational database |
| Redis | 7.x | Caching, sessions, queue backend |
| BullMQ | 5.x | Job queue for background processing |
| Better Auth | Latest | Authentication library (JWT, OAuth, sessions) |
| Zod | 3.x | Request validation |
| Pino | 8.x | Structured logging (JSON) |
| Helmet | 7.x | Security headers |
| cors | 2.x | CORS middleware |
| express-rate-limit | 7.x | Rate limiting |
| ioredis | 5.x | Redis client |
| nanoid | 5.x | ID generation |
| bcrypt | 5.x | Password hashing |
| jsonwebtoken | 9.x | JWT token handling |
| nodemailer / Resend | Latest | Email delivery |

### Backend Architecture Decisions

**Why Express.js over Fastify/Hono/NestJS?**
- Largest ecosystem and middleware library
- Team familiarity and hiring pool
- Battle-tested in production at scale
- Simple and flexible — doesn't impose architecture
- Easy to find solutions for edge cases

**Why Prisma over Drizzle/TypeORM/Knex?**
- Type-safe query builder generated from schema
- Excellent migration system
- Schema-as-source-of-truth for database
- Great developer experience (auto-complete, error messages)
- Handles complex relations well

**Why BullMQ over Agenda/bee-queue?**
- Redis-backed (already in our stack)
- Excellent TypeScript support
- Supports priorities, delays, retries, rate limiting
- Dashboard available (Bull Board)
- Handles millions of jobs reliably

**Why Better Auth?**
- Modern auth library with built-in OAuth providers
- Supports sessions and JWT
- Handles token refresh, email verification
- Less custom code than building auth from scratch
- Extensible with plugins

---

## AI / Machine Learning

| Technology | Purpose |
|-----------|---------|
| OpenAI API (GPT-4o) | Primary content generation |
| Anthropic API (Claude 3.5) | Secondary/fallback content generation |
| Provider abstraction layer | Swap models without code changes |

### AI Architecture Decisions

**Why multi-provider?**
- No vendor lock-in
- Failover capability (if OpenAI is down, use Claude)
- Different models excel at different tasks
- Cost optimization (route cheaper tasks to cheaper models)
- Future model comparison for quality improvement

**Provider Abstraction**:
```typescript
interface AIProvider {
  generateContent(prompt: AIPrompt): Promise<AIResponse>;
  analyzeContent(content: string): Promise<ContentAnalysis>;
  generateReply(context: ReplyContext): Promise<string[]>;
}
```

---

## Infrastructure & DevOps

| Technology | Purpose |
|-----------|---------|
| Vercel | Frontend hosting (Next.js optimized) |
| Railway / Render | API and Worker hosting |
| Neon / Supabase DB | Managed PostgreSQL |
| Upstash | Managed Redis (serverless) |
| Resend | Transactional email |
| Stripe | Payment processing |
| GitHub Actions | CI/CD pipelines |
| Docker | Local development, production containers |
| Turborepo | Monorepo build orchestration |
| pnpm | Package management (fast, disk-efficient) |

### Infrastructure Decisions

**Why Vercel for frontend?**
- Native Next.js support (same company)
- Edge network for global performance
- Zero-config deployments
- Preview deployments for PRs
- Generous free tier for development

**Why Railway/Render for backend?**
- Easy container deployments
- Built-in PostgreSQL and Redis add-ons
- Auto-scaling capabilities
- Simple environment variable management
- Reasonable pricing for startups

**Why Neon for PostgreSQL?**
- Serverless PostgreSQL (scales to zero)
- Branching for preview environments
- Connection pooling built-in
- Pay-per-usage pricing (great for early stage)
- Compatible with standard PostgreSQL

---

## Development Tools

| Tool | Purpose |
|------|---------|
| Turborepo | Monorepo task orchestration, caching |
| pnpm | Fast, deterministic package management |
| ESLint | Code linting |
| Prettier | Code formatting |
| Husky | Git hooks (pre-commit, pre-push) |
| lint-staged | Run linters on staged files only |
| commitlint | Enforce conventional commit messages |
| tsx | TypeScript execution for scripts |
| nodemon | Auto-restart on file changes (development) |
| Vitest | Unit and integration testing |
| Playwright | End-to-end testing |
| MSW | API mocking for frontend tests |
| Prisma Studio | Database GUI for development |

---

## Third-Party Services

| Service | Purpose | Phase |
|---------|---------|-------|
| LinkedIn API | Social platform integration | 1 |
| X (Twitter) API | Social platform integration | 7 |
| Instagram Graph API | Social platform integration | 7 |
| Facebook Graph API | Social platform integration | 7 |
| Threads API | Social platform integration | 7 |
| OpenAI API | AI content generation | 2 |
| Anthropic API | AI content generation (fallback) | 2 |
| Stripe | Subscription billing | 3 |
| Resend | Transactional email | 1 |
| Sentry | Error tracking and monitoring | 1 |
| Posthog / Mixpanel | Product analytics | 2 |
| Upstash | Rate limiting (optional) | 1 |

---

## Version Pinning Strategy

All dependencies use exact versions in package.json to ensure deterministic builds:

```json
{
  "dependencies": {
    "express": "4.18.2",
    "prisma": "5.10.0",
    "@prisma/client": "5.10.0"
  }
}
```

**Renovate/Dependabot** configured for automated dependency update PRs with:
- Weekly minor/patch updates (auto-merge if tests pass)
- Monthly major updates (require manual review)
- Security updates (immediate, auto-merge)

---

## Compatibility Matrix

| Component | Node.js | TypeScript | PostgreSQL | Redis |
|-----------|---------|-----------|-----------|-------|
| apps/web | 20.x | 5.x | — | — |
| apps/api | 20.x | 5.x | 16.x | 7.x |
| apps/worker | 20.x | 5.x | 16.x | 7.x |
| packages/* | 20.x | 5.x | — | — |
