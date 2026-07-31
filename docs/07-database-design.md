# Database Design

## Overview

AI Social OS uses PostgreSQL as its primary relational database, accessed through Prisma ORM. The schema is designed for:
- Multi-tenancy (user isolation)
- Platform extensibility (adding new social platforms)
- Temporal data (analytics over time)
- AI learning (brand memory accumulation)

---

## Entity Relationship Diagram

```
┌──────────┐     ┌────────────────┐     ┌──────────┐
│   User   │────<│ SocialAccount  │     │   Post   │
└──────────┘     └────────────────┘     └──────────┘
     │                                       │
     │           ┌────────────────┐          │
     └──────────<│  BrandMemory   │          │
     │           └────────────────┘          │
     │                                       │
     │           ┌────────────────┐          │
     └──────────<│  Notification  │     ┌────┴─────┐
     │           └────────────────┘     │PostMetric│
     │                                  └──────────┘
     │           ┌────────────────┐          │
     └──────────<│    Comment     │<─────────┘
                 └────────────────┘
```

---

## Tables

### users

Stores all registered user accounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| password_hash | VARCHAR(255) | NULL | Bcrypt hashed password (null for OAuth-only) |
| name | VARCHAR(100) | NOT NULL | Display name |
| avatar_url | TEXT | NULL | Profile picture URL |
| email_verified | BOOLEAN | DEFAULT false | Email verification status |
| email_verified_at | TIMESTAMP | NULL | When email was verified |
| timezone | VARCHAR(50) | DEFAULT 'UTC' | User's timezone (IANA format) |
| onboarding_completed | BOOLEAN | DEFAULT false | Whether onboarding is done |
| industry | VARCHAR(100) | NULL | User's industry/niche |
| content_goals | JSONB | NULL | Array of selected content goals |
| posting_frequency | VARCHAR(20) | NULL | Preferred posting cadence |
| plan | VARCHAR(20) | DEFAULT 'free' | Subscription plan (free, pro, business, agency) |
| plan_expires_at | TIMESTAMP | NULL | When current plan expires |
| stripe_customer_id | VARCHAR(255) | NULL, UNIQUE | Stripe customer reference |
| stripe_subscription_id | VARCHAR(255) | NULL, UNIQUE | Stripe subscription reference |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last profile update |
| deleted_at | TIMESTAMP | NULL | Soft delete timestamp |

**Indexes**:
- `idx_users_email` — UNIQUE on `email`
- `idx_users_stripe_customer` — on `stripe_customer_id`
- `idx_users_plan` — on `plan`

---

### sessions

Manages active user sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Session identifier |
| user_id | UUID | FK → users.id, NOT NULL | Session owner |
| token | VARCHAR(255) | UNIQUE, NOT NULL | Session token (hashed) |
| expires_at | TIMESTAMP | NOT NULL | Session expiration |
| ip_address | VARCHAR(45) | NULL | Client IP address |
| user_agent | TEXT | NULL | Client user agent |
| created_at | TIMESTAMP | DEFAULT NOW() | Session creation time |

**Indexes**:
- `idx_sessions_token` — UNIQUE on `token`
- `idx_sessions_user_id` — on `user_id`
- `idx_sessions_expires` — on `expires_at`

---

### social_accounts

Stores connected social media platform accounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Account identifier |
| user_id | UUID | FK → users.id, NOT NULL | Account owner |
| platform | VARCHAR(20) | NOT NULL | Platform name (linkedin, twitter, instagram, etc.) |
| platform_user_id | VARCHAR(255) | NOT NULL | User's ID on the platform |
| platform_username | VARCHAR(255) | NULL | Username/handle on platform |
| platform_name | VARCHAR(255) | NULL | Display name on platform |
| platform_avatar_url | TEXT | NULL | Avatar URL from platform |
| access_token | TEXT | NOT NULL | Encrypted OAuth access token |
| refresh_token | TEXT | NULL | Encrypted OAuth refresh token |
| token_expires_at | TIMESTAMP | NULL | Token expiration time |
| scopes | TEXT[] | NULL | Granted OAuth scopes |
| status | VARCHAR(20) | DEFAULT 'active' | Connection status (active, expired, revoked) |
| last_synced_at | TIMESTAMP | NULL | Last successful data sync |
| metadata | JSONB | NULL | Platform-specific metadata |
| created_at | TIMESTAMP | DEFAULT NOW() | Connection time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes**:
- `idx_social_accounts_user_platform` — UNIQUE on `(user_id, platform, platform_user_id)`
- `idx_social_accounts_user_id` — on `user_id`
- `idx_social_accounts_status` — on `status`
- `idx_social_accounts_token_expires` — on `token_expires_at`

**Constraints**:
- `platform` must be one of: linkedin, twitter, instagram, facebook, threads, youtube

---

### posts

Stores all content (drafts, scheduled, published).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Post identifier |
| user_id | UUID | FK → users.id, NOT NULL | Post author |
| social_account_id | UUID | FK → social_accounts.id, NULL | Target social account |
| content | TEXT | NOT NULL | Post content/body |
| platform | VARCHAR(20) | NOT NULL | Target platform |
| status | VARCHAR(20) | DEFAULT 'draft' | Post status |
| scheduled_at | TIMESTAMP | NULL | When to publish |
| published_at | TIMESTAMP | NULL | When actually published |
| platform_post_id | VARCHAR(255) | NULL | Post ID on platform after publishing |
| platform_post_url | TEXT | NULL | URL to post on platform |
| media_urls | TEXT[] | NULL | Attached media URLs |
| hashtags | TEXT[] | NULL | Hashtags used |
| ai_generated | BOOLEAN | DEFAULT false | Whether AI generated this post |
| ai_model | VARCHAR(50) | NULL | Which AI model generated it |
| ai_prompt | TEXT | NULL | Original prompt used for generation |
| generation_feedback | VARCHAR(10) | NULL | User feedback (positive, negative, null) |
| retry_count | INTEGER | DEFAULT 0 | Publish retry attempts |
| error_message | TEXT | NULL | Last publish error |
| metadata | JSONB | NULL | Additional metadata |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes**:
- `idx_posts_user_id` — on `user_id`
- `idx_posts_status` — on `status`
- `idx_posts_scheduled_at` — on `scheduled_at` WHERE status = 'scheduled'
- `idx_posts_user_status` — on `(user_id, status)`
- `idx_posts_user_platform` — on `(user_id, platform)`
- `idx_posts_published_at` — on `published_at`

**Status Values**: draft, scheduled, publishing, published, failed, cancelled

---

### post_metrics

Stores analytics data for published posts (time-series).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Metric record identifier |
| post_id | UUID | FK → posts.id, NOT NULL | Related post |
| user_id | UUID | FK → users.id, NOT NULL | Post owner (denormalized for queries) |
| impressions | INTEGER | DEFAULT 0 | Number of times seen |
| likes | INTEGER | DEFAULT 0 | Like/reaction count |
| comments | INTEGER | DEFAULT 0 | Comment count |
| shares | INTEGER | DEFAULT 0 | Share/repost count |
| clicks | INTEGER | DEFAULT 0 | Click count (links) |
| engagement_rate | DECIMAL(5,4) | NULL | Calculated engagement rate |
| reach | INTEGER | DEFAULT 0 | Unique accounts reached |
| saves | INTEGER | DEFAULT 0 | Save/bookmark count |
| profile_visits | INTEGER | DEFAULT 0 | Profile visits from post |
| followers_gained | INTEGER | DEFAULT 0 | New followers from post |
| fetched_at | TIMESTAMP | DEFAULT NOW() | When metrics were collected |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |

**Indexes**:
- `idx_post_metrics_post_id` — on `post_id`
- `idx_post_metrics_user_id` — on `user_id`
- `idx_post_metrics_fetched_at` — on `fetched_at`
- `idx_post_metrics_post_latest` — on `(post_id, fetched_at DESC)`

**Notes**: Multiple metric records per post (tracked over time to show growth curves).

---

### account_metrics

Stores account-level growth metrics (daily snapshots).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Record identifier |
| social_account_id | UUID | FK → social_accounts.id, NOT NULL | Related account |
| user_id | UUID | FK → users.id, NOT NULL | Account owner |
| date | DATE | NOT NULL | Snapshot date |
| followers_count | INTEGER | DEFAULT 0 | Total followers |
| following_count | INTEGER | DEFAULT 0 | Total following |
| posts_count | INTEGER | DEFAULT 0 | Total posts on platform |
| profile_views | INTEGER | DEFAULT 0 | Profile views today |
| impressions_total | INTEGER | DEFAULT 0 | Total impressions today |
| engagement_total | INTEGER | DEFAULT 0 | Total engagement today |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |

**Indexes**:
- `idx_account_metrics_account_date` — UNIQUE on `(social_account_id, date)`
- `idx_account_metrics_user_date` — on `(user_id, date)`

---

### brand_memories

Stores learned brand voice data for AI generation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Record identifier |
| user_id | UUID | FK → users.id, UNIQUE, NOT NULL | Memory owner |
| voice_config | JSONB | NOT NULL | Manual voice configuration |
| learned_patterns | JSONB | NULL | AI-learned writing patterns |
| vocabulary | JSONB | NULL | Preferred vocabulary and phrases |
| topics | JSONB | NULL | Topic expertise and preferences |
| content_pillars | JSONB | NULL | Defined content pillars |
| tone_profile | JSONB | NULL | Tone analysis results |
| avoid_words | TEXT[] | NULL | Words to never use |
| sample_posts | TEXT[] | NULL | User-provided example posts |
| feedback_history | JSONB | NULL | Generation feedback aggregate |
| last_updated_at | TIMESTAMP | DEFAULT NOW() | Last memory recalculation |
| created_at | TIMESTAMP | DEFAULT NOW() | Initial creation |

**Indexes**:
- `idx_brand_memories_user_id` — UNIQUE on `user_id`

**voice_config JSONB structure**:
```json
{
  "formality": 4,
  "humor": 2,
  "emoji_usage": "light",
  "preferred_length": "medium",
  "cta_style": "question",
  "hashtag_count": 3
}
```

---

### comments

Stores comments fetched from social platforms.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Internal comment identifier |
| post_id | UUID | FK → posts.id, NOT NULL | Parent post |
| user_id | UUID | FK → users.id, NOT NULL | Post owner |
| platform_comment_id | VARCHAR(255) | NOT NULL | Comment ID on platform |
| author_name | VARCHAR(255) | NOT NULL | Commenter's name |
| author_profile_url | TEXT | NULL | Commenter's profile URL |
| author_avatar_url | TEXT | NULL | Commenter's avatar |
| content | TEXT | NOT NULL | Comment text |
| sentiment | VARCHAR(20) | NULL | Detected sentiment (positive, neutral, negative) |
| sentiment_score | DECIMAL(3,2) | NULL | Sentiment confidence score |
| is_question | BOOLEAN | DEFAULT false | Whether comment is a question |
| replied | BOOLEAN | DEFAULT false | Whether we've replied |
| reply_content | TEXT | NULL | Our reply content |
| replied_at | TIMESTAMP | NULL | When we replied |
| priority | INTEGER | DEFAULT 0 | Comment priority (higher = more important) |
| platform_created_at | TIMESTAMP | NULL | When comment was posted on platform |
| fetched_at | TIMESTAMP | DEFAULT NOW() | When we fetched this |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |

**Indexes**:
- `idx_comments_post_id` — on `post_id`
- `idx_comments_user_id` — on `user_id`
- `idx_comments_user_replied` — on `(user_id, replied)`
- `idx_comments_platform_id` — UNIQUE on `(post_id, platform_comment_id)`
- `idx_comments_priority` — on `priority DESC`

---

### notifications

Stores in-app notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Notification identifier |
| user_id | UUID | FK → users.id, NOT NULL | Notification recipient |
| type | VARCHAR(50) | NOT NULL | Notification type |
| title | VARCHAR(255) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification body |
| data | JSONB | NULL | Additional structured data |
| read | BOOLEAN | DEFAULT false | Read status |
| read_at | TIMESTAMP | NULL | When marked as read |
| action_url | TEXT | NULL | URL to navigate to on click |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

**Indexes**:
- `idx_notifications_user_id` — on `user_id`
- `idx_notifications_user_unread` — on `(user_id, read)` WHERE read = false
- `idx_notifications_created_at` — on `created_at DESC`

**Notification Types**: post_published, post_failed, comment_received, weekly_report, trend_alert, token_expiring, plan_limit_reached

---

### trends

Stores detected trends and content opportunities.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Trend identifier |
| user_id | UUID | FK → users.id, NOT NULL | Relevant user |
| platform | VARCHAR(20) | NOT NULL | Platform where trend detected |
| topic | VARCHAR(255) | NOT NULL | Trend topic |
| description | TEXT | NULL | Trend description/context |
| relevance_score | DECIMAL(3,2) | NOT NULL | How relevant to user (0-1) |
| velocity | VARCHAR(20) | NULL | Trend speed (rising, peaking, declining) |
| suggested_angle | TEXT | NULL | AI-suggested content angle |
| source | VARCHAR(50) | NULL | Where trend was detected |
| expires_at | TIMESTAMP | NULL | When trend is no longer relevant |
| acted_on | BOOLEAN | DEFAULT false | Whether user created content for this |
| created_at | TIMESTAMP | DEFAULT NOW() | Detection time |

**Indexes**:
- `idx_trends_user_id` — on `user_id`
- `idx_trends_user_relevant` — on `(user_id, relevance_score DESC)`
- `idx_trends_expires` — on `expires_at`

---

### ai_generations

Tracks AI content generation history for analytics and cost tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Generation identifier |
| user_id | UUID | FK → users.id, NOT NULL | Requesting user |
| provider | VARCHAR(20) | NOT NULL | AI provider used (openai, anthropic) |
| model | VARCHAR(50) | NOT NULL | Specific model (gpt-4o, claude-3.5-sonnet) |
| prompt_tokens | INTEGER | NOT NULL | Input tokens used |
| completion_tokens | INTEGER | NOT NULL | Output tokens used |
| total_tokens | INTEGER | NOT NULL | Total tokens |
| estimated_cost | DECIMAL(10,6) | NOT NULL | Estimated cost in USD |
| prompt_type | VARCHAR(50) | NOT NULL | Type of generation |
| success | BOOLEAN | DEFAULT true | Whether generation succeeded |
| latency_ms | INTEGER | NULL | Response time in milliseconds |
| created_at | TIMESTAMP | DEFAULT NOW() | Generation time |

**Indexes**:
- `idx_ai_generations_user_id` — on `user_id`
- `idx_ai_generations_user_date` — on `(user_id, created_at)`
- `idx_ai_generations_provider` — on `provider`

**Prompt Types**: content_generation, reply_generation, trend_analysis, report_generation, brand_analysis

---

### email_verification_tokens

Temporary tokens for email verification.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Token record identifier |
| user_id | UUID | FK → users.id, NOT NULL | Token owner |
| token | VARCHAR(255) | UNIQUE, NOT NULL | Verification token (hashed) |
| expires_at | TIMESTAMP | NOT NULL | Token expiration (24 hours) |
| used_at | TIMESTAMP | NULL | When token was used |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

**Indexes**:
- `idx_email_tokens_token` — UNIQUE on `token`
- `idx_email_tokens_user` — on `user_id`

---

### password_reset_tokens

Temporary tokens for password reset.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Token record identifier |
| user_id | UUID | FK → users.id, NOT NULL | Token owner |
| token | VARCHAR(255) | UNIQUE, NOT NULL | Reset token (hashed) |
| expires_at | TIMESTAMP | NOT NULL | Token expiration (1 hour) |
| used_at | TIMESTAMP | NULL | When token was used |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

**Indexes**:
- `idx_password_tokens_token` — UNIQUE on `token`
- `idx_password_tokens_user` — on `user_id`

---

## Future Tables (Planned)

### teams (Phase 8)
For multi-user collaboration on accounts.

### team_members (Phase 8)
User-team relationships with roles.

### competitors (Phase 6)
Competitor profiles being monitored.

### competitor_posts (Phase 6)
Tracked competitor content.

### scheduled_slots (Phase 3)
User-defined recurring time slots for auto-scheduling.

### webhook_events (Phase 8)
Incoming webhook event log.

### audit_log (Phase 8)
Security and compliance audit trail.

---

## Migration Strategy

### Approach
- Prisma Migrate for schema changes
- One migration per feature/change
- Always write reversible migrations
- Never modify existing migration files
- Test migrations against production-like data

### Migration Naming Convention
```
YYYYMMDDHHMMSS_description
```
Examples:
- `20260801120000_init`
- `20260815090000_add_post_metrics`
- `20260901140000_add_trends_table`

### Data Migration Guidelines
1. Add new columns as nullable first
2. Deploy code that writes to new columns
3. Backfill existing data
4. Add NOT NULL constraint if needed
5. Remove old columns in a later migration

### Seed Data
Development seeds include:
- 3 test users (free, pro, business plans)
- Social accounts (mock LinkedIn connections)
- 50 posts in various states
- Analytics data for chart testing
- Sample brand memory profiles
- Notifications in read/unread states

---

## Performance Considerations

### Connection Pooling
- Use PgBouncer or Prisma's built-in pool
- Max connections: 20 per app instance
- Idle timeout: 10 seconds

### Query Optimization
- Use `SELECT` only needed columns for list queries
- Pagination: cursor-based for infinite scroll, offset-based for pages
- Denormalize `user_id` on child tables to avoid JOINs in common queries
- Use partial indexes for filtered queries (e.g., scheduled posts only)

### Data Retention
- Post metrics: Keep all (time-series data is valuable)
- Account metrics: Keep all daily snapshots
- Notifications: Delete after 90 days
- AI generations log: Keep 12 months
- Expired tokens: Delete after 24 hours (cron job)
- Trends: Delete after 30 days if not acted upon
