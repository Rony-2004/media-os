# User Flow Documentation

## Overview

This document maps the primary user journeys through AI Social OS.

---

## 1. Complete User Flow

```
Landing Page
     ↓
Register (Email + Password)
     ↓
Verify Email (6-digit OTP, dev mode: from terminal)
     ↓
Login
     ↓
Dashboard (Onboarding state — no social accounts)
     ↓
Accounts Page
     ↓
Connect LinkedIn (OAuth 2.0)
     ↓
Store LinkedIn Tokens (encrypted)
     ↓
Sidebar Unlocks (all features available)
     ↓
Create Post
     ↓
Schedule or Publish
     ↓
Analytics
```

---

## 2. Registration Flow

```
[Landing Page] → [Register Button]
       ↓
[Registration Form]
  - Full Name
  - Email
  - Password (min 8 chars, 1 uppercase, 1 number)
       ↓
[Submit] → [API: POST /api/auth/sign-up/email]
       ↓
[OTP Generated]
  - Production: sent via email (Nodemailer)
  - Development: printed to terminal + returned in response
       ↓
[OTP Verification Page]
  - 6-digit code input
  - 10-minute expiry
  - Max 5 attempts
       ↓
[Submit OTP] → [API: POST /api/auth/verify-email]
       ↓
[Success] → [Redirect to Login]
```

---

## 3. Login Flow

```
[Login Page]
  - Email + Password form
  - "Forgot Password?" link
  - "Register" link
       ↓
[Submit] → [API: POST /api/auth/sign-in/email]
       ↓
[Validation]
  - Check credentials
  - Check email verified
  - Rate limit: 5 attempts / 15 min
       ↓
[Success] → [Session created, cookie set] → [Redirect to Dashboard]
[Failure] → [Error: "Invalid email or password"]
```

---

## 4. Password Reset Flow

```
[Login Page] → [Forgot Password Link]
       ↓
[Forgot Password Page]
  - Email input
       ↓
[Submit] → [API: POST /api/auth/forget-password]
  - Always shows success (don't reveal if email exists)
       ↓
[Reset Email Sent] (or printed in dev mode)
       ↓
[Reset Password Page]
  - New password
  - Confirm password
       ↓
[Submit] → [API: POST /api/auth/reset-password]
       ↓
[Success] → [Redirect to Login with success message]
```

---

## 5. Dashboard — First Visit (No Social Accounts)

```
[Login Success] → [Dashboard]
       ↓
[Onboarding State]:
  - Welcome message: "Welcome, {name}!"
  - CTA: "Connect your first social account"
  - Large LinkedIn connection card
  - Sidebar: most items disabled/locked
       ↓
[User clicks "Connect LinkedIn"] → [Accounts Page]
```

---

## 6. Connect LinkedIn Flow

```
[Accounts Page] → [Connect LinkedIn Button]
       ↓
[API: GET /api/social-accounts/linkedin/auth]
  - Generate state token
  - Store state in Redis/session
  - Redirect to LinkedIn Authorization URL
       ↓
[LinkedIn Authorization Page]
  - User sees ConnectUs requesting permissions
  - Scopes: openid, profile, email, w_member_social
       ↓
[User clicks "Allow"]
       ↓
[LinkedIn redirects to callback URL with code + state]
       ↓
[API: GET /api/social-accounts/linkedin/callback]
  - Validate state token
  - Exchange code for access token
  - Fetch user profile (GET /v2/userinfo)
  - Encrypt access token
  - Create social_account record
       ↓
[Redirect to Accounts Page]
  - Show LinkedIn as "Connected"
  - Show connected date
       ↓
[Sidebar automatically unlocks all features]
```

---

## 7. Dashboard — Connected State

```
[Dashboard after connection]:
  - Overview metrics (initially empty/zero)
  - Recent posts section
  - Upcoming scheduled posts
  - Quick actions: Create Post, AI Writer
  - Usage/quota summary
```

---

## 8. Sidebar Lock/Unlock Behavior

### When zero social accounts connected:

**Enabled (clickable)**:
- Dashboard
- Accounts
- Quota
- Settings
- Help
- Logout

**Disabled (locked)**:
- Posts
- Drafts
- Calendar
- Analytics
- AI Writer
- Brand Voice

Locked items show:
- Greyed out appearance
- Lock icon
- Tooltip on hover: "Connect a social account to unlock this feature."
- Not navigable (click does nothing)

### After one provider connected:

All sidebar items become enabled. Unlock is automatic — no page refresh needed (state updates reactively).

---

## 9. Settings Flow

```
[Settings Page]
  ├── Profile (name, email, avatar)
  ├── Notifications (preferences)
  ├── Security (change password, sessions)
  └── Danger Zone (delete account)
```

---

## 10. Accounts Page

```
[Accounts Page]
  ├── LinkedIn Card
  │   ├── Logo + "LinkedIn"
  │   ├── Status: Connected / Not Connected
  │   ├── Connected account name + avatar
  │   ├── Connected date
  │   └── Actions: [Connect] / [Disconnect] / [Reconnect]
  │
  ├── X (Twitter) Card — "Coming Soon"
  ├── Instagram Card — "Coming Soon"
  ├── Facebook Card — "Coming Soon"
  ├── Threads Card — "Coming Soon"
  └── YouTube Card — "Coming Soon"
```

---

## 11. Quota Page

```
[Quota Page]
  - Current plan name
  - Posts published this month / limit
  - AI generations used / limit
  - Connected accounts / limit
  - Storage used (media)
  - Upgrade CTA (if on free plan)
```

---

## 12. Daily Usage Pattern

```
Morning:
  1. Login → Dashboard
  2. Check any published post status
  3. Review upcoming scheduled posts
  4. Create or approve AI-generated content

Midday:
  5. Check engagement (analytics)
  6. Respond to comments (future)

Evening:
  7. Schedule content for next day
  8. Review weekly performance
```
