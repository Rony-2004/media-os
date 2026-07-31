# Folder Structure

## Monorepo Root

```
ai-social-os/
├── apps/
│   ├── web/                          # Next.js frontend application
│   ├── api/                          # Express.js backend API
│   └── worker/                       # BullMQ background workers
├── packages/
│   ├── database/                     # Prisma schema, migrations, client
│   ├── ui/                           # Shared React component library
│   ├── types/                        # Shared TypeScript types/interfaces
│   ├── config/                       # Shared configuration (env parsing, constants)
│   ├── logger/                       # Pino logger setup, shared across apps
│   ├── utils/                        # Shared utility functions
│   ├── shared/                       # Shared business logic (validators, formatters)
│   ├── eslint-config/                # ESLint configurations
│   └── typescript-config/            # TypeScript configurations
├── docs/                             # Project documentation
├── scripts/                          # Development and deployment scripts
├── .github/                          # GitHub Actions workflows
├── turbo.json                        # Turborepo configuration
├── pnpm-workspace.yaml               # PNPM workspace definition
├── package.json                      # Root package.json
├── .gitignore
├── .env.example                      # Environment variable template
└── README.md
```

---

## apps/web/ — Frontend Application

```
apps/web/
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── images/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth route group (no dashboard layout)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   ├── reset-password/
│   │   │   │   └── page.tsx
│   │   │   ├── verify-email/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/              # Protected dashboard route group
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── posts/
│   │   │   │   ├── page.tsx          # Post list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Create post
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # View/edit post
│   │   │   │       └── analytics/
│   │   │   │           └── page.tsx
│   │   │   ├── calendar/
│   │   │   │   └── page.tsx
│   │   │   ├── ai-writer/
│   │   │   │   └── page.tsx
│   │   │   ├── analytics/
│   │   │   │   ├── page.tsx          # Overview
│   │   │   │   └── reports/
│   │   │   │       └── page.tsx
│   │   │   ├── engagement/
│   │   │   │   ├── page.tsx          # Comment inbox
│   │   │   │   └── [commentId]/
│   │   │   │       └── page.tsx
│   │   │   ├── trends/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx          # General settings
│   │   │   │   ├── profile/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── accounts/
│   │   │   │   │   └── page.tsx      # Social accounts
│   │   │   │   ├── brand-voice/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── notifications/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── scheduling/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── billing/
│   │   │   │       └── page.tsx
│   │   │   ├── notifications/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx            # Dashboard shell (sidebar, nav)
│   │   ├── (marketing)/              # Public marketing pages
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── pricing/
│   │   │   │   └── page.tsx
│   │   │   ├── features/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/                      # Next.js API routes (auth callbacks only)
│   │   │   └── auth/
│   │   │       └── callback/
│   │   │           └── [provider]/
│   │   │               └── route.ts
│   │   ├── layout.tsx                # Root layout
│   │   ├── not-found.tsx
│   │   └── error.tsx
│   ├── components/                   # App-specific components
│   │   ├── auth/
│   │   │   ├── login-form.tsx
│   │   │   ├── register-form.tsx
│   │   │   └── oauth-buttons.tsx
│   │   ├── dashboard/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── stats-cards.tsx
│   │   │   └── recent-posts.tsx
│   │   ├── posts/
│   │   │   ├── post-editor.tsx
│   │   │   ├── post-card.tsx
│   │   │   ├── post-list.tsx
│   │   │   ├── post-preview.tsx
│   │   │   └── schedule-modal.tsx
│   │   ├── ai/
│   │   │   ├── generation-form.tsx
│   │   │   ├── variant-card.tsx
│   │   │   └── brand-voice-config.tsx
│   │   ├── analytics/
│   │   │   ├── metrics-chart.tsx
│   │   │   ├── top-posts.tsx
│   │   │   └── insights-panel.tsx
│   │   ├── calendar/
│   │   │   ├── calendar-view.tsx
│   │   │   └── calendar-event.tsx
│   │   ├── engagement/
│   │   │   ├── comment-list.tsx
│   │   │   ├── comment-card.tsx
│   │   │   └── reply-suggestions.tsx
│   │   ├── notifications/
│   │   │   ├── notification-bell.tsx
│   │   │   └── notification-list.tsx
│   │   └── shared/
│   │       ├── loading.tsx
│   │       ├── error-boundary.tsx
│   │       ├── empty-state.tsx
│   │       └── platform-icon.tsx
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-auth.ts
│   │   ├── use-posts.ts
│   │   ├── use-analytics.ts
│   │   ├── use-ai-writer.ts
│   │   ├── use-social-accounts.ts
│   │   ├── use-notifications.ts
│   │   └── use-debounce.ts
│   ├── lib/                          # Frontend utilities
│   │   ├── api-client.ts             # Axios/fetch wrapper
│   │   ├── query-client.ts           # TanStack Query setup
│   │   ├── auth.ts                   # Auth utilities
│   │   ├── constants.ts
│   │   ├── utils.ts                  # cn(), formatDate, etc.
│   │   └── validators.ts             # Zod schemas for forms
│   ├── styles/
│   │   └── globals.css               # Tailwind directives + custom CSS
│   └── types/
│       └── index.ts                  # Frontend-specific types
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── package.json
└── .env.local
```

---

## apps/api/ — Backend API Server

```
apps/api/
├── src/
│   ├── features/                     # Feature modules (domain-driven)
│   │   ├── auth/
│   │   │   ├── auth.controller.ts    # HTTP handlers
│   │   │   ├── auth.service.ts       # Business logic
│   │   │   ├── auth.repository.ts    # Database queries
│   │   │   ├── auth.routes.ts        # Express router
│   │   │   ├── auth.schema.ts        # Zod validation schemas
│   │   │   ├── auth.types.ts         # Feature-specific types
│   │   │   └── auth.test.ts          # Unit tests
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── users.routes.ts
│   │   │   ├── users.schema.ts
│   │   │   └── users.types.ts
│   │   ├── social-accounts/
│   │   │   ├── social-accounts.controller.ts
│   │   │   ├── social-accounts.service.ts
│   │   │   ├── social-accounts.repository.ts
│   │   │   ├── social-accounts.routes.ts
│   │   │   ├── social-accounts.schema.ts
│   │   │   ├── social-accounts.types.ts
│   │   │   └── providers/            # Platform-specific logic
│   │   │       ├── linkedin.provider.ts
│   │   │       ├── twitter.provider.ts
│   │   │       └── provider.interface.ts
│   │   ├── posts/
│   │   │   ├── posts.controller.ts
│   │   │   ├── posts.service.ts
│   │   │   ├── posts.repository.ts
│   │   │   ├── posts.routes.ts
│   │   │   ├── posts.schema.ts
│   │   │   └── posts.types.ts
│   │   ├── scheduler/
│   │   │   ├── scheduler.controller.ts
│   │   │   ├── scheduler.service.ts
│   │   │   ├── scheduler.routes.ts
│   │   │   └── scheduler.schema.ts
│   │   ├── analytics/
│   │   │   ├── analytics.controller.ts
│   │   │   ├── analytics.service.ts
│   │   │   ├── analytics.repository.ts
│   │   │   ├── analytics.routes.ts
│   │   │   └── analytics.schema.ts
│   │   ├── ai/
│   │   │   ├── ai.controller.ts
│   │   │   ├── ai.service.ts
│   │   │   ├── ai.routes.ts
│   │   │   ├── ai.schema.ts
│   │   │   └── providers/            # AI provider abstraction
│   │   │       ├── openai.provider.ts
│   │   │       ├── anthropic.provider.ts
│   │   │       └── ai-provider.interface.ts
│   │   ├── brand-memory/
│   │   │   ├── brand-memory.controller.ts
│   │   │   ├── brand-memory.service.ts
│   │   │   ├── brand-memory.repository.ts
│   │   │   ├── brand-memory.routes.ts
│   │   │   └── brand-memory.schema.ts
│   │   ├── comments/
│   │   │   ├── comments.controller.ts
│   │   │   ├── comments.service.ts
│   │   │   ├── comments.repository.ts
│   │   │   ├── comments.routes.ts
│   │   │   └── comments.schema.ts
│   │   ├── trends/
│   │   │   ├── trends.controller.ts
│   │   │   ├── trends.service.ts
│   │   │   ├── trends.repository.ts
│   │   │   ├── trends.routes.ts
│   │   │   └── trends.schema.ts
│   │   ├── notifications/
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── notifications.repository.ts
│   │   │   ├── notifications.routes.ts
│   │   │   └── notifications.schema.ts
│   │   └── billing/
│   │       ├── billing.controller.ts
│   │       ├── billing.service.ts
│   │       ├── billing.routes.ts
│   │       └── billing.schema.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts        # JWT/session verification
│   │   ├── validate.middleware.ts    # Zod request validation
│   │   ├── rate-limit.middleware.ts  # Rate limiting
│   │   ├── error-handler.middleware.ts # Global error handler
│   │   ├── request-id.middleware.ts  # Correlation IDs
│   │   └── cors.middleware.ts        # CORS configuration
│   ├── lib/
│   │   ├── container.ts             # Dependency injection container
│   │   ├── errors.ts                # Custom error classes
│   │   ├── response.ts              # Response formatter helpers
│   │   ├── encryption.ts            # Token encryption utilities
│   │   └── redis.ts                 # Redis client setup
│   ├── config/
│   │   ├── index.ts                 # Configuration loader
│   │   ├── database.ts              # Database config
│   │   └── constants.ts             # App constants
│   ├── server.ts                    # Express app setup
│   └── index.ts                     # Entry point
├── tests/
│   ├── integration/                 # Integration tests
│   ├── helpers/                     # Test utilities
│   └── fixtures/                    # Test data
├── tsconfig.json
├── package.json
├── nodemon.json
└── .env
```

---

## apps/worker/ — Background Workers

```
apps/worker/
├── src/
│   ├── workers/                     # Worker definitions
│   │   ├── publish.worker.ts        # Publishes scheduled posts
│   │   ├── analytics.worker.ts      # Fetches post/account analytics
│   │   ├── trend.worker.ts          # Analyzes trends
│   │   ├── comment.worker.ts        # Fetches and processes comments
│   │   ├── notification.worker.ts   # Sends notifications (email, push)
│   │   └── ai.worker.ts            # Background AI processing
│   ├── queues/                      # Queue configurations
│   │   ├── index.ts                 # Queue registry
│   │   ├── publish.queue.ts
│   │   ├── analytics.queue.ts
│   │   ├── trend.queue.ts
│   │   ├── comment.queue.ts
│   │   ├── notification.queue.ts
│   │   └── ai.queue.ts
│   ├── jobs/                        # Job processor logic
│   │   ├── publish-post.job.ts
│   │   ├── fetch-analytics.job.ts
│   │   ├── analyze-trends.job.ts
│   │   ├── fetch-comments.job.ts
│   │   ├── send-notification.job.ts
│   │   ├── generate-report.job.ts
│   │   └── update-brand-memory.job.ts
│   ├── schedulers/                  # Cron/recurring job schedulers
│   │   ├── analytics-scheduler.ts   # Schedule analytics fetches
│   │   ├── trend-scheduler.ts       # Schedule trend checks
│   │   ├── comment-scheduler.ts     # Schedule comment fetches
│   │   └── report-scheduler.ts      # Schedule weekly reports
│   ├── lib/
│   │   ├── redis.ts
│   │   └── graceful-shutdown.ts
│   ├── config/
│   │   └── index.ts
│   └── index.ts                    # Worker entry point
├── tsconfig.json
├── package.json
└── .env
```

---

## packages/database/ — Database Package

```
packages/database/
├── prisma/
│   ├── schema.prisma               # Database schema
│   ├── migrations/                  # Migration history
│   │   └── YYYYMMDDHHMMSS_init/
│   │       └── migration.sql
│   └── seed.ts                     # Database seeder
├── src/
│   ├── index.ts                    # Export Prisma client
│   └── client.ts                   # Prisma client singleton
├── tsconfig.json
└── package.json
```

---

## packages/types/ — Shared Types

```
packages/types/
├── src/
│   ├── index.ts                    # Barrel export
│   ├── user.types.ts
│   ├── post.types.ts
│   ├── social-account.types.ts
│   ├── analytics.types.ts
│   ├── comment.types.ts
│   ├── notification.types.ts
│   ├── ai.types.ts
│   ├── brand-memory.types.ts
│   ├── trend.types.ts
│   ├── billing.types.ts
│   └── api.types.ts                # API request/response types
├── tsconfig.json
└── package.json
```

---

## packages/config/ — Shared Configuration

```
packages/config/
├── src/
│   ├── index.ts
│   ├── env.ts                      # Environment variable parser (Zod)
│   ├── constants.ts                # Shared constants
│   └── platforms.ts                # Platform-specific constants
├── tsconfig.json
└── package.json
```

---

## packages/logger/ — Logger Package

```
packages/logger/
├── src/
│   ├── index.ts
│   ├── logger.ts                   # Pino logger factory
│   ├── redact.ts                   # Sensitive field redaction
│   └── transports.ts              # Log transports config
├── tsconfig.json
└── package.json
```

---

## packages/utils/ — Shared Utilities

```
packages/utils/
├── src/
│   ├── index.ts
│   ├── date.ts                     # Date formatting, timezone helpers
│   ├── string.ts                   # String manipulation
│   ├── crypto.ts                   # Hashing, encryption helpers
│   ├── retry.ts                    # Retry with backoff utility
│   ├── slug.ts                     # URL slug generation
│   └── pagination.ts              # Pagination helpers
├── tsconfig.json
└── package.json
```

---

## packages/shared/ — Shared Business Logic

```
packages/shared/
├── src/
│   ├── index.ts
│   ├── validators/                 # Shared Zod schemas
│   │   ├── post.validator.ts
│   │   ├── user.validator.ts
│   │   └── common.validator.ts
│   ├── formatters/                 # Data formatters
│   │   ├── analytics.formatter.ts
│   │   └── post.formatter.ts
│   ├── constants/
│   │   ├── platforms.ts            # Platform limits, features
│   │   ├── plans.ts                # Subscription plan definitions
│   │   └── errors.ts              # Error code registry
│   └── enums/
│       ├── post-status.enum.ts
│       ├── platform.enum.ts
│       └── notification-type.enum.ts
├── tsconfig.json
└── package.json
```

---

## packages/ui/ — Shared UI Components

```
packages/ui/
├── src/
│   ├── components/                 # shadcn/ui based components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── calendar.tsx
│   │   ├── chart.tsx
│   │   ├── tabs.tsx
│   │   ├── table.tsx
│   │   ├── skeleton.tsx
│   │   ├── switch.tsx
│   │   ├── slider.tsx
│   │   └── tooltip.tsx
│   └── index.ts
├── tsconfig.json
└── package.json
```

---

## File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase or kebab-case file, PascalCase export | `post-card.tsx` → `PostCard` |
| Hooks | camelCase with `use` prefix | `use-posts.ts` |
| Utils | camelCase | `date.ts` |
| Types | camelCase with `.types.ts` suffix | `post.types.ts` |
| Schemas | camelCase with `.schema.ts` suffix | `auth.schema.ts` |
| Tests | Same name with `.test.ts` suffix | `auth.service.test.ts` |
| Config | camelCase | `database.ts` |
| Routes | camelCase with `.routes.ts` suffix | `posts.routes.ts` |
| Controllers | camelCase with `.controller.ts` suffix | `posts.controller.ts` |
| Services | camelCase with `.service.ts` suffix | `posts.service.ts` |
| Repositories | camelCase with `.repository.ts` suffix | `posts.repository.ts` |
| Workers | camelCase with `.worker.ts` suffix | `publish.worker.ts` |
| Middleware | camelCase with `.middleware.ts` suffix | `auth.middleware.ts` |
