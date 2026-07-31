# System Architecture

## Overview

AI Social OS follows a **Clean Architecture** pattern with a monorepo structure. The system is designed for horizontal scalability, fault tolerance, and clear separation of concerns.

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                              │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Next.js Frontend (apps/web)                      │ │
│  │  Pages → Components → Hooks → TanStack Query → API Client    │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │            Express.js API Server (apps/api)                   │ │
│  │                                                               │ │
│  │  Routes → Controllers → Services → Repositories → Database   │ │
│  │                                                               │ │
│  │  Middleware: Auth │ Validation │ RateLimit │ Logging │ CORS   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                    │                        │
                    ▼                        ▼
┌──────────────────────────┐   ┌──────────────────────────────────┐
│      DATA LAYER          │   │         WORKER LAYER              │
│                          │   │                                    │
│  ┌────────────────────┐  │   │  ┌────────────────────────────┐  │
│  │   PostgreSQL        │  │   │  │   BullMQ Workers (apps/worker)│
│  │   (Primary DB)      │  │   │  │                              │
│  └────────────────────┘  │   │  │  • Publish Worker             │
│                          │   │  │  • Analytics Worker            │
│  ┌────────────────────┐  │   │  │  • Trend Worker               │
│  │   Redis             │  │   │  │  • Comment Worker             │
│  │   (Cache + Queues)  │  │   │  │  • Notification Worker        │
│  └────────────────────┘  │   │  │  • AI Worker                   │
│                          │   │  └────────────────────────────────┘
└──────────────────────────┘   └──────────────────────────────────┘
                                          │
                                          ▼
                              ┌────────────────────────┐
                              │    EXTERNAL SERVICES    │
                              │                        │
                              │  • LinkedIn API        │
                              │  • X (Twitter) API     │
                              │  • OpenAI API          │
                              │  • Anthropic API       │
                              │  • Resend (Email)      │
                              │  • Stripe (Payments)   │
                              └────────────────────────┘
```

## Architecture Principles

### 1. Clean Architecture
The system follows Clean Architecture (Ports & Adapters) with clear dependency rules:

```
Controllers → Services → Repositories → Database
     ↓             ↓            ↓
  Validation    Business     Data Access
  HTTP Logic    Logic        Prisma/SQL
```

**Dependency Rule**: Inner layers never depend on outer layers. Services don't know about HTTP. Repositories don't know about business rules.

### 2. Feature-First Organization
Code is organized by feature/domain rather than by technical layer:

```
src/
  features/
    auth/
      auth.controller.ts
      auth.service.ts
      auth.repository.ts
      auth.routes.ts
      auth.schema.ts
      auth.types.ts
    posts/
      posts.controller.ts
      posts.service.ts
      posts.repository.ts
      ...
```

### 3. Repository Pattern
All database access goes through repository classes:
- Repositories encapsulate Prisma queries
- Services never call Prisma directly
- Enables easy testing with mock repositories
- Enables future database migration without service changes

### 4. Service Layer
Business logic lives exclusively in services:
- Services orchestrate multiple repositories
- Services handle complex business rules
- Services are framework-agnostic (no Express, no HTTP concepts)
- Services can call other services

### 5. Controller Layer
Controllers handle HTTP concerns only:
- Parse request (params, query, body)
- Call appropriate service method
- Format HTTP response
- Handle HTTP error codes

### 6. Dependency Injection
Services and repositories are instantiated via a DI container:
- Enables easy testing (inject mocks)
- Manages singleton vs transient lifecycles
- Clear dependency graph

## Application Architecture

### apps/web (Frontend)
```
Next.js App Router
├── app/                    # Pages and layouts
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (dashboard)/       # Protected dashboard pages
│   └── (marketing)/       # Public marketing pages
├── components/            # Shared React components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities, API client
├── stores/                # Client state (Zustand if needed)
└── styles/                # Global styles, Tailwind config
```

**Key Patterns**:
- Server components by default, client components when interactive
- TanStack Query for all server state management
- React Hook Form + Zod for form handling
- Optimistic updates for better UX
- Suspense boundaries for loading states

### apps/api (Backend)
```
Express.js Server
├── src/
│   ├── features/          # Feature modules
│   │   ├── auth/
│   │   ├── posts/
│   │   ├── social-accounts/
│   │   ├── scheduler/
│   │   ├── analytics/
│   │   ├── ai/
│   │   ├── comments/
│   │   ├── notifications/
│   │   ├── trends/
│   │   └── users/
│   ├── middleware/        # Express middleware
│   ├── lib/              # Shared utilities
│   ├── config/           # Configuration
│   └── server.ts         # Server entry point
```

**Key Patterns**:
- Feature modules are self-contained
- Each feature exports its router
- Middleware handles cross-cutting concerns
- Zod schemas validate all inputs
- Structured error handling with error classes

### apps/worker (Background Workers)
```
BullMQ Worker Processes
├── src/
│   ├── workers/           # Worker definitions
│   │   ├── publish.worker.ts
│   │   ├── analytics.worker.ts
│   │   ├── trend.worker.ts
│   │   ├── comment.worker.ts
│   │   ├── notification.worker.ts
│   │   └── ai.worker.ts
│   ├── queues/            # Queue definitions
│   ├── jobs/              # Job processors
│   └── index.ts          # Worker entry point
```

**Key Patterns**:
- Each worker processes a specific queue
- Jobs are idempotent (safe to retry)
- Dead letter queue for failed jobs
- Configurable concurrency per worker
- Graceful shutdown handling

## Data Flow Patterns

### Synchronous Request Flow
```
Client → API Gateway → Controller → Service → Repository → Database
                                        ↓
                                   Response builds back up
```

### Asynchronous Job Flow
```
Client → API → Service → Queue (Redis/BullMQ)
                                    ↓
                              Worker picks up job
                                    ↓
                              Processes job
                                    ↓
                              Updates database
                                    ↓
                              Sends notification (optional)
```

### AI Content Generation Flow
```
Client → POST /api/posts/generate
              ↓
         Controller validates input
              ↓
         AI Service called
              ↓
         Fetch brand memory for user
              ↓
         Build prompt (system + user + context)
              ↓
         Call OpenAI/Claude API
              ↓
         Parse and format response
              ↓
         Return variants to client
```

### Post Publishing Flow
```
Scheduler Worker (runs every 30 seconds)
         ↓
    Query: posts WHERE scheduledAt <= NOW AND status = 'scheduled'
         ↓
    For each post:
         ↓
    Fetch user's OAuth token → Validate/Refresh
         ↓
    Call platform API (LinkedIn/X)
         ↓
    On success: update status, notify, queue analytics
    On failure: retry with backoff OR mark failed
```

## Scalability Architecture

### Horizontal Scaling
```
                    Load Balancer
                   /      |      \
              API-1    API-2    API-3
                 \       |       /
                  Shared Database
                  Shared Redis
```

- API servers are stateless (sessions in Redis)
- Workers scale independently based on queue depth
- Database uses connection pooling (PgBouncer)
- Read replicas for analytics queries (future)

### Caching Strategy
```
Request → Check Redis Cache → Cache Hit → Return cached
                ↓ Cache Miss
         Query Database
                ↓
         Store in Redis (with TTL)
                ↓
         Return to client
```

**Cached Data**:
- User sessions (TTL: 24 hours)
- Social account tokens (TTL: until expiry)
- Analytics aggregates (TTL: 5 minutes)
- AI brand memory (TTL: 1 hour)
- Rate limit counters (TTL: window size)

### Queue Architecture
```
Redis (BullMQ)
├── publish-queue        # Posts to publish
├── analytics-queue      # Analytics data to fetch
├── trend-queue          # Trend analysis jobs
├── comment-queue        # Comment fetch/reply jobs
├── notification-queue   # Notifications to send
├── ai-queue            # AI processing jobs
└── dead-letter-queue   # Failed jobs for inspection
```

## Error Handling Architecture

### Error Classification
```
Application Errors (4xx)
├── ValidationError (400)
├── AuthenticationError (401)
├── AuthorizationError (403)
├── NotFoundError (404)
├── ConflictError (409)
└── RateLimitError (429)

System Errors (5xx)
├── InternalError (500)
├── ExternalServiceError (502)
├── ServiceUnavailableError (503)
└── TimeoutError (504)
```

### Error Flow
```
Error occurs → Caught by service/controller
      ↓
Classified into error type
      ↓
Logged with context (Pino structured logging)
      ↓
HTTP response formatted (consistent error envelope)
      ↓
Client receives: { error: { code, message, details? } }
```

## Monitoring & Observability

### Logging (Pino)
- Structured JSON logs
- Request ID correlation
- Log levels: trace, debug, info, warn, error, fatal
- Sensitive data redaction

### Health Checks
```
GET /health
├── API server status
├── Database connectivity
├── Redis connectivity
├── Worker queue health
└── External service status (degraded mode detection)
```

### Metrics (Future)
- Request rate and latency (p50, p95, p99)
- Error rates by type
- Queue depth and processing time
- AI API latency and token usage
- Business metrics (posts published, AI generations)

## Security Architecture

See `22-security.md` for full details. Key architectural decisions:

- All tokens encrypted at rest (AES-256-GCM)
- OAuth tokens stored in database, never in client
- Session tokens in HTTP-only secure cookies
- Rate limiting at API gateway level
- Input validation on every endpoint (Zod)
- CORS restricted to known origins
- Helmet.js for security headers
- SQL injection prevented by Prisma's parameterized queries
