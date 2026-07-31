# Environment Variables

## Overview

All configuration is managed through environment variables. This document lists every variable, its purpose, format, and which applications need it. Actual secret values are never stored in documentation or code.

---

## Variable Reference

### Application Core

| Variable | Required | Apps | Description |
|----------|----------|------|-------------|
| `NODE_ENV` | Yes | api, worker, web | Environment: `development`, `staging`, `production` |
| `PORT` | Yes | api | API server port. Default: `4000` |
| `APP_URL` | Yes | api, worker | Frontend URL (for emails, redirects). Example: `https://app.aisocialos.com` |
| `API_URL` | Yes | web | Backend API URL. Example: `https://api.aisocialos.com` |
| `LOG_LEVEL` | No | api, worker | Pino log level: `trace`, `debug`, `info`, `warn`, `error`. Default: `info` |

### Database

| Variable | Required | Apps | Description |
|----------|----------|------|-------------|
| `DATABASE_URL` | Yes | api, worker | PostgreSQL connection string. Format: `postgresql://user:pass@host:5432/dbname?sslmode=require` |
| `DATABASE_POOL_SIZE` | No | api, worker | Connection pool max size. Default: `20` |
| `DATABASE_CONNECTION_TIMEOUT` | No | api, worker | Connection timeout in ms. Default: `5000` |

### Redis

| Variable | Required | Apps | Description |
|----------|----------|------|-------------|
| `REDIS_URL` | Yes | api, worker | Redis connection string. Format: `redis://user:pass@host:6379` |
| `REDIS_TLS` | No | api, worker | Enable TLS for Redis. Default: `false` in dev, `true` in production |
| `REDIS_KEY_PREFIX` | No | api, worker | Prefix for all Redis keys. Default: `aisocialos:` |

### Authentication

| Variable | Required | Apps | Description |
|----------|----------|------|-------------|
| `SESSION_SECRET` | Yes | api | Secret for signing session cookies. Min 32 characters. |
| `SESSION_MAX_AGE` | No | api | Session duration in seconds. Default: `86400` (24 hours) |
| `TOKEN_ENCRYPTION_KEY` | Yes | api, worker | 32-byte hex key for encrypting OAuth tokens. Generate with: `openssl rand -hex 32` |
| `BCRYPT_ROUNDS` | No | api | Bcrypt cost factor. Default: `12` |

### OAuth — Google

| Variable | Required | Apps | Description |
|----------|----------|------|-------------|
| `GOOGLE_CLIENT_ID` | Yes | api | Google OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | api | Google OAuth 2.0 client secret |
| `GOOGLE_CALLBACK_URL` | Yes | api | OAuth callback URL. Example: `https://api.aisocialos.com/api/auth/oauth/google/callback` |

### OAuth — GitHub

| Variable | Required | Apps | Description |
|----------|----------|------|-------------|
| `GITHUB_CLIENT_ID` | Yes | api | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | Yes | api | GitHub OAuth app client secret |
| `GITHUB_CALLBACK_URL` | Yes | api | OAuth callback URL. Example: `https://api.aisocialos.com/api/auth/oauth/github/callback` |

### LinkedIn Integration

| Variable | Required | Apps | Description |
|----------|----------|------|-------------|
| `LINKEDIN_CLIENT_ID` | Yes | api | LinkedIn app client ID |
| `LINKEDIN_CLIENT_SECRET` | Yes | api | LinkedIn app client secret |
| `LINKEDIN_CALLBACK_URL` | Yes | api | OAuth callback. Example: `https://api.aisocialos.com/api/social-accounts/linkedin/callback` |
| `LINKEDIN_SCOPES` | No | api | Comma-separated scopes. Default: `openid,profile,email,w_member_social` |

### X (Twitter) Integration (Phase 7)

| Variable | Required | Apps | Description |
|----------|----------|------|-------------|
| `TWITTER_CLIENT_ID` | Phase 7 | api | Twitter OAuth 2.0 client ID |
| `TWITTER_CLIENT_SECRET` | Phase 7 | api | Twitter OAuth 2.0 client secret |
| `TWITTER_CALLBACK_URL` | Phase 7 | api | OAuth callback URL |

### AI Providers

| Variable | Required | Apps | Description |
|----------|----------|------|-------------|
| `OPENAI_API_KEY` | Yes | api, worker | OpenAI API key. Starts with `sk-` |
| `OPENAI_ORG_ID` | No | api, worker | OpenAI organization ID (if applicable) |
| `OPENAI_MODEL` | No | api, worker | Default model. Default: `gpt-4o` |
| `ANTHROPIC_API_KEY` | Yes | api, worker | Anthropic API key. Starts with `sk-ant-` |
| `ANTHROPIC_MODEL` | No | api, worker | Default model. Default: `claude-3-5-sonnet-20241022` |
| `AI_PRIMARY_PROVIDER` | No | api, worker | Primary AI provider. Default: `openai` |
| `AI_TEMPERATURE` | No | api, worker | Default temperature. Default: `0.8` |
| `AI_MAX_TOKENS` | No | api, worker | Default max tokens. Default: `1000` |

### Email (Resend)

| Variable | Required | Apps | Description |
|----------|----------|------|-------------|
| `RESEND_API_KEY` | Yes | api, worker | Resend API key. Starts with `re_` |
| `EMAIL_FROM` | No | api, worker | From address. Default: `notifications@aisocialos.com` |
| `EMAIL_REPLY_TO` | No | api, worker | Reply-to address. Default: `support@aisocialos.com` |

### Payments (Stripe) — Phase 3+

| Variable | Required | Apps | Description |
|----------|----------|------|-------------|
| `STRIPE_SECRET_KEY` | Phase 3 | api | Stripe secret key. Starts with `sk_` |
| `STRIPE_PUBLISHABLE_KEY` | Phase 3 | web | Stripe publishable key. Starts with `pk_` |
| `STRIPE_WEBHOOK_SECRET` | Phase 3 | api | Stripe webhook signing secret. Starts with `whsec_` |
| `STRIPE_PRICE_PRO_MONTHLY` | Phase 3 | api | Stripe price ID for Pro monthly plan |
| `STRIPE_PRICE_PRO_YEARLY` | Phase 3 | api | Stripe price ID for Pro yearly plan |
| `STRIPE_PRICE_BUSINESS_MONTHLY` | Phase 3 | api | Stripe price ID for Business monthly plan |
| `STRIPE_PRICE_BUSINESS_YEARLY` | Phase 3 | api | Stripe price ID for Business yearly plan |

### Monitoring (Optional)

| Variable | Required | Apps | Description |
|----------|----------|------|-------------|
| `SENTRY_DSN` | No | api, worker, web | Sentry error tracking DSN |
| `POSTHOG_API_KEY` | No | web | PostHog product analytics key |
| `POSTHOG_HOST` | No | web | PostHog instance URL |

### Feature Flags

| Variable | Required | Apps | Description |
|----------|----------|------|-------------|
| `FEATURE_TWITTER_ENABLED` | No | api, web | Enable Twitter integration. Default: `false` |
| `FEATURE_INSTAGRAM_ENABLED` | No | api, web | Enable Instagram integration. Default: `false` |
| `FEATURE_AUTO_REPLY` | No | api, worker | Enable auto-reply feature. Default: `false` |
| `FEATURE_TRENDS` | No | api, worker | Enable trend engine. Default: `false` |

---

## Environment Files

### .env.example (committed to git)

```env
# Application
NODE_ENV=development
PORT=4000
APP_URL=http://localhost:3000
API_URL=http://localhost:4000
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aisocialos_dev

# Redis
REDIS_URL=redis://localhost:6379

# Auth
SESSION_SECRET=your-session-secret-min-32-chars-here
TOKEN_ENCRYPTION_KEY=generate-with-openssl-rand-hex-32

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/oauth/google/callback

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:4000/api/auth/oauth/github/callback

# LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_CALLBACK_URL=http://localhost:4000/api/social-accounts/linkedin/callback

# AI
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Email
RESEND_API_KEY=

# Stripe (Phase 3+)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Monitoring (Optional)
SENTRY_DSN=
```

### Environments

| Environment | Purpose | Database | Redis |
|------------|---------|----------|-------|
| `development` | Local development | Local PostgreSQL | Local Redis |
| `staging` | Pre-production testing | Neon (staging branch) | Upstash (staging) |
| `production` | Live users | Neon (main branch) | Upstash (production) |

---

## Environment Validation

On application startup, validate all required environment variables:

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.string().transform(Number).default('4000'),
  APP_URL: z.string().url(),
  API_URL: z.string().url(),
  DATABASE_URL: z.string().startsWith('postgresql://'),
  REDIS_URL: z.string(),
  SESSION_SECRET: z.string().min(32),
  TOKEN_ENCRYPTION_KEY: z.string().length(64), // 32 bytes in hex
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
  RESEND_API_KEY: z.string(),
  LINKEDIN_CLIENT_ID: z.string(),
  LINKEDIN_CLIENT_SECRET: z.string(),
  LINKEDIN_CALLBACK_URL: z.string().url(),
});

// Validates on startup — throws descriptive error if missing/invalid
export const env = envSchema.parse(process.env);
```

---

## Secret Rotation

### Rotation Schedule

| Secret | Rotation Frequency | Process |
|--------|-------------------|---------|
| `SESSION_SECRET` | Quarterly | Rotate, old sessions remain valid until expiry |
| `TOKEN_ENCRYPTION_KEY` | Annually | Dual-key period, re-encrypt tokens |
| `OPENAI_API_KEY` | On compromise only | Regenerate in OpenAI dashboard |
| `DATABASE_URL` | On compromise only | Rotate password in database provider |
| OAuth client secrets | On compromise only | Regenerate in platform developer portal |

### Key Rotation Process (TOKEN_ENCRYPTION_KEY)
1. Generate new key: `TOKEN_ENCRYPTION_KEY_NEW`
2. Deploy code that tries new key first, falls back to old key for decryption
3. Run background job to re-encrypt all tokens with new key
4. Once all tokens re-encrypted, remove old key
5. Rename new key variable to `TOKEN_ENCRYPTION_KEY`
