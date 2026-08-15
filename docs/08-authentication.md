# Authentication

## Overview

AI Social OS uses **Better Auth** as the authentication framework. Authentication is completely separate from social account connections. Users authenticate with ConnectUs (AI Social OS), and then connect social platforms as a secondary step.

**Key principle**: LinkedIn is NOT an authentication provider. LinkedIn is a connected social account. Users always authenticate with ConnectUs first.

---

## Authentication Providers

### Phase 1
- Email + Password

### Future
- Google Login
- GitHub Login
- Apple Login
- Microsoft Login

---

## Better Auth Integration

### How Better Auth Works with Express

Better Auth provides a complete authentication solution that integrates with our Express backend:

1. **Server-side**: Better Auth instance created with database adapter (Prisma)
2. **API handler**: Better Auth handles `/api/auth/*` routes
3. **Middleware**: Auth middleware extracts session from request
4. **Client-side**: Better Auth client hooks for React

### Better Auth Configuration

```typescript
// Conceptual configuration
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

const auth = betterAuth({
  database: prismaAdapter(prisma),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24 // 1 day (refresh threshold)
  }
});
```

### Sessions

- Better Auth manages sessions automatically
- Sessions stored in database (via Prisma adapter)
- Session token sent as HTTP-only cookie
- Session validated on every authenticated request

### Access Tokens & Refresh Tokens

- Better Auth handles token lifecycle
- Access token: short-lived, used for API requests
- Refresh token: long-lived, used to get new access tokens
- Tokens stored as HTTP-only, Secure, SameSite=Lax cookies
- Token rotation on refresh (old refresh token invalidated)

### Cookies

- `better-auth.session_token`: session cookie
- HTTP-only: true (not accessible via JavaScript)
- Secure: true in production (HTTPS only)
- SameSite: Lax (CSRF protection)
- Path: /

### Middleware

```typescript
// Auth middleware for protected routes
async function authMiddleware(req, res, next) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  }
  req.user = session.user;
  req.session = session.session;
  next();
}
```

### Protected Routes

```typescript
// Apply auth middleware to protected routes
router.use('/api/posts', authMiddleware, postsRouter);
router.use('/api/social-accounts', authMiddleware, socialAccountsRouter);
router.use('/api/ai', authMiddleware, aiRouter);
```

### Database Tables (Better Auth managed)

Better Auth creates and manages these tables:

- **user**: id, name, email, emailVerified, image, createdAt, updatedAt
- **session**: id, expiresAt, token, createdAt, updatedAt, ipAddress, userAgent, userId
- **account**: id, accountId, providerId, userId, accessToken, refreshToken, idToken, accessTokenExpiresAt, refreshTokenExpiresAt, scope, password, createdAt, updatedAt
- **verification**: id, identifier, value, expiresAt, createdAt, updatedAt

### Client Hooks (Frontend)

```typescript
// Better Auth React client
import { createAuthClient } from 'better-auth/react';

const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL
});

// Usage in components
const { data: session, isPending } = authClient.useSession();
```

### Server Hooks (Backend)

```typescript
// Hooks for custom logic on auth events
const auth = betterAuth({
  // ...
  hooks: {
    after: [
      {
        matcher: (context) => context.path === '/sign-up',
        handler: async (ctx) => {
          // Custom logic after registration
          // e.g., create default user settings, send welcome email
        }
      }
    ]
  }
});
```

---

## Email + Password Authentication

### Register

```
POST /api/auth/sign-up/email

Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}

Flow:
1. Validate input (name, email format, password strength)
2. Check email not already registered
3. Hash password (Better Auth handles this)
4. Create user record
5. Generate 6-digit OTP for email verification
6. Store OTP (expires in 10 minutes)
7. Send OTP via email (or print to terminal in dev mode)
8. Return success (user created, needs verification)
```

### Login

```
POST /api/auth/sign-in/email

Request Body:
{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Flow:
1. Validate credentials
2. Check email is verified
3. Create session
4. Set session cookie
5. Return user data + session
```

### Logout

```
POST /api/auth/sign-out

Flow:
1. Invalidate session
2. Clear session cookie
3. Return success
```

### Forgot Password

```
POST /api/auth/forget-password

Request Body:
{
  "email": "john@example.com"
}

Flow:
1. Find user by email
2. Generate password reset token
3. Send reset link via email (or print in dev mode)
4. Return success (always, even if email not found)
```

### Reset Password

```
POST /api/auth/reset-password

Request Body:
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass456"
}

Flow:
1. Validate token (not expired, not used)
2. Validate new password strength
3. Update password hash
4. Invalidate all existing sessions
5. Return success
```

---

## Email Verification (OTP)

### Production Mode (Nodemailer)

```
Flow:
1. User registers
2. Generate 6-digit OTP
3. Store OTP in database (expires in 10 minutes)
4. Send email via Nodemailer with OTP
5. User enters OTP in frontend
6. Backend verifies OTP
7. Mark email as verified
8. User can now login
```

### Development Mode (No SMTP Required)

Until SMTP is configured, development mode provides a frictionless workflow:

```
Flow:
1. User registers
2. Generate 6-digit OTP
3. Store OTP in database
4. Print OTP to terminal console: "[DEV] OTP for john@example.com: 123456"
5. Return OTP in API response (ONLY in development mode)
6. Frontend auto-fills or developer copies from terminal
7. Verify OTP
8. Account activated
```

**Development mode rules**:
- Enabled when `NODE_ENV=development`
- OTP printed to console with clear `[DEV]` prefix
- OTP included in registration response body
- In production: OTP is NEVER returned in response, only sent via email
- This is a temporary bridge until Nodemailer is configured

### OTP Verification Endpoint

```
POST /api/auth/verify-email

Request Body:
{
  "email": "john@example.com",
  "otp": "123456"
}

Flow:
1. Find OTP record for email
2. Check not expired (10 minute window)
3. Check attempts < 5 (rate limit)
4. Compare OTP
5. If valid: mark email verified, delete OTP record
6. If invalid: increment attempts
```

---

## Seed User Script

For development without email verification flow:

```bash
pnpm seed:user
```

**Script behavior**:
- Creates a test user with pre-verified email
- Hashes password using Better Auth's password hashing
- Skips if user already exists (idempotent)
- Prints credentials to terminal

**Output**:
```
[SEED] Test user created:
  Email: test@connectus.dev
  Password: Password123
  Status: Email verified, ready to login
```

---

## Session Management

### Session Lifecycle

```
Created:   On successful login
Validated: On every authenticated request (middleware checks cookie)
Extended:  Automatically by Better Auth (sliding window)
Expired:   After maxAge (7 days default)
Revoked:   On logout, password change, or manual revocation
```

### Route Protection (Frontend)

```typescript
// Middleware in Next.js
export function middleware(request: NextRequest) {
  const session = request.cookies.get('better-auth.session_token');
  
  const protectedPaths = ['/dashboard', '/posts', '/settings', '/analytics'];
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p));
  
  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  const authPaths = ['/login', '/register'];
  const isAuthPage = authPaths.some(p => request.nextUrl.pathname.startsWith(p));
  
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
}
```

---

## Security Measures

- Passwords hashed by Better Auth (bcrypt/argon2)
- Rate limiting on auth endpoints (5 attempts / 15 min)
- OTP rate limiting (5 verification attempts per OTP)
- Session cookies: HTTP-only, Secure, SameSite=Lax
- CSRF protection via SameSite cookies
- Account lockout after repeated failures
- Generic error messages ("Invalid credentials" — never reveal which field is wrong)
