# Analytics Engine

## Overview

The analytics engine collects, stores, and presents performance data from connected social platforms. It tracks both post-level metrics and account-level growth, using AI to surface actionable insights.

---

## Data Collection Architecture

```
┌─────────────────────────────────────────────┐
│              Analytics Worker                 │
│                                              │
│  Scheduled Jobs (Cron):                      │
│  • Fetch post metrics (every 4 hours)        │
│  • Fetch account metrics (daily)             │
│  • Generate weekly report (Monday 8am)       │
│                                              │
│  Event-Triggered Jobs:                       │
│  • Post published → queue first fetch (1hr)  │
│  • User connects account → initial sync      │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│             Platform APIs                    │
│  LinkedIn, Twitter, Instagram, etc.          │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│             PostgreSQL                        │
│  post_metrics (time-series snapshots)        │
│  account_metrics (daily snapshots)           │
└─────────────────────────────────────────────┘
```

---

## Metrics Collected

### Post-Level Metrics

| Metric | Description | Source |
|--------|-------------|--------|
| impressions | Times the post was displayed | Platform API |
| reach | Unique accounts that saw the post | Platform API |
| likes | Reactions/likes received | Platform API |
| comments | Comment count | Platform API |
| shares | Reposts/shares count | Platform API |
| clicks | Link clicks (if applicable) | Platform API |
| saves | Bookmarks/saves | Platform API |
| profile_visits | Profile visits attributed to post | Platform API |
| followers_gained | New followers from post | Platform API |
| engagement_rate | (likes + comments + shares) / impressions | Calculated |

### Account-Level Metrics (Daily)

| Metric | Description |
|--------|-------------|
| followers_count | Total follower count |
| following_count | Total following count |
| posts_count | Total posts on platform |
| profile_views | Profile views that day |
| impressions_total | Total impressions that day |
| engagement_total | Total engagement actions that day |

### Derived Metrics (Calculated)

| Metric | Formula |
|--------|---------|
| Engagement Rate | (likes + comments + shares) / impressions |
| Growth Rate (weekly) | (followers_end - followers_start) / followers_start |
| Average Engagement | Sum of engagement / posts published in period |
| Best Time to Post | Time slot with highest avg engagement |
| Content Performance Score | Weighted score across all metrics |
| Consistency Score | Posts published / target frequency |

---

## Data Fetching Schedule

### Post Metrics Fetching

```
Post Published
  ├── +1 hour: First fetch
  ├── +4 hours: Second fetch
  ├── +8 hours: Third fetch
  ├── +24 hours: Day 1 fetch
  ├── +48 hours: Day 2 fetch
  ├── Daily for 7 days
  ├── Every 3 days until day 30
  └── Final fetch at day 30 (archival snapshot)
```

**Rationale**: Most engagement happens in first 24-48 hours. Frequent early fetching captures the growth curve.

### Account Metrics Fetching

```
Daily at 00:00 UTC (or user's midnight):
  - Fetch current follower count
  - Fetch profile views (if available)
  - Calculate daily deltas
  - Store as daily snapshot
```

---

## Analytics API Endpoints

### Dashboard Overview

```
GET /api/analytics/overview?period=30d

Response:
{
  "data": {
    "period": {
      "from": "2026-07-01T00:00:00Z",
      "to": "2026-07-31T00:00:00Z"
    },
    "summary": {
      "totalImpressions": 45600,
      "totalEngagement": 1250,
      "totalPosts": 22,
      "averageEngagementRate": 0.027,
      "followersGained": 156,
      "followersGainedPercent": 4.2
    },
    "comparison": {
      "impressionsChange": 12.5,
      "engagementChange": -3.2,
      "postsChange": 10.0,
      "followersChange": 18.0
    },
    "charts": {
      "impressionsOverTime": [
        { "date": "2026-07-01", "value": 1200 },
        { "date": "2026-07-02", "value": 1450 },
        ...
      ],
      "engagementOverTime": [...],
      "followersOverTime": [...]
    }
  }
}

Query Parameters:
- period: 7d | 30d | 90d | custom
- from: start date (for custom period)
- to: end date (for custom period)
- platform: linkedin | twitter | all
- accountId: specific account (optional)
```

### Post Performance

```
GET /api/analytics/posts?period=30d&sort=engagement:desc&limit=10

Response:
{
  "data": {
    "posts": [
      {
        "id": "post-uuid",
        "content": "First 150 chars...",
        "platform": "linkedin",
        "publishedAt": "2026-07-15T09:00:00Z",
        "metrics": {
          "impressions": 5200,
          "likes": 128,
          "comments": 34,
          "shares": 22,
          "engagementRate": 0.035
        },
        "performanceLabel": "top_performer"
      }
    ],
    "averages": {
      "avgImpressions": 2073,
      "avgLikes": 58,
      "avgComments": 15,
      "avgEngagementRate": 0.027
    }
  }
}
```

### Growth Metrics

```
GET /api/analytics/growth?period=90d

Response:
{
  "data": {
    "currentFollowers": 3850,
    "startFollowers": 3200,
    "netGrowth": 650,
    "growthRate": 20.3,
    "dailyAverage": 7.2,
    "projectedMonthlyGrowth": 216,
    "growthChart": [
      { "date": "2026-05-01", "followers": 3200 },
      { "date": "2026-05-02", "followers": 3208 },
      ...
    ],
    "milestones": [
      { "followers": 5000, "estimatedDate": "2026-12-15", "label": "5K followers" }
    ]
  }
}
```

### Best Performing Content

```
GET /api/analytics/top-content?period=30d&limit=5

Response:
{
  "data": [
    {
      "postId": "uuid",
      "content": "Preview...",
      "publishedAt": "2026-07-10T09:00:00Z",
      "metrics": { ... },
      "analysis": {
        "whyItWorked": "Personal story format with a clear lesson. Posted at peak engagement time. Strong hook in first line.",
        "contentType": "personal_story",
        "topicCategory": "leadership",
        "postLength": "long"
      }
    }
  ]
}
```

### Optimal Posting Times

```
GET /api/analytics/optimal-times?platform=linkedin

Response:
{
  "data": {
    "bestTimes": [
      {
        "dayOfWeek": "tuesday",
        "hour": 9,
        "timezone": "America/New_York",
        "avgEngagement": 0.042,
        "confidence": 0.88,
        "sampleSize": 12
      },
      {
        "dayOfWeek": "thursday",
        "hour": 12,
        "timezone": "America/New_York",
        "avgEngagement": 0.038,
        "confidence": 0.82,
        "sampleSize": 8
      }
    ],
    "heatmap": {
      "monday": [0.01, 0.01, 0.01, ..., 0.03, 0.04, 0.02],  // 24 values
      "tuesday": [...],
      ...
    },
    "recommendation": "Your audience is most active Tuesday-Thursday between 9am-1pm EST. Avoid weekends."
  }
}
```

---

## AI Insights Engine

### Insight Generation

The AI analyzes analytics data weekly to generate actionable insights:

```typescript
interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  actionable: boolean;
  action?: {
    label: string;
    type: 'create_post' | 'change_schedule' | 'update_strategy';
    data: Record<string, any>;
  };
  confidence: number;
  generatedAt: Date;
}
```

### Insight Types

| Type | Example |
|------|---------|
| `best_time` | "Your posts at 9am EST get 40% more engagement than afternoon posts" |
| `content_type` | "How-to posts outperform opinion posts by 2.3x in comments" |
| `posting_frequency` | "You posted 3x this week vs 5x last week. Consistency dropped." |
| `topic_performance` | "Posts about AI get 60% more impressions than posts about management" |
| `engagement_trend` | "Your engagement rate has increased 15% over the past 4 weeks" |
| `growth_opportunity` | "You haven't posted about [trending topic]. Your audience engages with similar content." |
| `fatigue_warning` | "You've posted about the same topic 4 times this week. Consider varying." |

### Weekly Report Generation

```
Job: generate-weekly-report
Schedule: Monday 8:00 AM user's timezone
Process:
  1. Aggregate past 7 days of metrics
  2. Compare to previous 7 days
  3. Identify top/bottom performers
  4. Calculate growth rates
  5. Generate AI insights
  6. Store report in database
  7. Send email notification
  8. Create in-app notification
```

**Report Structure**:
```json
{
  "weekOf": "2026-07-28",
  "summary": {
    "postsPublished": 5,
    "totalImpressions": 12500,
    "totalEngagement": 340,
    "newFollowers": 42,
    "avgEngagementRate": 0.027
  },
  "vsLastWeek": {
    "impressionsChange": "+15%",
    "engagementChange": "+8%",
    "followersChange": "+12%"
  },
  "topPost": {
    "postId": "uuid",
    "preview": "The 5 things I learned...",
    "impressions": 4200,
    "whyItWorked": "Strong hook + list format + posted at optimal time"
  },
  "insights": [...],
  "recommendations": [
    "Post more personal stories — they got 2x engagement this week",
    "Try posting on Wednesday — you skipped it but it's usually your best day",
    "Your audience loves questions — end 2 posts this week with a question"
  ]
}
```

---

## Analytics Caching

### Cache Strategy

| Data | Cache TTL | Invalidation |
|------|-----------|-------------|
| Dashboard overview | 5 minutes | On new metrics fetch |
| Post metrics (individual) | 15 minutes | On metrics update |
| Account growth data | 1 hour | On daily snapshot |
| Weekly report | 7 days | On new report generation |
| Optimal times | 24 hours | On new analytics data |
| AI insights | 24 hours | On weekly regeneration |

### Cache Keys

```
analytics:overview:{userId}:{period}:{platform}
analytics:post:{postId}:latest
analytics:growth:{userId}:{period}
analytics:report:{userId}:{weekOf}
analytics:optimal-times:{userId}:{platform}
analytics:insights:{userId}
```

---

## Data Retention

| Data Type | Retention | Reason |
|-----------|-----------|--------|
| Post metrics snapshots | Indefinite | Time-series valuable for long-term trends |
| Account daily snapshots | Indefinite | Growth tracking over time |
| Weekly reports | 1 year | Historical reference |
| AI insights | 90 days | Actionable only when fresh |
| Raw API responses | 7 days | Debugging only |

---

## Export Capabilities (Future)

### CSV Export
```
GET /api/analytics/export?format=csv&period=30d

Returns downloadable CSV with:
- One row per post
- Columns: date, content_preview, impressions, likes, comments, shares, engagement_rate
```

### PDF Report (Future)
- Branded weekly/monthly report
- Charts and graphs embedded
- Suitable for client presentations (agency plan)
