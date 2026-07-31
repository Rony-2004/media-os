# Deployment

## Overview

AI Social OS uses a modern deployment pipeline with automated CI/CD, preview environments, and zero-downtime production deployments.

---

## Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Production                                │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Vercel     │  │   Railway    │  │   Railway            │  │
│  │   (Frontend) │  │   (API)      │  │   (Worker)           │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                           │                    │                  │
│                    ┌──────┴────────────────────┘                  │
│                    │                                              │
│  ┌──────────────┐  │  ┌──────────────┐                          │
│  │   Neon       │←─┘  │   Upstash    │                          │
│  │ (PostgreSQL) │      │   (Redis)    │                          │
│  └──────────────┘      └──────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Environments

| Environment | Purpose | URL | Deploy Trigger |
|-------------|---------|-----|---------------|
| Local | Development | localhost:3000/4000 | Manual (pnpm dev) |
| Preview | PR review | {branch}.preview.aisocialos.com | Every PR |
| Staging | Pre-production testing | staging.aisocialos.com | Merge to main |
| Production | Live users | app.aisocialos.com | Manual promote from staging |

---

## Deployment Targets

### Frontend (Vercel)

**Why Vercel**:
- Native Next.js support (same team builds both)
- Edge network for global performance
- Zero-config deployments from git
- Preview deployments for every PR
- Automatic HTTPS and CDN

**Configuration**:
```json
// vercel.json
{
  "buildCommand": "pnpm turbo build --filter=web",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": "@stripe_pk"
  }
}
```

**Deploy flow**:
1. Push to branch → Vercel builds preview
2. Merge to main → Vercel builds staging
3. Promote staging → production (Vercel dashboard or CLI)

### Backend API (Railway)

**Why Railway**:
- Simple container deployments
- Built-in zero-downtime deploys (rolling updates)
- Easy environment variable management
- Auto-scaling available
- Integrated logging

**Configuration**:
```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/database/package.json packages/database/
COPY packages/types/package.json packages/types/
COPY packages/config/package.json packages/config/
COPY packages/logger/package.json packages/logger/
COPY packages/utils/package.json packages/utils/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --prod

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo build --filter=api

FROM base AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages ./packages

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "apps/api/dist/index.js"]
```

### Worker (Railway - Separate Service)

```dockerfile
# apps/worker/Dockerfile (same pattern as API)
# ...
CMD ["node", "apps/worker/dist/index.js"]
```

Workers run as a separate Railway service, scaling independently from the API.

---

## CI/CD Pipeline (GitHub Actions)

### Main Workflow

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # Job 1: Lint, Type Check, Unit Tests
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo lint
      - run: pnpm turbo typecheck
      - run: pnpm turbo test:unit

  # Job 2: Integration Tests
  integration:
    runs-on: ubuntu-latest
    needs: quality
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: aisocialos_test
        ports: ['5432:5432']
      redis:
        image: redis:7
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo db:migrate -- --skip-seed
        env:
          DATABASE_URL: postgresql://postgres:testpass@localhost:5432/aisocialos_test
      - run: pnpm turbo test:integration
        env:
          DATABASE_URL: postgresql://postgres:testpass@localhost:5432/aisocialos_test
          REDIS_URL: redis://localhost:6379

  # Job 3: Build
  build:
    runs-on: ubuntu-latest
    needs: [quality, integration]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo build

  # Job 4: Deploy (only on main)
  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy API to Railway (staging)
        run: railway up --service api --environment staging
      - name: Deploy Worker to Railway (staging)
        run: railway up --service worker --environment staging
      - name: Run database migrations
        run: railway run --service api -- pnpm prisma migrate deploy
```

---

## Database Migrations

### Migration Strategy

```
Development:
  pnpm prisma migrate dev --name description
  (Creates migration file, applies to local DB)

Staging/Production:
  pnpm prisma migrate deploy
  (Applies pending migrations, no prompt)
```

### Migration Safety Rules
1. Never modify existing migration files
2. Always test migrations against production-like data locally
3. Additive changes preferred (add column nullable → backfill → add constraint)
4. Large migrations run during maintenance window
5. Rollback plan documented for every migration
6. Migration runs as part of deploy pipeline (before new code starts)

### Migration in Deploy Pipeline
```
1. New code pushed to main
2. CI passes
3. Deploy triggered
4. BEFORE new containers start:
   - Run: prisma migrate deploy
   - If migration fails: abort deploy, alert team
5. AFTER migrations succeed:
   - New API containers start (rolling update)
   - New Worker containers start
6. Old containers gracefully shut down
```

---

## Zero-Downtime Deployment

### Strategy: Rolling Updates

```
Current state: [API-v1] [API-v1] [API-v1]

1. Start new container: [API-v1] [API-v1] [API-v1] [API-v2]
2. Health check passes on v2
3. Route traffic to v2: [API-v1] [API-v1] [API-v2 ✓]
4. Drain v1 instance: [API-v1] [API-v2 ✓] [API-v2]
5. Repeat until: [API-v2] [API-v2] [API-v2]
```

### Requirements for Zero-Downtime
- API servers are stateless (sessions in Redis)
- Database migrations are backward-compatible
- New code handles old data format
- Health check endpoint validates readiness
- Graceful shutdown (finish in-progress requests)

---

## Rollback Procedure

### Automatic Rollback
- If health check fails after deploy → automatic rollback
- If error rate spikes > 5% → automatic rollback alert

### Manual Rollback
```
1. Railway: Revert to previous deployment (1-click in dashboard)
2. Vercel: Revert to previous deployment (instant)
3. Database: Run down migration if needed (only if migration was applied)
```

### Rollback Checklist
- [ ] Identify issue (logs, metrics, user reports)
- [ ] Decision: rollback vs. forward-fix
- [ ] Rollback deployment (API + Worker)
- [ ] Verify rollback successful (health checks, error rate)
- [ ] Communicate to users if impact was visible
- [ ] Post-mortem: what went wrong, how to prevent

---

## Environment Variables Management

### Per-Environment Configuration
- **Local**: `.env` files (gitignored)
- **Staging/Production**: Railway environment variables (encrypted)
- **Frontend**: Vercel environment variables
- **Secrets**: never in code, never in CI logs

### Adding New Environment Variable
1. Add to `.env.example` with description
2. Add to Zod validation schema
3. Add to Railway/Vercel for staging
4. Add to Railway/Vercel for production
5. Update `23-environment.md` documentation

---

## Monitoring Post-Deploy

### Deploy Verification Checklist
- [ ] Health check endpoint returns 200
- [ ] API response time within normal range
- [ ] No new errors in Sentry
- [ ] Queue processing normally (no backlog growth)
- [ ] Key user flow works (login, create post, view dashboard)
- [ ] Database connections stable
- [ ] Redis connections stable

### Alerts After Deploy
- Error rate > 1% (warning)
- Error rate > 5% (critical, consider rollback)
- p95 latency > 2x baseline (warning)
- Queue depth growing abnormally (warning)
- Health check failing (critical)

---

## Local Development

### Starting Development Environment

```bash
# 1. Clone and install
git clone <repo>
pnpm install

# 2. Start infrastructure (Docker)
docker-compose up -d  # PostgreSQL + Redis

# 3. Set up database
pnpm turbo db:migrate
pnpm turbo db:seed

# 4. Start all apps
pnpm turbo dev
# Starts:
#   - web on localhost:3000
#   - api on localhost:4000
#   - worker in background
```

### Docker Compose (Development)

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: aisocialos_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```
