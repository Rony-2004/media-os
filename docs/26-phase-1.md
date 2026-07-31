# Phase 1: Foundation

## Timeline: Months 1-2

## Goals

1. Set up the complete monorepo infrastructure
2. Implement user authentication (email + OAuth)
3. Build LinkedIn OAuth integration for account connection
4. Create basic post management (CRUD)
5. Build the dashboard shell and navigation
6. Establish CI/CD pipeline
7. Deploy staging environment

---

## Tasks

### 1.1 Monorepo Setup
- [ ] Initialize Turborepo with pnpm workspace
- [ ] Configure TypeScript (base, Next.js, Node.js configs)
- [ ] Configure ESLint and Prettier
- [ ] Set up Husky pre-commit hooks
- [ ] Create shared packages structure (database, types, config, logger, utils)
- [ ] Configure Turbo pipelines (build, dev, lint, test)
- [ ] Create `.env.example` files for all apps
- [ ] Document local development setup in README

### 1.2 Database Setup
- [ ] Set up PostgreSQL (local + Neon for staging)
- [ ] Configure Prisma in `packages/database`
- [ ] Create initial schema (users, sessions, social_accounts, posts)
- [ ] Write initial migration
- [ ] Create database seed script for development
- [ ] Set up Prisma client singleton
- [ ] Test database connection and basic queries

### 1.3 API Server Setup
- [ ] Create Express.js application in `apps/api`
- [ ] Configure middleware stack (helmet, cors, rate-limit, pino)
- [ ] Implement request ID middleware
- [ ] Implement global error handler
- [ ] Implement validation middleware (Zod)
- [ ] Create health check endpoint
- [ ] Set up dependency injection container
- [ ] Configure environment validation (Zod)

### 1.4 Authentication
- [ ] Integrate Better Auth
- [ ] Implement email/password registration
- [ ] Implement email verification flow
- [ ] Implement login with session creation
- [ ] Implement logout (session destruction)
- [ ] Implement password reset flow
- [ ] Implement Google OAuth
- [ ] Implement GitHub OAuth
- [ ] Create auth middleware for protected routes
- [ ] Set up Redis for session storage
- [ ] Implement rate limiting on auth endpoints
- [ ] Set up email sending (Resend) for verification/reset

### 1.5 LinkedIn OAuth Integration
- [ ] Create LinkedIn developer application
- [ ] Implement LinkedIn OAuth flow (authorize → callback → token exchange)
- [ ] Store encrypted tokens in social_accounts table
- [ ] Fetch and store LinkedIn profile data
- [ ] Implement token refresh logic
- [ ] Create social accounts API endpoints (list, connect, disconnect)
- [ ] Build account health check utility
- [ ] Handle OAuth errors gracefully

### 1.6 Post Management (Backend)
- [ ] Create posts feature module (controller, service, repository, routes, schema)
- [ ] Implement POST /api/posts (create)
- [ ] Implement GET /api/posts (list with filters and pagination)
- [ ] Implement GET /api/posts/:id (get single)
- [ ] Implement PATCH /api/posts/:id (update)
- [ ] Implement DELETE /api/posts/:id (delete)
- [ ] Implement content validation (character limits per platform)
- [ ] Add plan limit checking (posts per month)

### 1.7 Frontend Setup
- [ ] Create Next.js application in `apps/web`
- [ ] Configure Tailwind CSS
- [ ] Install and configure shadcn/ui
- [ ] Set up TanStack Query
- [ ] Create API client utility (fetch wrapper with cookie handling)
- [ ] Set up authentication context/hooks
- [ ] Create route protection (redirect to login if unauthenticated)
- [ ] Implement dark/light mode toggle

### 1.8 Frontend Pages
- [ ] Login page (email + OAuth buttons)
- [ ] Registration page
- [ ] Email verification page
- [ ] Forgot password page
- [ ] Reset password page
- [ ] Dashboard layout (sidebar, header, main content area)
- [ ] Dashboard home page (placeholder stats cards)
- [ ] Posts list page (table/cards with filtering)
- [ ] Post editor page (basic textarea + save as draft)
- [ ] Settings page shell
- [ ] Social accounts settings page (connect LinkedIn)
- [ ] Profile settings page

### 1.9 Onboarding Flow
- [ ] Onboarding layout (progress steps, no sidebar)
- [ ] Step 1: Welcome screen
- [ ] Step 2: Connect LinkedIn
- [ ] Step 3: Select industry and goals
- [ ] Step 4: Set posting preferences and timezone
- [ ] Step 5: Voice samples (optional paste)
- [ ] Onboarding completion → redirect to dashboard
- [ ] Track onboarding_completed flag

### 1.10 DevOps & CI/CD
- [ ] Create Dockerfile for API
- [ ] Create Dockerfile for Worker (skeleton)
- [ ] Set up GitHub Actions workflow (lint, type-check, test, build)
- [ ] Deploy frontend to Vercel (staging)
- [ ] Deploy API to Railway (staging)
- [ ] Set up Redis (Upstash)
- [ ] Set up PostgreSQL (Neon)
- [ ] Configure environment variables on hosting platforms
- [ ] Set up Sentry for error tracking
- [ ] Create deployment documentation

---

## Deliverables

1. **Working monorepo** with all packages configured
2. **Authentication system** supporting email + Google + GitHub
3. **LinkedIn OAuth** with profile sync and token storage
4. **Post CRUD** with validation and plan limits
5. **Frontend application** with login, dashboard, posts, settings
6. **Onboarding wizard** for new user setup
7. **CI/CD pipeline** with automated deploys to staging
8. **Documentation** updated with any architecture decisions made

---

## Definition of Done

- [ ] User can register with email and verify their account
- [ ] User can login with email/password and OAuth (Google, GitHub)
- [ ] User can connect their LinkedIn account via OAuth
- [ ] User can create, view, edit, and delete post drafts
- [ ] User can see their connected accounts in settings
- [ ] Dashboard loads with sidebar navigation working
- [ ] All endpoints have Zod validation
- [ ] All endpoints have proper error handling
- [ ] Rate limiting is active on auth endpoints
- [ ] OAuth tokens are encrypted at rest
- [ ] Staging environment is deployed and accessible
- [ ] CI pipeline passes on all PRs
- [ ] Basic test coverage on auth and post services (>60%)

---

## Technical Decisions to Make

1. Better Auth configuration specifics (plugins, database adapter)
2. Session strategy (cookie name, max age, sliding window?)
3. API response format standardization
4. Error code registry
5. Logging format and levels per environment
6. File upload strategy for avatars (Cloudinary? S3? Vercel Blob?)
7. Frontend state management approach (TanStack Query only? Need Zustand?)
