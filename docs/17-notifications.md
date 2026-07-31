# Notifications System

## Overview

The notification system delivers timely information to users through in-app notifications, email, and browser push notifications (future). It covers post publishing events, engagement alerts, system warnings, and AI-generated insights.

---

## Notification Types

| Type | Description | Channels | Priority |
|------|-------------|----------|----------|
| `post_published` | Post successfully published | In-app | Low |
| `post_failed` | Post failed to publish | In-app, Email | High |
| `comment_received` | New comment on a post | In-app | Medium |
| `weekly_report` | Weekly analytics report ready | In-app, Email | Low |
| `trend_alert` | Relevant trend detected | In-app | Medium |
| `token_expiring` | OAuth token expiring soon | In-app, Email | High |
| `token_expired` | OAuth token has expired | In-app, Email | Critical |
| `plan_limit_warning` | Approaching plan limit (80%) | In-app | Medium |
| `plan_limit_reached` | Plan limit reached | In-app, Email | High |
| `ai_suggestions_ready` | AI has new content suggestions | In-app | Low |
| `account_security` | Suspicious login activity | In-app, Email | Critical |
| `system_maintenance` | Scheduled downtime | In-app, Email | Medium |

---

## Notification Data Model

```typescript
interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;  // Type-specific payload
  read: boolean;
  readAt: Date | null;
  actionUrl: string | null;   // Where to navigate on click
  createdAt: Date;
}
```

---

## In-App Notifications

### Notification Bell Component

```
Location: Top-right header area
Behavior:
  - Shows unread count badge (red dot with number)
  - Badge shows "9+" for > 9 unread
  - Click opens notification dropdown/panel
  - Click on notification → navigate to actionUrl
  - "Mark all as read" button
  - "View all" link to full notifications page
```

### Notification Panel

```
Displays:
  - List of 10 most recent notifications
  - Unread notifications highlighted
  - Time ago (2m, 1h, 3d)
  - Icon per notification type
  - Brief message (truncated to 100 chars)
  - Click to expand or navigate
```

---

## Email Notifications

### Email Templates

**Post Published**:
```
Subject: ✅ Your post was published to LinkedIn
Body:
  Your scheduled post was successfully published.
  
  Post preview: {first 200 chars}
  Published at: {time in user's timezone}
  
  [View Post on LinkedIn] [View in AI Social OS]
```

**Post Failed**:
```
Subject: ⚠️ Your post failed to publish
Body:
  We couldn't publish your scheduled post to LinkedIn.
  
  Post preview: {first 200 chars}
  Error: {error_message}
  
  We attempted {retry_count} times. You can retry from your dashboard.
  
  [Retry Now] [Edit Post] [View Details]
```

**Weekly Report**:
```
Subject: 📊 Your weekly social media report is ready
Body:
  Here's your performance summary for {week_dates}:
  
  Posts Published: {count}
  Total Impressions: {impressions}
  Engagement: {engagement} ({change_vs_last_week})
  New Followers: {followers_gained}
  
  Top Performer: {top_post_preview}
  → {top_post_impressions} impressions, {top_post_engagement} engagements
  
  AI Recommendation: {top_recommendation}
  
  [View Full Report] [Create New Content]
```

**Token Expiring**:
```
Subject: 🔑 Your LinkedIn connection needs attention
Body:
  Your LinkedIn account connection will expire in {days} days.
  
  To keep publishing posts automatically, please reconnect your account.
  
  [Reconnect Now]
```

### Email Sending Configuration

- **Provider**: Resend (or SendGrid fallback)
- **From**: notifications@aisocialos.com
- **Reply-to**: support@aisocialos.com
- **Unsubscribe**: One-click unsubscribe link in every email
- **Rate limit**: Max 10 emails per user per day
- **Batching**: Low-priority notifications batched into daily digest (optional)

---

## API Endpoints

### Get Notifications

```
GET /api/notifications?read=false&limit=20

Response:
{
  "data": {
    "notifications": [
      {
        "id": "notif-uuid",
        "type": "comment_received",
        "title": "New comment from Jane Smith",
        "message": "Great insights! How do you balance...",
        "read": false,
        "actionUrl": "/engagement/comment-uuid",
        "createdAt": "2026-08-01T14:35:00Z"
      }
    ],
    "unreadCount": 5
  },
  "pagination": { ... }
}

Filters:
  - read: true | false | all
  - type: specific notification type
  - limit: items per request
  - cursor: for cursor-based pagination
```

### Get Unread Count

```
GET /api/notifications/unread-count

Response:
{
  "data": {
    "count": 5
  }
}

// Lightweight endpoint for polling (used by notification bell)
// Can also be delivered via WebSocket in future
```

### Mark as Read

```
PATCH /api/notifications/:id/read

Response (200):
{
  "data": {
    "id": "notif-uuid",
    "read": true,
    "readAt": "2026-08-01T15:00:00Z"
  }
}
```

### Mark All as Read

```
POST /api/notifications/mark-all-read

Response (200):
{
  "data": {
    "updatedCount": 5
  }
}
```

### Update Notification Preferences

```
PUT /api/notifications/preferences

Request Body:
{
  "email": {
    "post_published": false,
    "post_failed": true,
    "comment_received": false,
    "weekly_report": true,
    "trend_alert": false,
    "token_expiring": true,
    "plan_limit_reached": true,
    "account_security": true
  },
  "inApp": {
    "post_published": true,
    "post_failed": true,
    "comment_received": true,
    "weekly_report": true,
    "trend_alert": true,
    "token_expiring": true,
    "plan_limit_reached": true,
    "account_security": true
  },
  "quietHours": {
    "enabled": true,
    "from": "22:00",
    "to": "07:00",
    "timezone": "America/New_York"
  },
  "emailDigest": {
    "enabled": false,
    "frequency": "daily",
    "time": "08:00"
  }
}
```

---

## Notification Worker

### Processing Flow

```typescript
// Notification worker processes the notification queue
async function processNotification(job: Job) {
  const { userId, type, title, message, data, actionUrl } = job.data;
  
  // 1. Create in-app notification
  await notificationRepository.create({
    userId,
    type,
    title,
    message,
    data,
    actionUrl,
    read: false
  });
  
  // 2. Check user's email preferences
  const preferences = await getNotificationPreferences(userId);
  
  if (preferences.email[type]) {
    // 3. Check quiet hours
    const user = await userRepository.findById(userId);
    if (!isInQuietHours(user.timezone, preferences.quietHours)) {
      // 4. Send email
      await emailService.send({
        to: user.email,
        template: `notification_${type}`,
        data: { title, message, actionUrl, ...data }
      });
    }
  }
  
  // 5. Future: send push notification
  // if (preferences.push[type]) { ... }
}
```

### Deduplication

```
Prevent notification spam:
  - Same type + same reference: max 1 per hour
  - Example: Don't send 50 "comment_received" in 1 hour
    → Batch into: "You have 50 new comments"
  
  - Token expiring: send once at 7 days, once at 3 days, once at 1 day
    → Don't repeat daily

Implementation:
  Redis key: `notif:dedup:{userId}:{type}:{referenceId}`
  TTL: varies by type (1 hour for comments, 24 hours for token warnings)
  Check before sending: if key exists, skip or batch
```

---

## Real-Time Notifications (Future)

### WebSocket/SSE Plan

```
Phase 7+ enhancement:
  - Server-Sent Events (SSE) connection from frontend
  - Pushes new notifications without polling
  - Reduces server load (no more GET /unread-count every 30 seconds)
  - Enables instant notification badge updates

Fallback:
  - Until SSE implemented: poll /notifications/unread-count every 30 seconds
  - Poll only when tab is active (visibility API)
```

---

## Notification Cleanup

```
Cron: Daily at 3am UTC

Rules:
  - Delete read notifications older than 90 days
  - Keep unread notifications up to 30 days (then mark as read + delete at 90)
  - Keep all security notifications for 1 year
  - Archive (don't delete) notifications linked to billing events
```
