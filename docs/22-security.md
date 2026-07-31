# Security

## Overview

Security is a foundational concern for AI Social OS. The platform stores sensitive OAuth tokens, personal data, and business content. This document covers security measures at every layer.

---

## Security Headers (Helmet.js)

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],  // Tailwind needs inline
      imgSrc: ["'self'", "data:", "https:"],     // External avatars
      connectSrc: ["'self'", "https://api.aisocialos.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-site" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
}));
```

---

## Rate Limiting

### Strategy

Multiple layers of rate limiting:

**Global Rate Limit** (all endpoints):
```typescript
app.use(rateLimit({
  windowMs: 60 * 1000,    // 1 minute
  max: 100,               // 100 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: { code: 'RATE_LIMIT', message: 'Too many requests' }
    });
  }
}));
```

**Auth Endpoint Rate Limit** (stricter):
```typescript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 attempts
  skipSuccessfulRequests: true // Only count failures
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

**AI Generation Rate Limit** (per user):
```typescript
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 5,                 // 5 generations per minute
  keyGenerator: (req) => req.userId  // Per user, not per IP
});
app.use('/api/ai/generate', aiLimiter);
```

### DDoS Mitigation
- Cloudflare or similar CDN in front of API
- IP-based blocking for abusive patterns
- Request size limit: 1MB body maximum
- Timeout: 30 seconds for all requests

---

## Input Validation

### Zod Validation Middleware

```typescript
function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    
    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details: result.error.issues.map(i => ({
            field: i.path.join('.'),
            message: i.message
          }))
        }
      });
    }
    
    req.validated = result.data;
    next();
  };
}
```

### Validation Rules
- All user input validated before processing
- String lengths enforced (max limits on all text fields)
- Enum values strictly checked
- UUIDs validated format
- URLs validated format
- Dates validated as valid ISO timestamps
- Arrays have maximum length limits
- Nested objects validated recursively
- No unrecognized fields allowed (strict mode)

---

## SQL Injection Prevention

### Prisma ORM Protection
Prisma uses parameterized queries by default:

```typescript
// Safe — Prisma parameterizes this
const user = await prisma.user.findUnique({
  where: { email: userInput }
});

// Safe — Prisma handles escaping
const posts = await prisma.post.findMany({
  where: {
    content: { contains: searchInput }
  }
});
```

### Raw Query Safety
If raw SQL is ever needed (rare), always use parameterized queries:

```typescript
// Safe — parameterized
const result = await prisma.$queryRaw`
  SELECT * FROM posts WHERE user_id = ${userId}
`;

// NEVER do this:
// const result = await prisma.$queryRawUnsafe(`SELECT * FROM posts WHERE user_id = '${userId}'`);
```

---

## XSS Prevention

### Output Encoding
- React automatically escapes all rendered content (JSX)
- `dangerouslySetInnerHTML` is never used
- User content displayed as text, never as HTML
- CSP headers prevent inline script execution

### Input Sanitization
- Strip HTML tags from all text inputs on the server
- Validate URLs to prevent `javascript:` protocol
- Sanitize file names for uploads
- Escape special characters in notification emails

---

## CSRF Protection

### Strategy
- SameSite=Lax cookies (primary protection)
- All state-changing requests use POST/PATCH/DELETE (not GET)
- Origin header validation for sensitive endpoints
- State parameter in OAuth flows

### OAuth CSRF
```
State token generated before OAuth redirect:
1. Generate random state: crypto.randomBytes(32).toString('hex')
2. Store in Redis with 10-minute TTL: state:{token} → userId
3. Include in OAuth authorization URL
4. Validate on callback: state matches stored value
5. Delete after use (one-time use)
```

---

## OAuth Token Security

### Encryption at Rest
All OAuth tokens encrypted before database storage:

```
Algorithm: AES-256-GCM
Key: 32-byte key from environment variable
IV: Random 16 bytes per encryption (stored with ciphertext)
Auth Tag: 16 bytes (ensures integrity)

Storage format: base64(iv):base64(authTag):base64(ciphertext)
```

### Token Handling Rules
1. Never log tokens (Pino redaction configured)
2. Never return tokens in API responses
3. Never store tokens in frontend
4. Decrypt only when needed for API calls
5. Re-encrypt immediately after token refresh
6. Key rotation plan: new key encrypts new tokens, old key decrypts old ones

---

## Authentication Security

### Password Storage
- Algorithm: bcrypt
- Cost factor: 12 rounds
- Passwords never logged or returned in responses
- Password comparison uses constant-time function

### Session Security
- Session IDs: 256-bit cryptographically random
- Stored in HTTP-only, Secure, SameSite=Lax cookies
- Session rotation on privilege escalation
- Absolute session timeout: 30 days (remember me) or 24 hours
- Idle timeout: 2 hours without activity (configurable)
- Concurrent session limit: 10 per user

### Token Generation
- Email verification: crypto.randomBytes(32)
- Password reset: crypto.randomBytes(32)
- All tokens hashed before storage (SHA-256)
- One-time use: deleted after verification
- Time-limited: 24h for email verification, 1h for password reset

---

## Data Protection

### Sensitive Data Classification

| Data | Classification | Protection |
|------|---------------|-----------|
| Passwords | Critical | Bcrypt hashed, never stored plain |
| OAuth tokens | Critical | AES-256-GCM encrypted |
| Session tokens | High | HTTP-only cookies, Redis TTL |
| Email addresses | Medium | Not publicly exposed |
| Post content | Medium | User-isolated, access controlled |
| Analytics data | Low | User-isolated |

### Data Isolation
- All queries include `userId` filter (enforced at repository layer)
- No endpoint returns other users' data
- Admin endpoints (future) require separate authentication

### Data Deletion (GDPR)
When user deletes account:
1. Immediately: revoke all sessions, disconnect OAuth
2. Within 24 hours: delete all user content (posts, comments, memories)
3. Within 24 hours: delete all analytics data
4. Within 24 hours: remove from all queues
5. Keep: anonymized aggregate metrics (for system improvement)
6. Soft-delete user record for 30 days (recovery window)
7. After 30 days: hard delete user record

---

## API Security

### CORS Configuration

```typescript
app.use(cors({
  origin: [
    'https://app.aisocialos.com',
    process.env.NODE_ENV === 'development' && 'http://localhost:3000'
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // Cache preflight for 24 hours
}));
```

### Request Size Limits
```typescript
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
```

### Request ID Tracking
```typescript
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || nanoid();
  res.setHeader('X-Request-Id', req.id);
  next();
});
```

---

## Logging Security

### Sensitive Field Redaction (Pino)

```typescript
const logger = pino({
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
      'req.body.refreshToken',
      'req.body.accessToken',
      '*.password',
      '*.token',
      '*.secret',
      '*.accessToken',
      '*.refreshToken'
    ],
    censor: '[REDACTED]'
  }
});
```

### Audit Logging
Security events logged for audit:
- Login success/failure (IP, user agent)
- OAuth connections/disconnections
- Password changes
- Session revocations
- Account deletions
- Failed authorization attempts

---

## Dependency Security

### Vulnerability Scanning
- `pnpm audit` in CI pipeline
- Dependabot/Renovate for automated updates
- Critical vulnerabilities block deployment
- Weekly review of security advisories

### Supply Chain Security
- Lock files committed (`pnpm-lock.yaml`)
- Exact version pinning for production dependencies
- Review new dependencies before adding
- Prefer well-maintained packages with security track record
- No `postinstall` scripts from untrusted packages

---

## Infrastructure Security

### Environment Variables
- Never committed to git
- Stored in platform secrets (Railway, Vercel)
- Rotated quarterly (or immediately if compromised)
- Different values per environment (dev, staging, production)

### Network Security
- All traffic over HTTPS (TLS 1.3)
- Database accepts connections only from application servers
- Redis not publicly accessible (private network)
- API not directly exposed (behind CDN/proxy)

### Secrets Management
```
Required secrets:
  DATABASE_URL          — PostgreSQL connection string
  REDIS_URL             — Redis connection string
  TOKEN_ENCRYPTION_KEY  — 32-byte hex key for OAuth token encryption
  SESSION_SECRET        — Session signing secret
  LINKEDIN_CLIENT_SECRET — LinkedIn OAuth secret
  OPENAI_API_KEY        — OpenAI API key
  ANTHROPIC_API_KEY     — Anthropic API key
  RESEND_API_KEY        — Email service key
  STRIPE_SECRET_KEY     — Stripe payment key
  STRIPE_WEBHOOK_SECRET — Stripe webhook verification
```

---

## Security Checklist (Pre-Launch)

- [ ] All endpoints require authentication (except public routes)
- [ ] Rate limiting configured and tested
- [ ] Input validation on all endpoints
- [ ] OAuth tokens encrypted at rest
- [ ] HTTPS enforced (HSTS headers)
- [ ] CORS restricted to known origins
- [ ] CSP headers configured
- [ ] Sensitive data redacted from logs
- [ ] Password hashing verified (bcrypt, 12 rounds)
- [ ] Session security reviewed (HTTP-only, Secure, SameSite)
- [ ] SQL injection impossible (Prisma parameterized queries)
- [ ] XSS prevented (React escaping, CSP, no dangerouslySetInnerHTML)
- [ ] CSRF mitigated (SameSite cookies, state parameters)
- [ ] File upload validation (if applicable)
- [ ] Error messages don't leak internal details
- [ ] Dependency audit clean (no known vulnerabilities)
- [ ] Environment variables documented and secured
- [ ] Account deletion flow tested (GDPR)
- [ ] Data access is user-isolated
- [ ] Admin access is separate from user access
