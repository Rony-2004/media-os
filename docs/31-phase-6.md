# Phase 6: Trends & Growth

## Timeline: Months 6-8

## Goals

1. Build trend detection engine
2. Implement competitor monitoring
3. Create content opportunity suggestions
4. Build growth recommendations system
5. Deliver proactive intelligence (AI comes to the user)
6. Refine analytics with deeper AI insights

---

## Tasks

### 6.1 Trend Detection Infrastructure
- [ ] Create trends table and Prisma model
- [ ] Implement trend worker (consume from trend-queue)
- [ ] Build data collection from platform trending topics
- [ ] Build data collection from industry news sources
- [ ] Set up cron: analyze trends every 6 hours per user
- [ ] Implement trend velocity classification (emerging, rising, peaking, declining)
- [ ] Implement trend expiration (auto-expire after relevance window)
- [ ] Clean up expired trends daily

### 6.2 Relevance Scoring
- [ ] Implement relevance scoring algorithm
- [ ] Factor: topic match to user's content pillars
- [ ] Factor: audience interest (based on past engagement data)
- [ ] Factor: trend velocity (rising trends more relevant)
- [ ] Factor: unique angle opportunity (user's expertise overlap)
- [ ] Factor: competitive gap (competitors haven't covered)
- [ ] Only surface trends with relevance > 0.6
- [ ] Sort by relevance score for display

### 6.3 Content Angle Generation
- [ ] For each relevant trend, use AI to suggest content angle
- [ ] Generate suggested hook (first line idea)
- [ ] Consider user's brand voice in angle suggestion
- [ ] Store suggested angle with trend record
- [ ] Allow "Generate Content" directly from trend

### 6.4 Competitor Monitoring
- [ ] Create competitor tracking data model (competitors, competitor_posts)
- [ ] Implement competitor management API (add, list, remove)
- [ ] Build competitor post fetcher (public data only)
- [ ] Analyze competitor posting frequency
- [ ] Identify competitor top-performing content
- [ ] Detect new topics competitors start covering
- [ ] Generate competitor insights (weekly)
- [ ] Plan-gate competitor monitoring (Business+ only)

### 6.5 Trend API
- [ ] Implement GET /api/trends (active trends for user)
- [ ] Implement POST /api/trends/:id/generate (create content from trend)
- [ ] Implement POST /api/trends/:id/dismiss
- [ ] Implement GET /api/trends/competitors
- [ ] Implement POST /api/trends/competitors (add)
- [ ] Implement DELETE /api/trends/competitors/:id
- [ ] Implement GET /api/trends/competitors/insights

### 6.6 Growth Recommendations
- [ ] Build recommendation engine based on analytics patterns
- [ ] Posting frequency recommendations (consistency analysis)
- [ ] Content type recommendations (what formats work best)
- [ ] Topic recommendations (what to write more/less about)
- [ ] Timing recommendations (when to post)
- [ ] Engagement recommendations (reply more, ask questions)
- [ ] Generate recommendations weekly (part of insights)

### 6.7 Trend Notifications
- [ ] Send trend alerts for high-relevance trends
- [ ] Only notify for rising/peaking trends with relevance > 0.7
- [ ] Include suggested angle in notification
- [ ] Limit to max 3 trend alerts per day
- [ ] Configure trend alert preferences in settings

### 6.8 Frontend — Trends Page
- [ ] Create trends page layout
- [ ] Build trend cards (topic, relevance, velocity, suggested angle)
- [ ] Show "time remaining" indicator
- [ ] [Generate Content] button → AI Writer with trend context
- [ ] [Dismiss] button with reason selection
- [ ] Filter by platform
- [ ] Sort by relevance or recency

### 6.9 Frontend — Competitor Section
- [ ] Build competitor management UI (add by URL/handle)
- [ ] Show competitor list with activity summary
- [ ] Show competitor insights cards
- [ ] Display content gap opportunities
- [ ] Show "Competitor A posted about X" alerts

### 6.10 Enhanced Dashboard
- [ ] Add "Trending Now" widget to dashboard
- [ ] Add "Growth Recommendations" section
- [ ] Show content opportunities based on trends
- [ ] Add "Competitor Activity" summary widget

---

## Deliverables

1. **Trend detection** surfacing relevant industry trends
2. **AI-suggested content angles** for trending topics
3. **Competitor monitoring** tracking their content and performance
4. **Growth recommendations** based on data analysis
5. **Proactive notifications** when trends match user's expertise
6. **Content gap analysis** showing opportunities competitors miss

---

## Definition of Done

- [ ] Trends are detected and scored every 6 hours
- [ ] Only relevant trends (score > 0.6) shown to user
- [ ] Each trend has an AI-suggested content angle
- [ ] "Generate Content" from trend produces relevant post
- [ ] Competitor monitoring fetches public posts correctly
- [ ] Competitor insights identify new topics and top content
- [ ] Growth recommendations are based on real analytics data
- [ ] Trend notifications are timely and not spammy (max 3/day)
- [ ] Trends page is useful and actionable
- [ ] Plan limits enforced (competitor count by plan)
- [ ] Expired trends cleaned up automatically
