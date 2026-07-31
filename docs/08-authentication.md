# Authentication & Authorization

## Overview

AI Social OS uses **Better Auth** as its authentication framework, providing session-based authentication with JWT tokens for API access. The system supports email/password registration and OAuth providers (Google, GitHub) for login, plus LinkedIn OAuth specifically for platform integration.

---

## Authentication Strategy

### Session-Based Auth (Primary)
- User logs in → server creates session → session ID stored in HTTP-only cookie
- Every request sends session cookie → server validates session → identifies user
- Sessions stored in Redis for fast lookup with PostgreSQL as persistent backup

### JWT Tokens (API Access)
- For programmatic API access (future API tier)
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days)
- Stored securely, never exposed to client-side JavaScript

---

## Registration Flow

### Email/Password Registration

```
1. Client sends POST /api/auth/register
   Body: { email, password, name }

2. Server validates:
   - Email format (Zod)
   - Password strength (min 8 chars, 1 uppercase, 1 number)
   - Email not already registered

3. Server creates user:
   - Hash password with bcrypt (12 rounds)
   - Store user in database
   - Generate email verification token (crypto.randomBytes(32))
   - Store hashed token in email_verification_tokens table

4. Send verification email:
   - Link: {APP_URL}/verify-email?token={raw_token}
   - Token expires in 24 hours

5. Return success response (user can log in but has limited access until verified)
```

### Email Verification

```
1. User clicks verification link
2. Client sends POST /api/auth/verify-email
   Body: { token }

3. Server validates:
   - Hash incoming token
   - Find matching record in email_verification_tokens
   - Check not expired
   - Check not already used

4. Server updates:
   - Set user.email_verified = true
   - Set user.email_verified_at = now()
   - Mark token as used

5. Redirect to dashboard with success message
```

### OAuth Registration (Google/GitHub)

```
1. Client redirects to GET /api/auth/oauth/{provider}
2. Server redirects to provider's authorization URL with:
   - client_id
   - redirect_uri
   - scope
   - state (CSRF token stored in session)

3. User authorizes on provider's site

4. Provider redirects to callback URL with code

5. Server handles callback:
   - Verify state matches (CSRF protection)
   - Exchange code for tokens
   - Fetch user profile from provider
   - Check if email already exists:
     - Yes: link OAuth account to existing user
     - No: create new user (email_verified = true for OAuth)
   - Create session

6. Redirect to dashboard
```

---

## Login Flow

### Email/Password Login

```
1. Client sends POST /api/auth/login
   Body: { email, password, rememberMe? }

2. Server validates:
   - Find user by email
   - Compare password hash (bcrypt.compare)
   - Check account not deleted/banned

3. Rate limiting:
   - 5 failed attempts per email per 15 minutes
   - After 5 failures: account locked for 15 minutes
   - Log all failed attempts

4. On success:
   - Create session in Redis + database
   - Set HTTP-only cookie with session ID
   - Cookie maxAge: 24h (default) or 30 days (rememberMe)
   - Return user profile data

5. On failure:
   - Generic error: "Invalid email or password"
   - Never reveal whether email exists
```

### OAuth Login

```
Same flow as OAuth registration.
If user already exists with that OAuth provider linked, just create session.
If email exists but OAuth not linked, prompt to link accounts.
```

---

## Session Management

### Session Storage

**Redis (Primary)**: Fast session lookup on every request
```
Key: session:{session_id}
Value: {
  userId: "uuid",
  createdAt: "timestamp",
  expiresAt: "timestamp",
  ipAddress: "1.2.3.4",
  userAgent: "Mozilla/5.0..."
}
TTL: matches session expiration
```

**PostgreSQL (Backup)**: Persistent storage for session history and management
- Users can view active sessions in settings
- Users can revoke sessions individually

### Session Lifecycle

```
Created: On login/registration
Validated: On every authenticated request (middleware)
Extended: On activity (sliding window, optional)
Expired: After maxAge (24h or 30d)
Revoked: User clicks "log out" or "revoke session"
```

### Session Security
- Session ID: 256-bit cryptographically random value
- Stored in HTTP-only, Secure, SameSite=Lax cookie
- New session ID on privilege escalation (prevent session fixation)
- IP and user-agent logged for suspicious activity detection

---

## Password Management

### Password Reset Flow

```
1. Client sends POST /api/auth/forgot-password
   Body: { email }

2. Server (always returns success, even if email not found):
   - Find user by email
   - If found: generate reset token (crypto.randomBytes(32))
   - Store hashed token in password_reset_tokens (expires 1 hour)
   - Send email with reset link: {APP_URL}/reset-password?token={raw_token}

3. Client sends POST /api/auth/reset-password
   Body: { token, newPassword }

4. Server validates:
   - Hash token, find matching record
   - Check not expired (1 hour)
   - Check not already used
   - Validate new password strength

5. Server updates:
   - Hash new password
   - Update user.password_hash
   - Invalidate all existing sessions for this user
   - Mark reset token as used
   - Send confirmation email
```

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- No maximum length (bcrypt handles any length)
- Not in common password list (top 10,000)

---

## OAuth Token Management (Social Platforms)

This section covers OAuth tokens for **social platform connections** (LinkedIn, Twitter, etc.), which are separate from login OAuth.

### Token Storage
- Access tokens and refresh tokens encrypted at rest with AES-256-GCM
- Encryption key stored in environment variables, never in code
- Tokens stored in `social_accounts` table

### Token Refresh Strategy

```
1. Before any platform API call:
   - Check token_expires_at
   - If expires within 5 minutes: proactive refresh

2. Refresh process:
   - Call platform's token refresh endpoint
   - Store new access_token (encrypted)
   - Update token_expires_at
   - If refresh_token rotated, store new one

3. Refresh failure handling:
   - Mark account status as 'expired'
   - Notify user: "Please reconnect your {platform} account"
   - Pause scheduled posts for that account
   - Do NOT delete old tokens (user might reconnect)
```

### Token Encryption

```typescript
// Encryption approach (conceptual)
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY, 'hex'); // 32 bytes

function encrypt(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Store as: iv:tag:encrypted (all base64)
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

function decrypt(ciphertext: string): string {
  const [ivB64, tagB64, encB64] = ciphertext.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const encrypted = Buffer.from(encB64, 'base64');
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString();
}
```

---

## Authorization

### Current Model (Phase 1-6): Plan-Based Access Control

No roles — access controlled by subscription plan:

| Feature | Free | Pro | Business | Agency |
|---------|------|-----|----------|--------|
| Social accounts | 1 | 3 | 10 | 25 |
| AI generations/month | 10 | 100 | Unlimited | Unlimited |
| Scheduled posts | 10/month | Unlimited | Unlimited | Unlimited |
| Analytics history | 7 days | 90 days | 1 year | 1 year |
| Brand memory | — | Basic | Full | Full |
| Comment management | — | ✓ | ✓ | ✓ |
| Trend monitoring | — | — | ✓ | ✓ |
| Team members | — | — | 3 | Unlimited |
| API access | — | — | ✓ | ✓ |

**Enforcement**:
- Middleware checks plan limits before resource creation
- Returns 403 with `upgrade_required` error code
- Frontend shows upgrade prompts when limits approached

### Future Model (Phase 8): RBAC

Roles within teams:
- **Owner**: Full access, billing, team management
- **Admin**: Full access except billing
- **Editor**: Create, edit, publish content
- **Viewer**: Read-only access to analytics and content

---

## Middleware Implementation

### Authentication Middleware

```typescript
// Conceptual middleware structure
async function authMiddleware(req, res, next) {
  // 1. Extract session ID from cookie
  const sessionId = req.cookies['session_id'];
  if (!sessionId) return res.status(401).json({ error: 'Unauthorized' });

  // 2. Look up session in Redis
  const session = await redis.get(`session:${sessionId}`);
  if (!session) return res.status(401).json({ error: 'Session expired' });

  // 3. Check session not expired
  if (new Date(session.expiresAt) < new Date()) {
    await redis.del(`session:${sessionId}`);
    return res.status(401).json({ error: 'Session expired' });
  }

  // 4. Attach user to request
  req.userId = session.userId;
  req.sessionId = sessionId;
  next();
}
```

### Plan Check Middleware

```typescript
// Conceptual plan enforcement
function requirePlan(...allowedPlans: string[]) {
  return async (req, res, next) => {
    const user = await userRepo.findById(req.userId);
    if (!allowedPlans.includes(user.plan)) {
      return res.status(403).json({
        error: 'Plan upgrade required',
        code: 'UPGRADE_REQUIRED',
        currentPlan: user.plan,
        requiredPlan: allowedPlans[0]
      });
    }
    next();
  };
}
```

---

## Security Measures

### CSRF Protection
- SameSite=Lax cookies (prevents CSRF for state-changing requests)
- State parameter in OAuth flows
- Origin/Referer header validation for sensitive operations

### Brute Force Protection
- Rate limiting on login: 5 attempts / 15 minutes per IP + email
- Rate limiting on registration: 3 accounts / hour per IP
- Rate limiting on password reset: 3 requests / hour per email
- Progressive delays on failed attempts

### Account Security
- Email notification on new login from unknown device/location
- Session list in settings (view and revoke)
- Password change requires current password
- Account deletion requires password confirmation
- Soft-delete with 30-day recovery window

---

## Better Auth Configuration

Better Auth is configured as the authentication backbone with these plugins/features:

- Email + Password provider
- Google OAuth provider
- GitHub OAuth provider
- Session management (Redis-backed)
- Email verification
- Password reset
- Rate limiting

The configuration connects to our PostgreSQL database for user storage and Redis for sessions, integrating cleanly with our Express middleware chain.
