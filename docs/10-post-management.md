# Post Management

## Overview

Post management is the core feature of AI Social OS. It covers the complete lifecycle of social media content: creation, editing, scheduling, publishing, and archiving.

---

## Post Lifecycle

```
┌─────────┐     ┌───────────┐     ┌────────────┐     ┌───────────┐
│  DRAFT  │────→│ SCHEDULED │────→│ PUBLISHING │────→│ PUBLISHED │
└─────────┘     └───────────┘     └────────────┘     └───────────┘
     │               │                   │
     │               │                   ▼
     │               │            ┌──────────┐
     │               └───────────→│  FAILED  │
     │                            └──────────┘
     │                                  │
     ▼                                  ▼
┌───────────┐                   (Retry → SCHEDULED)
│ CANCELLED │                   (Give up → stays FAILED)
└───────────┘
```

### Status Definitions

| Status | Description | Allowed Transitions |
|--------|-------------|-------------------|
| `draft` | Content created but not scheduled | → scheduled, cancelled |
| `scheduled` | Queued for future publishing | → publishing, draft, cancelled |
| `publishing` | Currently being published (in-flight) | → published, failed |
| `published` | Successfully posted to platform | (terminal) |
| `failed` | Publishing failed after retries | → scheduled (retry), cancelled |
| `cancelled` | User cancelled the post | → draft (restore) |

---

## Post Data Model

### Core Fields

```typescript
interface Post {
  id: string;                    // UUID
  userId: string;                // Post owner
  socialAccountId: string | null; // Target account (null = not yet assigned)
  content: string;               // Post body text
  platform: Platform;            // Target platform
  status: PostStatus;            // Current lifecycle status
  scheduledAt: Date | null;      // When to publish
  publishedAt: Date | null;      // When actually published
  platformPostId: string | null; // ID on social platform
  platformPostUrl: string | null; // URL on social platform
  mediaUrls: string[];           // Attached media
  hashtags: string[];            // Extracted hashtags
  aiGenerated: boolean;          // AI vs manual flag
  aiModel: string | null;        // Which model generated
  aiPrompt: string | null;       // Original prompt
  generationFeedback: 'positive' | 'negative' | null;
  retryCount: number;            // Publish attempts
  errorMessage: string | null;   // Last error
  metadata: Record<string, any>; // Platform-specific extras
  createdAt: Date;
  updatedAt: Date;
}
```

### Platform-Specific Content Rules

| Platform | Max Characters | Image Support | Link Preview | Hashtags |
|----------|---------------|---------------|-------------|----------|
| LinkedIn | 3,000 | Yes (up to 9) | Yes | Yes (in text) |
| X (Twitter) | 280 (free) / 25,000 (premium) | Yes (up to 4) | Yes | Yes (in text) |
| Instagram | 2,200 | Required | No | Yes (up to 30) |
| Facebook | 63,206 | Yes | Yes | Yes |
| Threads | 500 | Yes | Yes | Yes |

---

## API Endpoints

### Create Post

```
POST /api/posts

Request Body:
{
  "content": "Your post content here...",
  "platform": "linkedin",
  "socialAccountId": "uuid-of-connected-account",
  "scheduledAt": "2026-08-15T09:00:00Z",  // null for draft
  "mediaUrls": [],
  "hashtags": ["#AI", "#SocialMedia"],
  "metadata": {}
}

Response (201):
{
  "data": {
    "id": "post-uuid",
    "content": "Your post content here...",
    "platform": "linkedin",
    "status": "draft",  // or "scheduled" if scheduledAt provided
    "scheduledAt": "2026-08-15T09:00:00Z",
    "createdAt": "2026-08-01T10:00:00Z"
  }
}
```

### Get Posts (List)

```
GET /api/posts?status=draft&platform=linkedin&page=1&limit=20&sort=createdAt:desc

Response (200):
{
  "data": [
    {
      "id": "post-uuid",
      "content": "Post content...",
      "platform": "linkedin",
      "status": "draft",
      "scheduledAt": null,
      "createdAt": "2026-08-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}

Query Parameters:
- status: draft | scheduled | published | failed | cancelled (comma-separated for multiple)
- platform: linkedin | twitter | instagram | facebook | threads
- page: page number (default: 1)
- limit: items per page (default: 20, max: 100)
- sort: field:direction (createdAt:desc, scheduledAt:asc)
- search: full-text search on content
- from: date range start
- to: date range end
```

### Get Single Post

```
GET /api/posts/:id

Response (200):
{
  "data": {
    "id": "post-uuid",
    "content": "Full post content...",
    "platform": "linkedin",
    "status": "published",
    "scheduledAt": "2026-08-15T09:00:00Z",
    "publishedAt": "2026-08-15T09:00:15Z",
    "platformPostId": "urn:li:share:123456",
    "platformPostUrl": "https://www.linkedin.com/feed/update/urn:li:share:123456",
    "aiGenerated": true,
    "aiModel": "gpt-4o",
    "metrics": {
      "impressions": 1250,
      "likes": 45,
      "comments": 12,
      "shares": 8,
      "engagementRate": 0.052
    },
    "createdAt": "2026-08-14T15:00:00Z",
    "updatedAt": "2026-08-15T09:00:15Z"
  }
}
```

### Update Post

```
PATCH /api/posts/:id

Request Body (partial update):
{
  "content": "Updated content...",
  "scheduledAt": "2026-08-16T10:00:00Z"
}

Restrictions:
- Cannot update published posts
- Cannot update posts currently in "publishing" status
- Updating scheduledAt on scheduled post will re-queue

Response (200):
{
  "data": { ...updated post... }
}
```

### Delete Post

```
DELETE /api/posts/:id

Behavior:
- Draft/Cancelled: hard delete from database
- Scheduled: cancel (move to cancelled), remove from queue
- Published: soft delete (keeps for analytics history)
- Publishing: reject deletion (wait for completion)

Response (204): No content
```

### Schedule Post

```
POST /api/posts/:id/schedule

Request Body:
{
  "scheduledAt": "2026-08-15T09:00:00Z"
}

Validation:
- scheduledAt must be in the future (at least 5 minutes from now)
- Post must be in "draft" or "failed" status
- socialAccountId must be set
- User must have an active social account for the target platform

Response (200):
{
  "data": {
    "id": "post-uuid",
    "status": "scheduled",
    "scheduledAt": "2026-08-15T09:00:00Z"
  }
}
```

### Unschedule Post (Move Back to Draft)

```
POST /api/posts/:id/unschedule

Moves post from "scheduled" back to "draft".
Removes from publish queue.

Response (200):
{
  "data": {
    "id": "post-uuid",
    "status": "draft",
    "scheduledAt": null
  }
}
```

### Publish Now

```
POST /api/posts/:id/publish

Immediately queues the post for publishing (within 1 minute).
Sets scheduledAt to now.
Status transitions: draft/failed → scheduled → publishing → published

Response (200):
{
  "data": {
    "id": "post-uuid",
    "status": "scheduled",
    "scheduledAt": "2026-08-01T10:00:00Z"  // ~now
  }
}
```

### Retry Failed Post

```
POST /api/posts/:id/retry

Resets retry count and re-queues for immediate publishing.
Only works on posts with status = "failed".

Response (200):
{
  "data": {
    "id": "post-uuid",
    "status": "scheduled",
    "retryCount": 0
  }
}
```

---

## Post Creation Logic

### Service Layer

```
CreatePost(input):
  1. Validate content against platform character limit
  2. Validate socialAccountId exists and belongs to user
  3. Check user hasn't exceeded plan limits (posts per month)
  4. Extract hashtags from content
  5. If scheduledAt provided:
     - Validate is in future
     - Set status = "scheduled"
     - Add to publish queue with delay
  6. Else:
     - Set status = "draft"
  7. Save post to database
  8. Return created post
```

### Content Validation Rules

```
ValidatePostContent(content, platform):
  - Not empty
  - Not exceeding platform character limit
  - No blocked words (user-defined)
  - Valid UTF-8 encoding
  - Media URLs are valid (if provided)
  - Max hashtag count per platform
  - Warn (not block) if content seems too short for LinkedIn (< 50 chars)
```

---

## Bulk Operations

### Bulk Schedule

```
POST /api/posts/bulk/schedule

Request Body:
{
  "postIds": ["uuid-1", "uuid-2", "uuid-3"],
  "schedule": "optimal"  // or specific times per post
}

// With specific times:
{
  "posts": [
    { "id": "uuid-1", "scheduledAt": "2026-08-15T09:00:00Z" },
    { "id": "uuid-2", "scheduledAt": "2026-08-16T09:00:00Z" },
    { "id": "uuid-3", "scheduledAt": "2026-08-17T09:00:00Z" }
  ]
}
```

### Bulk Delete

```
POST /api/posts/bulk/delete

Request Body:
{
  "postIds": ["uuid-1", "uuid-2", "uuid-3"]
}

// Only deletes posts in draft/cancelled status
// Returns count of successfully deleted vs skipped
```

---

## Draft Auto-Save

### Frontend Behavior
- Auto-save draft every 30 seconds while editing
- Save on blur (user switches tab/window)
- Save on navigation (user leaves editor)
- Show "Saving..." / "Saved" indicator

### API Endpoint

```
PATCH /api/posts/:id/autosave

Request Body:
{
  "content": "Current editor content..."
}

// Lightweight endpoint, minimal validation
// Only updates content field
// Does not update updatedAt (to avoid confusion)
// Rate limited to 1 call per 10 seconds per post
```

---

## Post Queue System

### Queue Entry

When a post is scheduled, a BullMQ job is created:

```typescript
// Adding to queue
await publishQueue.add(
  'publish-post',
  {
    postId: post.id,
    userId: post.userId,
    socialAccountId: post.socialAccountId,
    platform: post.platform
  },
  {
    delay: scheduledAt.getTime() - Date.now(), // delay until scheduled time
    attempts: 4,
    backoff: {
      type: 'exponential',
      delay: 300000 // 5 minutes initial
    },
    removeOnComplete: true,
    removeOnFail: false // keep for inspection
  }
);
```

### Queue Management
- Jobs can be removed (when post is unscheduled)
- Jobs can be promoted (publish now)
- Failed jobs visible in admin/debug tools
- Queue depth monitored for alerts

---

## Plan Limits

| Plan | Posts per Month | Drafts | Scheduled at Once |
|------|----------------|--------|-------------------|
| Free | 10 | 5 | 5 |
| Pro | Unlimited | Unlimited | 100 |
| Business | Unlimited | Unlimited | 500 |
| Agency | Unlimited | Unlimited | 1000 |

Enforcement happens at the service layer before post creation.
