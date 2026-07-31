# Trend Engine

## Overview

The Trend Engine monitors industry trends, viral content patterns, and competitor activity to surface timely content opportunities. It proactively suggests topics the user should post about while they're still relevant.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Trend Engine                            │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Data         │  │ Analysis     │  │ Delivery     │  │
│  │ Collection   │→ │ Pipeline     │→ │ System       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  Sources:           Processing:        Outputs:          │
│  • Platform feeds   • Relevance scoring • Notifications  │
│  • News APIs       • Velocity detection • Content ideas  │
│  • Competitor posts • Clustering         • Dashboard     │
│  • Hashtag data    • AI summarization    • Weekly digest  │
└─────────────────────────────────────────────────────────┘
```

---

## Data Sources

### 1. Platform Trending Topics
- LinkedIn trending articles and hashtags
- X (Twitter) trending topics and hashtags
- Platform-specific APIs for trending content

### 2. Industry News Monitoring
- RSS feeds for industry publications
- News API for relevant articles
- Blog aggregators in user's niche

### 3. Competitor Activity
- Track posts from user-defined competitors
- Detect when competitors post about new topics
- Identify competitor content that goes viral

### 4. Hashtag Velocity
- Track hashtag usage growth over time
- Detect sudden spikes in hashtag usage
- Identify emerging hashtags before they peak

### 5. Viral Content Patterns
- Monitor posts with unusual engagement velocity
- Detect content formats that are trending
- Identify recurring viral structures

---

## Trend Detection Algorithm

### Step 1: Data Collection (Scheduled)

```
Cron: Every 6 hours per user
  1. Fetch trending topics from connected platforms
  2. Fetch latest competitor posts (if configured)
  3. Check industry news feeds
  4. Monitor tracked hashtags
```

### Step 2: Relevance Scoring

```
For each detected trend:
  relevanceScore = weightedSum(
    topicMatch     * 0.35,  // Does trend match user's expertise?
    audienceMatch  * 0.25,  // Would user's audience care?
    timeliness     * 0.20,  // Is trend still rising?
    uniqueAngle    * 0.10,  // Can user add unique perspective?
    competitorGap  * 0.10   // Are competitors NOT covering this?
  )

  // topicMatch: Compare trend keywords to user's content pillars and expertise
  // audienceMatch: Compare to topics that get engagement for this user
  // timeliness: Is velocity rising, peaking, or declining?
  // uniqueAngle: Does user's expertise overlap with trend?
  // competitorGap: Have competitors already posted about this?
```

### Step 3: Velocity Classification

```
Velocity States:
  EMERGING:  Growing slowly, still early (< 24 hours old, < 500 mentions)
  RISING:    Growing fast, good timing to join (24-72 hours, 500-5000 mentions)
  PEAKING:   Maximum attention, high competition (72-168 hours, > 5000 mentions)
  DECLINING: Past peak, less valuable to post about (> 7 days, decreasing)
```

### Step 4: Content Angle Generation

```
For trends with relevanceScore > 0.6:
  Use AI to generate a suggested content angle:
  
  Prompt: "Given this trending topic: {trend}
           And this user's expertise: {user_pillars}
           And their brand voice: {voice_summary}
           
           Suggest a unique angle they could take for a {platform} post.
           The angle should leverage their specific expertise.
           It should NOT be a generic take that anyone could write."
  
  Output: 1-2 sentence suggested angle + hook idea
```

---

## Competitor Monitoring

### Setup

```
POST /api/trends/competitors

Request Body:
{
  "competitors": [
    {
      "name": "Competitor A",
      "platform": "linkedin",
      "profileUrl": "https://linkedin.com/in/competitor-a"
    },
    {
      "name": "Competitor B",
      "platform": "twitter",
      "handle": "@competitorb"
    }
  ]
}

Limits by plan:
  Pro: 3 competitors
  Business: 10 competitors
  Agency: 25 competitors
```

### Monitoring Logic

```
Every 12 hours per competitor:
  1. Fetch their recent posts (public data only)
  2. Compare to their historical posting patterns
  3. Detect:
     - New topics they're covering
     - Posts with unusually high engagement
     - Changes in posting frequency
     - New formats they're trying
  4. Score relevance to user
  5. Surface insights: "Competitor A just posted about {topic} and got 5x their average engagement"
```

### Competitor Insights

```json
{
  "competitor": "Competitor A",
  "insights": [
    {
      "type": "viral_post",
      "description": "Their post about 'AI replacing marketers' got 10x average engagement",
      "implication": "Your audience likely cares about this topic too",
      "suggestedAction": "Share your perspective on AI in marketing"
    },
    {
      "type": "new_topic",
      "description": "They started posting about 'personal branding' (3 posts this week)",
      "implication": "This topic is gaining traction in your space",
      "suggestedAction": "Consider adding personal branding to your content mix"
    },
    {
      "type": "frequency_change",
      "description": "They increased from 3x/week to daily posting",
      "implication": "They may be investing more in content marketing",
      "suggestedAction": "Review your posting frequency"
    }
  ]
}
```

---

## API Endpoints

### Get Trends for User

```
GET /api/trends?status=active&minRelevance=0.6

Response:
{
  "data": [
    {
      "id": "trend-uuid",
      "topic": "AI agents replacing SaaS tools",
      "description": "Discussion about AI agents that can replace traditional software subscriptions",
      "platform": "linkedin",
      "relevanceScore": 0.85,
      "velocity": "rising",
      "suggestedAngle": "Share your perspective as a SaaS founder on how AI agents complement rather than replace tools",
      "suggestedHook": "Everyone says AI agents will kill SaaS. Here's why I disagree (as someone building both):",
      "source": "linkedin_trending",
      "detectedAt": "2026-08-01T06:00:00Z",
      "expiresAt": "2026-08-04T06:00:00Z",
      "actedOn": false
    }
  ],
  "pagination": { ... }
}
```

### Get Competitor Insights

```
GET /api/trends/competitors/insights?period=7d

Response:
{
  "data": {
    "competitors": [
      {
        "name": "Competitor A",
        "postsThisWeek": 5,
        "avgEngagement": 234,
        "topPost": {
          "content": "Preview...",
          "engagement": 1250,
          "topic": "AI in marketing"
        },
        "newTopics": ["personal branding", "AI agents"],
        "insights": [...]
      }
    ],
    "opportunities": [
      {
        "type": "content_gap",
        "description": "None of your competitors are posting about {topic} despite high search interest",
        "suggestedAction": "Be the first to cover this in your niche"
      }
    ]
  }
}
```

### Act on Trend (Generate Content)

```
POST /api/trends/:id/generate

Request Body:
{
  "platform": "linkedin",
  "format": "opinion",
  "tone": "professional"
}

// Uses the trend's suggested angle as context for AI generation
// Marks trend as "acted_on" after content is generated

Response: Same as POST /api/ai/generate
```

### Dismiss Trend

```
POST /api/trends/:id/dismiss

Request Body:
{
  "reason": "not_relevant"  // not_relevant | already_covered | too_late
}
```

---

## Trend Notifications

### Alert Criteria
Only notify for trends that:
- Relevance score > 0.7
- Velocity is "rising" or "peaking"
- User hasn't posted about this topic in last 7 days
- Trend is less than 48 hours old

### Notification Content

```json
{
  "type": "trend_alert",
  "title": "Trending in your niche",
  "message": "'AI agents vs SaaS' is trending on LinkedIn. Your SaaS expertise makes you perfect to weigh in.",
  "data": {
    "trendId": "trend-uuid",
    "suggestedAngle": "...",
    "timeRemaining": "~48 hours of relevance"
  },
  "actionUrl": "/trends/trend-uuid"
}
```

---

## Trend Worker Configuration

```typescript
// Trend analysis schedule
const trendScheduler = new CronJob({
  // Fetch trending data every 6 hours
  trendFetch: '0 */6 * * *',
  
  // Competitor check every 12 hours
  competitorCheck: '0 */12 * * *',
  
  // Clean up expired trends daily
  cleanup: '0 2 * * *',
  
  // Generate weekly trend summary (Sunday evening)
  weeklySummary: '0 20 * * 0'
});
```

---

## Data Retention

| Data | Retention |
|------|-----------|
| Active trends | Until expired or dismissed |
| Expired trends | 30 days (for analytics) |
| Competitor posts | 90 days |
| Competitor insights | 30 days |
| Trend performance (if acted on) | Linked to post, indefinite |

---

## Future Enhancements

### Real-Time Trend Detection (Phase 8+)
- WebSocket updates for breaking trends
- Sub-hour detection of viral content
- Instant content generation for timely posts

### Predictive Trends
- Predict which emerging topics will become major trends
- Early detection gives users first-mover advantage
- Machine learning on historical trend data

### Industry Benchmark Reports
- Monthly report: "How does your content compare to industry averages?"
- Topic share analysis: which topics dominate in your niche
- Format evolution: what content formats are gaining traction
