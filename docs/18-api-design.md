# API Design

## Overview

AI Social OS exposes a RESTful JSON API used by the Next.js frontend. The API follows consistent conventions for requests, responses, authentication, error handling, and pagination.

---

## Base URL

```
Development: http://localhost:4000/api
Production: https://api.aisocialos.com/api
```

---

## Conventions

### Request Format
- Content-Type: `application/json`
- All request bodies are JSON
- Query parameters for filtering, sorting, pagination
- Path parameters for resource identifiers

### Response Envelope

All responses follow a consistent envelope:

**Success Response**:
```json
{
  "data": { ... },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-08-01T10:00:00Z"
  }
}
```

**List Response (with pagination)**:
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-08-01T10:00:00Z"
  }
}
```

**Error Response**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-08-01T10:00:00Z"
  }
}
```

### HTTP Methods

| Method | Usage |
|--------|-------|
| GET | Read resource(s) |
| POST | Create resource or trigger action |
| PATCH | Partial update |
| PUT | Full replace (rare) |
| DELETE | Remove resource |

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success (GET, PATCH, PUT) |
| 201 | Created (POST that creates) |
| 204 | No content (DELETE) |
| 400 | Validation error |
| 401 | Not authenticated |
| 403 | Not authorized (plan limit, permission) |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 422 | Unprocessable (business rule violation) |
| 429 | Rate limited |
| 500 | Internal server error |
| 502 | External service error |
| 503 | Service unavailable |

---

## Authentication

All endpoints except public marketing and auth endpoints require authentication.

### Session Cookie
```
Cookie: session_id=sess_abc123xyz
```

### Authorization Header (API access - future)
```
Authorization: Bearer {api_token}
```

### Unauthenticated Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/verify-email`
- `GET /api/auth/oauth/:provider`
- `GET /api/auth/oauth/:provider/callback`
- `GET /api/health`

---

## Complete Endpoint Reference

### Auth Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register new account |
| POST | /api/auth/login | Login with email/password |
| POST | /api/auth/logout | End session |
| POST | /api/auth/forgot-password | Request password reset |
| POST | /api/auth/reset-password | Reset password with token |
| POST | /api/auth/verify-email | Verify email with token |
| GET | /api/auth/oauth/:provider | Start OAuth flow |
| GET | /api/auth/oauth/:provider/callback | OAuth callback |
| GET | /api/auth/session | Get current session info |
| DELETE | /api/auth/sessions/:id | Revoke specific session |

### User Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/users/me | Get current user profile |
| PATCH | /api/users/me | Update profile |
| PATCH | /api/users/me/password | Change password |
| DELETE | /api/users/me | Delete account |
| GET | /api/users/me/usage | Get plan usage stats |

### Social Account Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/social-accounts | List connected accounts |
| GET | /api/social-accounts/:id | Get account details |
| GET | /api/social-accounts/:platform/auth | Start platform OAuth |
| GET | /api/social-accounts/:platform/callback | Platform OAuth callback |
| DELETE | /api/social-accounts/:id | Disconnect account |
| POST | /api/social-accounts/:id/refresh | Force token refresh |

### Post Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/posts | List posts (filtered) |
| POST | /api/posts | Create post |
| GET | /api/posts/:id | Get single post |
| PATCH | /api/posts/:id | Update post |
| DELETE | /api/posts/:id | Delete post |
| POST | /api/posts/:id/schedule | Schedule post |
| POST | /api/posts/:id/unschedule | Unschedule (back to draft) |
| POST | /api/posts/:id/publish | Publish immediately |
| POST | /api/posts/:id/retry | Retry failed publish |
| PATCH | /api/posts/:id/autosave | Auto-save draft content |
| GET | /api/posts/calendar | Get posts for calendar view |
| POST | /api/posts/bulk/schedule | Bulk schedule |
| POST | /api/posts/bulk/delete | Bulk delete |

### AI Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/ai/generate | Generate content |
| POST | /api/ai/improve | Improve existing content |
| POST | /api/ai/hashtags | Generate hashtags |
| POST | /api/ai/reply | Generate reply for comment |
| GET | /api/ai/usage | Get AI usage stats for billing period |

### Brand Memory Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/brand-memory | Get brand memory profile |
| PATCH | /api/brand-memory/voice-config | Update voice settings |
| PUT | /api/brand-memory/pillars | Update content pillars |
| POST | /api/brand-memory/feedback | Submit generation feedback |
| POST | /api/brand-memory/reanalyze | Trigger re-analysis |
| DELETE | /api/brand-memory | Reset brand memory |

### Analytics Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/analytics/overview | Dashboard overview metrics |
| GET | /api/analytics/posts | Post performance metrics |
| GET | /api/analytics/growth | Follower growth data |
| GET | /api/analytics/top-content | Best performing posts |
| GET | /api/analytics/optimal-times | Best times to post |
| GET | /api/analytics/reports | List weekly reports |
| GET | /api/analytics/reports/:id | Get specific report |
| GET | /api/analytics/export | Export analytics as CSV |

### Comment Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/comments | Get comment inbox |
| GET | /api/comments/:id | Get comment detail |
| POST | /api/comments/:id/suggestions | Get AI reply suggestions |
| POST | /api/comments/:id/reply | Send reply |
| POST | /api/comments/:id/dismiss | Dismiss comment |
| POST | /api/comments/bulk/reply | Bulk reply |
| GET | /api/comments/analytics | Comment engagement stats |

### Trend Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/trends | Get active trends |
| POST | /api/trends/:id/generate | Generate content from trend |
| POST | /api/trends/:id/dismiss | Dismiss trend |
| GET | /api/trends/competitors | Get competitor list |
| POST | /api/trends/competitors | Add competitors |
| DELETE | /api/trends/competitors/:id | Remove competitor |
| GET | /api/trends/competitors/insights | Get competitor insights |

### Notification Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/notifications | Get notifications |
| GET | /api/notifications/unread-count | Get unread count |
| PATCH | /api/notifications/:id/read | Mark as read |
| POST | /api/notifications/mark-all-read | Mark all as read |
| GET | /api/notifications/preferences | Get preferences |
| PUT | /api/notifications/preferences | Update preferences |

### Scheduler Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/scheduler/optimal-times | Get AI-suggested times |
| GET | /api/scheduler/queue | Get current queue |
| POST | /api/scheduler/pause | Pause all scheduling |
| POST | /api/scheduler/resume | Resume scheduling |
| GET | /api/scheduler/slots | Get configured time slots |
| PUT | /api/scheduler/slots | Update time slot preferences |

### Billing Endpoints (Phase 3+)

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/billing/plan | Get current plan |
| POST | /api/billing/checkout | Create Stripe checkout session |
| POST | /api/billing/portal | Create Stripe portal session |
| POST | /api/billing/webhook | Stripe webhook handler |
| GET | /api/billing/invoices | List invoices |

### System Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| GET | /api/health/detailed | Detailed health (internal) |

---

## Rate Limiting

### Limits by Plan

| Plan | Requests/min | Requests/hour |
|------|-------------|---------------|
| Free | 30 | 500 |
| Pro | 60 | 2000 |
| Business | 120 | 5000 |
| Agency | 200 | 10000 |

### Rate Limit Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 55
X-RateLimit-Reset: 1690900000
```

### Rate Limit Response (429)

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retryAfter": 45,
      "limit": 60,
      "window": "1 minute"
    }
  }
}
```

---

## Pagination

### Offset Pagination (default)

```
GET /api/posts?page=2&limit=20

Response includes:
{
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": true
  }
}
```

### Cursor Pagination (for real-time feeds)

```
GET /api/notifications?cursor=notif_abc123&limit=20

Response includes:
{
  "pagination": {
    "nextCursor": "notif_xyz789",
    "hasMore": true
  }
}
```

---

## Filtering & Sorting

### Filter Syntax

```
GET /api/posts?status=draft,scheduled&platform=linkedin&from=2026-08-01&to=2026-08-31
```

### Sort Syntax

```
GET /api/posts?sort=createdAt:desc
GET /api/posts?sort=scheduledAt:asc
GET /api/analytics/posts?sort=engagement:desc
```

### Search

```
GET /api/posts?search=productivity+tips
```

Full-text search on content field using PostgreSQL tsvector (if performance needed).

---

## Validation

All request inputs validated with Zod schemas:

```typescript
// Example: Create post schema
const createPostSchema = z.object({
  content: z.string().min(1).max(25000),
  platform: z.enum(['linkedin', 'twitter', 'instagram', 'facebook', 'threads']),
  socialAccountId: z.string().uuid().optional(),
  scheduledAt: z.string().datetime().optional(),
  mediaUrls: z.array(z.string().url()).max(9).optional(),
  hashtags: z.array(z.string()).max(30).optional(),
  metadata: z.record(z.unknown()).optional()
});
```

Validation errors return:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "content", "message": "String must contain at least 1 character(s)" },
      { "field": "platform", "message": "Invalid enum value" }
    ]
  }
}
```

---

## Versioning Strategy

### Current: No versioning prefix
- API is v1 by default
- Breaking changes handled through feature flags and gradual migration

### Future: URL prefix when needed
```
/api/v2/posts
```

Only introduce versioning when breaking changes are unavoidable. Prefer additive changes (new fields, new endpoints) over breaking changes.
