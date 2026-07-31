# Scheduler & Auto-Publisher

## Overview

The scheduler is responsible for publishing posts at the correct time, managing the publish queue, determining optimal posting times, and handling failures with retry logic. It operates as a background worker process separate from the API server.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    API Server                         │
│                                                      │
│  User schedules post → Add job to BullMQ queue       │
│  (with delay = scheduledAt - now)                    │
└──────────────────────────┬──────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│                  Redis (BullMQ)                       │
│                                                      │
│  publish-queue:                                      │
│    Job 1: { postId: "abc", delay: 3600000 }         │
│    Job 2: { postId: "def", delay: 7200000 }         │
│    Job 3: { postId: "ghi", delay: 0 } ← ready now  │
└──────────────────────────┬──────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│                 Publish Worker                        │
│                                                      │
│  Polls queue → Picks ready jobs → Publishes          │
│  Concurrency: 5 jobs simultaneously                  │
│  Handles retries, failures, notifications            │
└─────────────────────────────────────────────────────┘
```

---

## Scheduling Modes

### 1. Specific Time Scheduling
User picks an exact date and time.

```typescript
// User selects: August 15, 2026 at 9:00 AM EST
const scheduledAt = new Date('2026-08-15T13:00:00Z'); // UTC
const delay = scheduledAt.getTime() - Date.now();

await publishQueue.add('publish-post', { postId }, { delay });
```

### 2. AI-Optimized Scheduling
AI suggests the best time based on the user's audience data.

**Algorithm**:
```
1. Analyze user's past post performance:
   - Group posts by hour-of-day and day-of-week
   - Calculate average engagement per time slot
   
2. Weight recent data more heavily:
   - Last 30 days: weight 3x
   - Last 60 days: weight 2x
   - Last 90 days: weight 1x

3. Consider platform-specific patterns:
   - LinkedIn: Business hours (Tue-Thu 8am-10am, 12pm-1pm)
   - X: Evenings and weekends also perform
   
4. Avoid conflicts:
   - Don't schedule within 3 hours of another scheduled post
   - Max 2 posts per day per platform

5. Return top 3 suggested times with confidence scores
```

**API for Optimal Time Suggestion**:
```
GET /api/scheduler/optimal-times?platform=linkedin&count=3

Response:
{
  "data": [
    {
      "datetime": "2026-08-15T13:00:00Z",
      "score": 0.92,
      "reason": "Tuesday 9AM EST is your highest engagement window"
    },
    {
      "datetime": "2026-08-15T17:00:00Z",
      "score": 0.85,
      "reason": "Tuesday 1PM EST shows strong impression counts"
    },
    {
      "datetime": "2026-08-16T13:30:00Z",
      "score": 0.78,
      "reason": "Wednesday mornings have consistent engagement"
    }
  ]
}
```

### 3. Queue-Based Scheduling
User adds posts to a queue; system auto-assigns time slots.

**Queue Slot Configuration** (user-defined in settings):
```json
{
  "slots": {
    "monday": ["09:00", "13:00"],
    "tuesday": ["09:00", "12:30", "17:00"],
    "wednesday": ["09:00", "13:00"],
    "thursday": ["09:00", "12:30", "17:00"],
    "friday": ["09:00", "13:00"],
    "saturday": [],
    "sunday": []
  },
  "timezone": "America/New_York"
}
```

**Queue Add Logic**:
```
When user adds post to queue:
1. Find next empty slot after current time
2. Assign post to that slot
3. Schedule with that time
4. If all slots for next 7 days full: notify user
```

---

## Publish Worker

### Worker Configuration

```typescript
const publishWorker = new Worker(
  'publish-queue',
  processPublishJob,
  {
    connection: redis,
    concurrency: 5,           // Process 5 jobs simultaneously
    limiter: {
      max: 10,                // Max 10 jobs
      duration: 60000         // Per minute (rate limiting)
    },
    settings: {
      stalledInterval: 30000, // Check stalled jobs every 30s
      maxStalledCount: 2      // Mark stalled after 2 checks
    }
  }
);
```

### Job Processing Flow

```typescript
async function processPublishJob(job: Job) {
  const { postId, userId, socialAccountId, platform } = job.data;

  // 1. Load post from database
  const post = await postRepository.findById(postId);
  if (!post || post.status === 'cancelled') {
    return { skipped: true, reason: 'Post cancelled or deleted' };
  }

  // 2. Update status to "publishing"
  await postRepository.updateStatus(postId, 'publishing');

  // 3. Load and validate social account
  const account = await socialAccountRepository.findById(socialAccountId);
  if (!account || account.status !== 'active') {
    throw new Error('Social account not active');
  }

  // 4. Decrypt and validate token
  let accessToken = decrypt(account.accessToken);
  if (isTokenExpiring(account.tokenExpiresAt)) {
    const newTokens = await refreshToken(platform, account.refreshToken);
    accessToken = newTokens.accessToken;
    await socialAccountRepository.updateTokens(account.id, newTokens);
  }

  // 5. Publish to platform
  const result = await platformProvider.publish(accessToken, {
    content: post.content,
    mediaUrls: post.mediaUrls,
    authorId: account.platformUserId
  });

  // 6. Update post with result
  await postRepository.update(postId, {
    status: 'published',
    publishedAt: new Date(),
    platformPostId: result.postId,
    platformPostUrl: result.postUrl
  });

  // 7. Send success notification
  await notificationQueue.add('notify', {
    userId,
    type: 'post_published',
    title: 'Post Published',
    message: `Your post was published to ${platform}`,
    data: { postId, platformPostUrl: result.postUrl }
  });

  // 8. Queue analytics fetch (delayed)
  await analyticsQueue.add('fetch-post-metrics', { postId }, { delay: 3600000 }); // 1 hour

  return { success: true, platformPostId: result.postId };
}
```

### Error Handling

```typescript
publishWorker.on('failed', async (job, error) => {
  const { postId, userId } = job.data;
  
  if (job.attemptsMade >= job.opts.attempts) {
    // All retries exhausted
    await postRepository.update(postId, {
      status: 'failed',
      errorMessage: error.message,
      retryCount: job.attemptsMade
    });

    await notificationQueue.add('notify', {
      userId,
      type: 'post_failed',
      title: 'Post Failed to Publish',
      message: `Your post could not be published after ${job.attemptsMade} attempts. Error: ${error.message}`,
      data: { postId, error: error.message }
    });
  }
  // If retries remaining, BullMQ handles automatic retry with backoff
});
```

---

## Retry Strategy

### Exponential Backoff

```
Attempt 1: Immediate (job becomes ready)
Attempt 2: 5 minutes later
Attempt 3: 30 minutes later
Attempt 4: 2 hours later
Maximum attempts: 4
```

### Retry-Worthy Errors (Transient)
- Network timeout
- Platform API 500/502/503 error
- Token refresh transient failure
- Connection reset

### Non-Retryable Errors (Permanent)
- Content policy violation (422)
- Account permanently disconnected
- Invalid permissions (403)
- Post deleted by user during publishing

```typescript
// Custom logic to determine retryability
function shouldRetry(error: Error): boolean {
  if (error instanceof ContentPolicyError) return false;
  if (error instanceof PermissionError) return false;
  if (error instanceof TokenRevokedError) return false;
  return true; // Retry everything else
}
```

---

## Calendar System

### Calendar Data API

```
GET /api/posts/calendar?from=2026-08-01&to=2026-08-31&platform=linkedin

Response:
{
  "data": [
    {
      "id": "post-1",
      "content": "First 100 chars of post...",
      "status": "scheduled",
      "scheduledAt": "2026-08-05T13:00:00Z",
      "platform": "linkedin"
    },
    {
      "id": "post-2",
      "content": "Another post preview...",
      "status": "published",
      "scheduledAt": "2026-08-03T14:00:00Z",
      "publishedAt": "2026-08-03T14:00:12Z",
      "platform": "linkedin"
    }
  ],
  "suggestedSlots": [
    {
      "datetime": "2026-08-06T13:00:00Z",
      "score": 0.88,
      "reason": "High engagement window"
    }
  ]
}
```

### Drag-and-Drop Reschedule

```
PATCH /api/posts/:id/reschedule

Request Body:
{
  "scheduledAt": "2026-08-20T14:00:00Z"
}

Logic:
1. Validate new time is in future
2. Remove old job from queue
3. Update scheduledAt in database
4. Add new job to queue with new delay
5. Return updated post
```

---

## Schedule Pausing (Vacation Mode)

```
POST /api/scheduler/pause

Request Body:
{
  "pauseUntil": "2026-08-20T00:00:00Z",
  "reason": "vacation"  // optional, for audit
}

Behavior:
1. Mark all "scheduled" posts for this user as "paused" (internal status)
2. Remove all pending jobs from queue
3. When pauseUntil arrives (or user manually resumes):
   - Re-queue all paused posts
   - If original scheduledAt has passed, find next optimal time
```

```
POST /api/scheduler/resume

Behavior:
1. Find all paused posts
2. Re-schedule (find new optimal times for past-due posts)
3. Add back to queue
4. Clear pause state
```

---

## Publishing Accuracy

### Timing Guarantee
- Posts should publish within 60 seconds of scheduled time
- Worker polls every 30 seconds for ready jobs
- BullMQ's delay mechanism handles exact timing

### Monitoring
- Track scheduled_vs_actual publish time difference
- Alert if any post publishes > 5 minutes late
- Dashboard metric: "On-time publish rate"

### Clock Synchronization
- All servers use NTP for accurate time
- All times stored and compared in UTC
- User's timezone only used for display and input parsing

---

## Concurrent Publishing Limits

To avoid overwhelming platform APIs:
- Max 5 simultaneous publishes per platform
- Max 2 publishes per user per minute
- Global rate: max 50 publishes per minute across all users
- These are enforced via BullMQ's built-in rate limiter

---

## Scheduled Post Notifications

### Pre-Publish Reminder (Optional, Future)
- "Your post will be published in 1 hour" notification
- Gives user a last chance to review or cancel
- Configurable: on/off in notification settings

### Post-Publish Confirmation
- Immediate notification after successful publish
- Includes link to view post on platform
- Shows in-app + optional email

### Failure Alert
- Immediate notification on final failure
- Includes error reason and suggested action
- Shows retry button in notification
