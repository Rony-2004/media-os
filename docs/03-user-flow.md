# User Flow Documentation

## Overview

This document maps every user journey through AI Social OS, from first visit to daily usage. These flows inform UI design, API design, and implementation priorities.

---

## 1. Registration & Onboarding Flow

```
[Landing Page] → [Sign Up Button]
       ↓
[Registration Form]
  - Email
  - Password (min 8 chars, 1 uppercase, 1 number)
  - Full Name
       ↓
[Email Verification]
  - Send verification email
  - User clicks link
  - Redirect to onboarding
       ↓
[Onboarding Step 1: Welcome]
  - Product overview (30 sec video or animated walkthrough)
  - "Let's set up your AI social media manager"
       ↓
[Onboarding Step 2: Connect Platform]
  - "Connect your first social account"
  - LinkedIn OAuth button (primary)
  - "Skip for now" option
  - On success: fetch profile data + recent posts
       ↓
[Onboarding Step 3: Industry & Goals]
  - Select industry (dropdown with search)
  - Select 1-3 content goals
  - This configures AI context
       ↓
[Onboarding Step 4: Posting Preferences]
  - Preferred posting frequency
  - Preferred time windows
  - Timezone auto-detected, editable
       ↓
[Onboarding Step 5: Voice Sample (Optional)]
  - "Paste 3-5 of your best posts"
  - OR "We'll learn from your connected account's history"
  - AI processes and creates initial brand memory
       ↓
[Dashboard - First Time]
  - Welcome card with quick actions
  - "Create your first AI post" CTA
  - Guided tooltips on navigation
```

### Error States:
- Email already registered → "Account exists, try logging in" with login link
- OAuth failure → Retry button + manual connection instructions
- Email verification expired → Resend button
- Onboarding abandoned → Resume from last step on next login

---

## 2. Login Flow

```
[Login Page]
  - Email + Password form
  - "Remember me" checkbox
  - "Forgot password?" link
  - OAuth buttons (Google, GitHub)
       ↓
[Validation]
  - Check credentials
  - Rate limit: 5 attempts / 15 min
       ↓
[Success] → [Dashboard]
[Failure] → [Error message, remaining attempts shown after 3rd failure]
```

### Password Reset:
```
[Forgot Password] → [Enter Email]
       ↓
[Send Reset Email] (always show success, even if email not found)
       ↓
[Click Reset Link] → [New Password Form]
       ↓
[Password Updated] → [Login Page with success message]
```

---

## 3. Content Creation Flow

### 3.1 AI-Generated Content

```
[Dashboard] → [Create Post Button] OR [AI Writer Page]
       ↓
[Content Generation Interface]
  - Input method selection:
    a) Topic/idea (text input)
    b) URL (paste article link)
    c) Quick prompts (predefined starting points)
       ↓
[Configure Generation]
  - Target platform (LinkedIn, X, etc.)
  - Tone selection (professional, casual, etc.)
  - Length preference
  - Include hashtags? (toggle)
  - Include CTA? (toggle + type selector)
       ↓
[Generate Button] → [Loading state, 3-8 seconds]
       ↓
[Results: 2-3 Variants]
  - Each variant shows:
    - Full content preview
    - Character count
    - Estimated engagement score
    - "Use this" / "Regenerate" / "Edit" buttons
       ↓
[User selects variant] → [Post Editor (pre-filled)]
       ↓
[Post Editor]
  - Edit content freely
  - Platform preview
  - Character count
  - Options:
    a) Save as Draft
    b) Schedule (opens scheduler)
    c) Publish Now
    d) AI: Improve / Shorten / Expand
```

### 3.2 Manual Content Creation

```
[Create Post Button] → [Post Editor (empty)]
       ↓
[Write content manually]
  - Character count visible
  - Platform selector
  - AI assist button (available inline)
       ↓
[Options]
  a) Save as Draft
  b) Schedule
  c) Publish Now
```

---

## 4. Scheduling Flow

### 4.1 Schedule Specific Time

```
[Post Editor] → [Schedule Button]
       ↓
[Schedule Modal]
  - Date picker (calendar)
  - Time picker
  - Timezone display
  - AI suggested time (highlighted, with explanation)
  - "Add to queue instead" option
       ↓
[Confirm Schedule]
       ↓
[Post status → "Scheduled"]
[Redirect to Calendar or Post List]
[Confirmation toast notification]
```

### 4.2 Add to Queue

```
[Post Editor] → [Add to Queue]
       ↓
[Queue confirmation]
  - Shows next available slot time
  - Shows position in queue
  - Option to move position
       ↓
[Post added to queue]
[Status → "Queued"]
```

### 4.3 Calendar Interactions

```
[Calendar Page]
  - View scheduled posts
  - Click empty slot → Create new post for that time
  - Click existing post → View/Edit/Reschedule
  - Drag post → Reschedule to new time
  - Right-click → Delete/Duplicate/Edit
```

---

## 5. Publishing Flow (System)

```
[Worker polls every 30 seconds]
       ↓
[Find posts where scheduledAt <= now AND status = 'scheduled']
       ↓
[For each post]:
  [Fetch user's OAuth token for target platform]
       ↓
  [Validate token is valid (not expired)]
    - If expired: attempt refresh
    - If refresh fails: mark post as "failed", notify user
       ↓
  [Call platform API to publish]
    - LinkedIn: POST /ugcPosts
    - X: POST /2/tweets
       ↓
  [Success]:
    - Update post status → "published"
    - Store platform post ID
    - Send success notification
    - Queue analytics fetch (delayed 1 hour)
       ↓
  [Failure]:
    - Increment retry count
    - If retries < 3: reschedule with exponential backoff
    - If retries >= 3: mark as "failed", notify user
    - Log error details
```

---

## 6. Analytics Flow

### 6.1 Viewing Analytics

```
[Dashboard] → [Analytics Nav Item]
       ↓
[Analytics Overview Page]
  - Time range selector (7d, 30d, 90d, custom)
  - Key metrics summary cards:
    - Total impressions
    - Total engagement
    - Follower growth
    - Posts published
  - Engagement over time chart
  - Top performing posts list
  - AI insights panel
       ↓
[Click on specific post] → [Post Detail Analytics]
  - Full metrics breakdown
  - Performance vs. average comparison
  - AI analysis of why it performed well/poorly
```

### 6.2 Weekly Report

```
[System: Every Monday 8am user's timezone]
       ↓
[AI Worker generates weekly report]
  - Aggregate past 7 days metrics
  - Compare to previous week
  - Identify best/worst performing content
  - Generate recommendations
       ↓
[Store report in database]
[Send email digest to user]
[Show report card in dashboard]
       ↓
[User views report]
  - Full report page
  - Actionable next steps
  - "Generate content based on insights" button
```

---

## 7. Comment Management Flow

```
[Dashboard] → [Engagement Nav Item] OR [Notification: "5 new comments"]
       ↓
[Comment Inbox]
  - List of unread comments (newest first)
  - Each shows: commenter name, comment text, post title, time, sentiment
  - Filter: All / Needs Reply / Questions / Positive / Negative
       ↓
[Click on comment]
       ↓
[Comment Detail]
  - Original post context
  - Full comment
  - AI-generated reply suggestions (2-3 options)
  - Text input for custom reply
       ↓
[User action]:
  a) Click suggested reply → Edit if needed → Send
  b) Write custom reply → Send
  c) Like comment only
  d) Mark as "no reply needed"
       ↓
[Reply published to platform]
[Comment marked as handled]
[Move to next unread comment]
```

---

## 8. Brand Memory Flow

### 8.1 Initial Setup

```
[Onboarding] OR [Settings → Brand Voice]
       ↓
[Voice Configuration Form]
  - Formality slider (1-5)
  - Humor slider (1-5)
  - Emoji usage (none/light/moderate/heavy)
  - Topics of expertise (multi-select + custom)
  - Words to avoid (text input, comma-separated)
  - Example posts (paste area)
       ↓
[AI processes inputs]
  - Extract writing patterns
  - Build vocabulary profile
  - Identify tone characteristics
       ↓
[Brand Profile Created]
  - Display summary of learned voice
  - "Generate sample post to test" button
  - Refinement: thumbs up/down on sample
```

### 8.2 Continuous Learning

```
[User generates AI content]
       ↓
[User accepts, edits, or rejects]
       ↓
[System records feedback]:
  - Accepted as-is → positive signal (full weight)
  - Accepted with edits → learn from edits (partial weight)
  - Rejected / regenerated → negative signal
       ↓
[Brand memory updated periodically]
  - Weekly recalculation of voice profile
  - Incorporate new feedback data
  - Adjust generation parameters
```

---

## 9. Settings Flow

```
[User Avatar Menu] → [Settings]
       ↓
[Settings Page - Sidebar Navigation]
  ├── Profile
  │   - Edit name, email, avatar
  │   - Change password
  ├── Social Accounts
  │   - View connected accounts
  │   - Connect new account
  │   - Disconnect account
  │   - Account health status
  ├── Brand Voice
  │   - Voice configuration
  │   - Content pillars
  │   - View learned patterns
  ├── Notifications
  │   - Toggle per event type
  │   - Email preferences
  │   - Quiet hours
  ├── Scheduling
  │   - Default posting times
  │   - Queue slots per day
  │   - Timezone
  ├── Billing
  │   - Current plan
  │   - Upgrade/downgrade
  │   - Payment method
  │   - Invoice history
  └── Data & Privacy
      - Export all data
      - Delete account
      - Privacy settings
```

---

## 10. Subscription Flow

```
[Free user hits limit] OR [Pricing page] OR [Settings → Billing]
       ↓
[Pricing Page]
  - Plan comparison table
  - Current plan highlighted
  - "Most popular" badge on Pro
       ↓
[Select Plan] → [Stripe Checkout]
  - Card details
  - Billing frequency (monthly/annual with discount)
  - Coupon code field
       ↓
[Payment Success]
  - Confirmation page
  - Updated limits immediately
  - Welcome email for new plan
       ↓
[Subscription Management]
  - Cancel anytime (effective end of period)
  - Downgrade (effective end of period)
  - Upgrade (immediate, prorated)
```

---

## 11. Error & Edge Case Flows

### OAuth Token Expired
```
[User tries to publish] → [Token expired detected]
       ↓
[Attempt silent refresh]
  - Success → Continue operation
  - Failure → Show "Reconnect required" banner
       ↓
[User clicks reconnect] → [OAuth flow] → [Success] → [Resume operation]
```

### AI Generation Failure
```
[User requests content generation] → [Primary AI provider fails]
       ↓
[Fallback to secondary provider]
  - Success → Return result (slightly longer wait)
  - Both fail → Show error message
       ↓
[Error State]
  - "AI is temporarily unavailable"
  - "Try again" button
  - Option to write manually
```

### Post Publish Failure
```
[Scheduled post fails to publish]
       ↓
[System retries (3 attempts, exponential backoff)]
  - 1st retry: 5 minutes
  - 2nd retry: 30 minutes
  - 3rd retry: 2 hours
       ↓
[All retries exhausted]
  - Post status → "failed"
  - In-app notification with error details
  - Email notification
  - "Retry Now" button in UI
  - Option to reschedule
```

### Rate Limit Hit
```
[API call to social platform] → [429 Rate Limited]
       ↓
[Queue the request]
  - Respect Retry-After header
  - Exponential backoff
  - User not directly impacted (async operations)
       ↓
[For user-facing operations]:
  - "Please try again in X minutes"
  - Auto-retry in background
```

---

## 12. Daily Usage Patterns

### Power User (Daily Active)
```
Morning:
  1. Open dashboard → Review overnight engagement
  2. Check AI content suggestions → Approve/edit 1-2 posts
  3. Review comment inbox → Reply to priority comments
  4. Glance at calendar for upcoming scheduled posts

Midday:
  5. React to trend alert → Generate timely content → Schedule

Evening:
  6. Check post performance from earlier today
  7. Queue content for tomorrow
```

### Weekly User (3x/week)
```
Monday:
  1. Review weekly report
  2. Generate 5-7 posts for the week
  3. Schedule across the week via calendar
  4. Handle comment inbox (batch)

Wednesday:
  5. Quick check on post performance
  6. Adjust scheduled content if needed

Friday:
  7. Review week's performance
  8. Note topics that worked well
```

### Set-and-Forget User (Weekly Check-in)
```
Sunday evening:
  1. Open app, review AI's weekly suggestions
  2. Approve/reject batch of AI-generated posts
  3. AI auto-schedules approved posts
  4. Review and reply to top comments
  5. Close app — AI handles the rest
```
