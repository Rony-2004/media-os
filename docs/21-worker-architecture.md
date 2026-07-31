# Worker Architecture

## Overview

AI Social OS uses BullMQ workers for all background processing. Workers run as a separate Node.js process from the API server, consuming jobs from Redis-backed queues. This separation ensures the API stays responsive while heavy processing happens asynchronously.

---

## Worker Process Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Worker Process (apps/worker)               │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                  Queue Registry                          ││
│  │  Connects all queues to Redis, configures workers        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ Publish    │ │ Analytics  │ │ Trend      │              │
│  │ Worker     │ │ Worker     │ │ Worker     │              │
│  │ Concur: 5  │ │ Concur: 3  │ │ Concur: 2  │              │
│  └────────────┘ └────────────┘ └────────────┘              │
│                                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ Comment    │ │ Notif.     │ │ AI         │              │
│  │ Worker     │ │ Worker     │ │ Worker     │              │
│  │ Concur: 3  │ │ Concur: 10 │ │ Concur: 3  │              │
│  └────────────┘ └────────────┘ └────────────┘              │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                  Cron Scheduler                           ││
│  │  Schedules recurring jobs (analytics, trends, reports)   ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Redis                                │
│                                                              │
│  Queues:                                                     │
│  ├── bull:publish-queue:*                                    │
│  ├── bull:analytics-queue:*                                  │
│  ├── bull:trend-queue:*                                      │
│  ├── bull:comment-queue:*                                    │
│  ├── bull:notification-queue:*                               │
│  ├── bull:ai-queue:*                                         │
│  └── bull:dead-letter-queue:*                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Queue Definitions

### Publish Queue

**Purpose**: Publish scheduled posts to social platforms.

```typescript
const publishQueue = new Queue('publish-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 4,
    backoff: { type: 'exponential', delay: 300000 }, // 5 min initial
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 }
  }
});
```

| Config | Value | Reason |
|--------|-------|--------|
| Concurrency | 5 | Balance speed with API rate limits |
| Max Attempts | 4 | Give transient errors time to resolve |
| Backoff | Exponential (5m, 30m, 2h) | Respect platform rate limits |
| Priority | Supports 1-10 | "Publish Now" gets priority 1 |

**Job Data**:
```typescript
{
  postId: string;
  userId: string;
  socialAccountId: string;
  platform: 'linkedin' | 'twitter' | 'instagram';
}
```

---

### Analytics Queue

**Purpose**: Fetch performance metrics from platform APIs.

```typescript
const analyticsQueue = new Queue('analytics-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 60000 },
    removeOnComplete: { count: 5000 },
    removeOnFail: { count: 1000 }
  }
});
```

| Config | Value | Reason |
|--------|-------|--------|
| Concurrency | 3 | Platform API rate limit friendly |
| Max Attempts | 3 | Analytics aren't time-critical |
| Backoff | Exponential (1m, 5m, 25m) | Be gentle with APIs |

**Job Types**:
```typescript
// Fetch metrics for a specific post
{ type: 'fetch-post-metrics', postId: string, userId: string }

// Fetch account-level metrics (daily snapshot)
{ type: 'fetch-account-metrics', socialAccountId: string, userId: string }

// Generate weekly report
{ type: 'generate-weekly-report', userId: string, weekOf: string }
```

---

### Trend Queue

**Purpose**: Monitor trends, analyze competitors, detect opportunities.

```typescript
const trendQueue = new Queue('trend-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 300000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 500 }
  }
});
```

| Config | Value | Reason |
|--------|-------|--------|
| Concurrency | 2 | Trend analysis is heavy, limit load |
| Max Attempts | 2 | Trends are time-sensitive, don't over-retry |
| Backoff | Fixed (5m) | Simple retry for external API issues |

**Job Types**:
```typescript
// Analyze trending topics for user's industry
{ type: 'analyze-trends', userId: string, platform: string }

// Check competitor activity
{ type: 'check-competitors', userId: string }

// Clean up expired trends
{ type: 'cleanup-expired-trends' }
```

---

### Comment Queue

**Purpose**: Fetch comments from platforms and run sentiment analysis.

```typescript
const commentQueue = new Queue('comment-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 60000 },
    removeOnComplete: { count: 2000 },
    removeOnFail: { count: 1000 }
  }
});
```

| Config | Value | Reason |
|--------|-------|--------|
| Concurrency | 3 | Multiple posts can be checked in parallel |
| Max Attempts | 3 | Comments aren't urgent |

**Job Types**:
```typescript
// Fetch comments for a specific post
{ type: 'fetch-comments', postId: string, userId: string }

// Publish a reply to a comment
{ type: 'publish-reply', commentId: string, replyContent: string, userId: string }
```

---

### Notification Queue

**Purpose**: Send in-app and email notifications.

```typescript
const notificationQueue = new Queue('notification-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'fixed', delay: 30000 },
    removeOnComplete: { count: 10000 },
    removeOnFail: { count: 2000 }
  }
});
```

| Config | Value | Reason |
|--------|-------|--------|
| Concurrency | 10 | Notifications should be fast |
| Max Attempts | 3 | Email delivery can be retried |
| Backoff | Fixed (30s) | Quick retry for email delivery |

**Job Data**:
```typescript
{
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
  channels: ('inApp' | 'email')[];
}
```

---

### AI Queue

**Purpose**: Background AI processing (brand memory updates, report generation).

```typescript
const aiQueue = new Queue('ai-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 60000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 500 }
  }
});
```

| Config | Value | Reason |
|--------|-------|--------|
| Concurrency | 3 | AI API calls are expensive, limit parallel |
| Max Attempts | 2 | AI failures are usually not transient |

**Job Types**:
```typescript
// Weekly brand memory recalculation
{ type: 'update-brand-memory', userId: string }

// Generate AI insights from analytics
{ type: 'generate-insights', userId: string }

// Analyze initial posts for brand voice
{ type: 'analyze-initial-voice', userId: string, posts: string[] }
```

---

## Cron Schedulers

### Recurring Job Schedule

```typescript
const cronSchedule = {
  // Every 30 seconds: check for posts to publish
  // (Handled by BullMQ delayed jobs, not cron)
  
  // Every 1 hour: fetch comments for recent posts
  fetchRecentComments: {
    pattern: '0 * * * *',
    job: { type: 'fetch-comments-batch', age: 'recent' }
  },
  
  // Every 4 hours: fetch comments for active posts
  fetchActiveComments: {
    pattern: '0 */4 * * *',
    job: { type: 'fetch-comments-batch', age: 'active' }
  },
  
  // Every 4 hours: fetch post metrics for recent posts
  fetchPostMetrics: {
    pattern: '0 */4 * * *',
    job: { type: 'fetch-metrics-batch', age: 'recent' }
  },
  
  // Daily at midnight UTC: account metric snapshots
  dailyAccountMetrics: {
    pattern: '0 0 * * *',
    job: { type: 'fetch-account-metrics-all' }
  },
  
  // Every 6 hours: trend analysis
  trendAnalysis: {
    pattern: '0 */6 * * *',
    job: { type: 'analyze-trends-all' }
  },
  
  // Every 12 hours: competitor check
  competitorCheck: {
    pattern: '0 */12 * * *',
    job: { type: 'check-competitors-all' }
  },
  
  // Monday 8am UTC: weekly reports
  weeklyReports: {
    pattern: '0 8 * * 1',
    job: { type: 'generate-weekly-reports-all' }
  },
  
  // Sunday midnight: brand memory recalculation
  brandMemoryUpdate: {
    pattern: '0 0 * * 0',
    job: { type: 'update-brand-memories-all' }
  },
  
  // Daily 2am: cleanup expired data
  cleanup: {
    pattern: '0 2 * * *',
    job: { type: 'cleanup' }
  },
  
  // Every 6 hours: check for expiring tokens
  tokenHealthCheck: {
    pattern: '0 */6 * * *',
    job: { type: 'check-token-health' }
  }
};
```

---

## Retry Strategy

### Retry Decision Matrix

| Error Type | Retryable | Strategy |
|-----------|-----------|----------|
| Network timeout | Yes | Exponential backoff |
| 429 Rate limited | Yes | Respect Retry-After header |
| 500 Server error | Yes | Exponential backoff |
| 502/503 Unavailable | Yes | Exponential backoff |
| 401 Unauthorized | Conditional | Refresh token, retry once |
| 403 Forbidden | No | Mark failed, notify user |
| 404 Not found | No | Mark failed, log |
| 422 Validation | No | Mark failed, notify user |
| AI provider down | Yes | Fallback to secondary provider |
| AI content policy | No | Mark failed, notify user |

### Backoff Calculations

```
Exponential: delay * 2^(attempt - 1)
  Attempt 1: 5 minutes
  Attempt 2: 10 minutes  
  Attempt 3: 20 minutes
  Attempt 4: 40 minutes

With jitter (recommended):
  actual_delay = base_delay * 2^(attempt - 1) * (0.5 + random() * 0.5)
```

---

## Dead Letter Queue

Jobs that exhaust all retries are moved to the dead letter queue:

```typescript
const deadLetterQueue = new Queue('dead-letter-queue', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: false, // Keep for inspection
    removeOnFail: false
  }
});
```

**Dead Letter Handling**:
- Admin dashboard shows dead letter count
- Jobs inspectable: see original data, error, attempt history
- Manual retry option from admin
- Auto-cleanup after 30 days
- Alert if dead letter count exceeds threshold (> 50 in 24 hours)

---

## Graceful Shutdown

```typescript
async function gracefulShutdown() {
  console.log('Shutdown signal received...');
  
  // 1. Stop accepting new jobs
  await publishWorker.close();
  await analyticsWorker.close();
  await trendWorker.close();
  await commentWorker.close();
  await notificationWorker.close();
  await aiWorker.close();
  
  // 2. Wait for active jobs to complete (30 second timeout)
  // BullMQ handles this with the close() call
  
  // 3. Close Redis connections
  await redis.quit();
  
  // 4. Close database connections
  await prisma.$disconnect();
  
  console.log('Worker process shut down cleanly');
  process.exit(0);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```

---

## Monitoring

### Queue Health Metrics

```typescript
// Expose via /health/workers endpoint (internal only)
async function getQueueHealth() {
  return {
    publishQueue: {
      waiting: await publishQueue.getWaitingCount(),
      active: await publishQueue.getActiveCount(),
      completed: await publishQueue.getCompletedCount(),
      failed: await publishQueue.getFailedCount(),
      delayed: await publishQueue.getDelayedCount()
    },
    // ... same for other queues
    deadLetter: {
      count: await deadLetterQueue.getWaitingCount()
    }
  };
}
```

### Alerting Rules

| Condition | Severity | Action |
|-----------|----------|--------|
| Queue depth > 1000 | Warning | Scale workers |
| Failed jobs > 50/hour | Warning | Investigate errors |
| Dead letter > 10/hour | Critical | Page on-call |
| Worker not processing for 5min | Critical | Restart worker |
| Job latency > 5min (publish) | Warning | Check platform API |

---

## Scaling Strategy

### Horizontal Scaling

Workers can be scaled independently:
```
# Run multiple worker instances
Instance 1: publish (concur: 5) + notification (concur: 10)
Instance 2: analytics (concur: 3) + comment (concur: 3)
Instance 3: trend (concur: 2) + ai (concur: 3)
```

BullMQ handles job distribution across multiple worker instances automatically — each job is only processed once.

### Auto-Scaling Triggers

```
Scale up when:
  - Queue depth > 500 for > 5 minutes
  - Job processing latency > 2x normal
  - CPU usage > 70% sustained

Scale down when:
  - Queue depth < 50 for > 15 minutes
  - CPU usage < 30% sustained
  - Minimum 1 instance always running
```
