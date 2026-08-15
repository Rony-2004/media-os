# AI Social OS — Engineering Guide

## Architecture

- **Monorepo** managed by Turborepo + pnpm workspaces
- **Single port (3000)** — Next.js handles both frontend and API routes
- **Clean Architecture**: API routes → Services → Repository (Prisma) → Database
- **Feature-first** file organization
- **Custom JWT Authentication** — no third-party auth frameworks

## Stack

- **Frontend**: Next.js 15, React 19, Tailwind, shadcn/ui, TanStack Query
- **Backend (API Routes)**: Next.js Route Handlers, Prisma, PostgreSQL
- **Auth**: Custom JWT (bcrypt, jsonwebtoken, HTTP-only cookies)
- **Email**: Nodemailer (production), console.log (development)
- **Validation**: Zod
- **Queue**: BullMQ + Redis (future, for workers)

## Authentication

- **Custom JWT system** — NO Better Auth, NO third-party auth library
- Email + Password registration
- 6-digit OTP email verification
- bcrypt password hashing
- JWT access tokens (15 min) + refresh tokens (30 days)
- Refresh tokens hashed with SHA-256 + salt before storage (NEVER plain text)
- HTTP-only secure cookies
- Refresh token rotation on every refresh
- Token reuse detection (revokes all tokens on reuse)
- Development mode prints OTP and reset links to terminal

### Auth Flow
```
Register → Hash password → Create user → Generate OTP → Store hashed OTP
→ Dev: print OTP to terminal / Prod: send via Nodemailer
→ Verify OTP → Activate user → Login
→ Generate access token + refresh token → Hash refresh token → Store hash
→ Set HTTP-only cookies → Dashboard
```

### Route Protection
- Public: /login, /register, /verify-email, /forgot-password, /reset-password
- Protected: Everything under /(dashboard)/*
- API protection: getAuthUser() checks access_token cookie

## LinkedIn Integration

- LinkedIn is NOT authentication — it's a connected social account
- User must be authenticated with ConnectUs FIRST
- Then connect LinkedIn from Accounts page
- OAuth 2.0 flow stores encrypted tokens
- Sidebar features locked until at least one provider connected

## Folder Structure

```
ai-social-os/
├── apps/web/                    # Next.js (frontend + API on port 3000)
│   ├── src/app/
│   │   ├── (auth)/             # Public auth pages
│   │   ├── (dashboard)/        # Protected dashboard pages
│   │   └── api/                # API route handlers
│   │       ├── auth/           # register, login, logout, verify, refresh, me
│   │       └── social-accounts/# list, connect, disconnect
│   ├── src/components/         # React components
│   ├── src/hooks/              # Custom hooks (useAuth, useConnectedAccounts)
│   └── src/lib/                # Utilities (jwt, hash, cookies, email, auth-guard)
├── packages/database/          # Prisma schema, migrations, seed scripts
└── docs/                       # Documentation
```

## Sidebar Navigation

**Always enabled**: Dashboard, Accounts, Quota, Settings, Help, Logout
**Locked until connected**: Posts, Drafts, Calendar, Analytics, AI Writer, Brand Voice

Locked items show lock icon + tooltip: "Connect a social account to unlock this feature."

## Coding Standards

- TypeScript strict mode, no `any`
- Zod validation on all API inputs
- Services contain business logic
- API routes are thin (validate → call service → respond)
- Passwords: bcrypt (12 rounds)
- Tokens: SHA-256 + salt for storage
- Never log secrets or tokens
- Error responses: `{ error: { code, message, details? } }`
- Success responses: `{ data: {...} }`

## Repo Skills

Project-local agent skills live under `skills/*/SKILL.md`.
