# Phase 4: Analytics Engine

## Timeline: Months 4-5

## Goals

1. Build analytics data collection from LinkedIn API
2. Create post-level and account-level metrics tracking
3. Build analytics dashboard with charts and insights
4. Implement AI-powered weekly reports
5. Build optimal posting time analysis
6. Deliver the first real "intelligence" layer

---

## Tasks

### 4.1 Analytics Data Collection
- [ ] Create post_metrics table and Prisma model
- [ ] Create account_metrics table and Prisma model
- [ ] Implement analytics worker (consume from analytics-queue)
- [ ] Build LinkedIn metrics fetcher (post-level)
- [ ] Build LinkedIn profile metrics fetcher (follower count)
- [ ] Implement tiered fetch schedule (frequent for new posts, daily for old)
- [ ] Schedule analytics fetch after post publish (1h delay)
- [ ] Set up cron jobs for recurring metrics collection
- [ ] Handle rate limits gracefully during collection
- [ ] Deduplicate metric records (same post, same hour)

### 4.2 Analytics Processing
- [ ] Implement engagement rate calculation
- [ ] Implement growth rate calculation (daily, weekly, monthly)
- [ ] Build time-series aggregation (group by day, week, month)
- [ ] Implement period-over-period comparison logic
- [ ] Build "top performing content" identification algorithm
- [ ] Calculate optimal posting time from historical data
- [ ] Implement performance scoring per post (vs user's average)

### 4.3 Analytics API
- [ ] Implement GET /api/analytics/overview
- [ ] Implement GET /api/analytics/posts (with sorting by metric)
- [ ] Implement GET /api/analytics/growth
- [ ] Implement GET /api/analytics/top-content
- [ ] Implement GET /api/analytics/optimal-times
- [ ] Add time range filtering (7d, 30d, 90d, custom)
- [ ] Add platform filtering
- [ ] Implement caching for expensive aggregations (Redis, 5min TTL)

### 4.4 Weekly Report System
- [ ] Design weekly report data structure
- [ ] Create report generation job (AI worker)
- [ ] Aggregate week's data (posts, metrics, growth)
- [ ] Generate AI analysis of performance
- [ ] Generate AI recommendations for next week
- [ ] Store reports in database
- [ ] Implement GET /api/analytics/reports (list)
- [ ] Implement GET /api/analytics/reports/:id (detail)
- [ ] Send weekly report via email (Monday morning)
- [ ] Create in-app notification when report is ready

### 4.5 AI Insights Engine
- [ ] Build insight generation logic
- [ ] Types: best_time, content_type, posting_frequency, topic_performance
- [ ] Run insight generation weekly (as part of report)
- [ ] Store insights with confidence scores
- [ ] Implement actionable insights (link to AI writer, scheduler)
- [ ] Surface insights on dashboard

### 4.6 Frontend — Analytics Dashboard
- [ ] Create analytics page layout
- [ ] Build time range selector component
- [ ] Build metrics summary cards (impressions, engagement, growth, posts)
- [ ] Build impressions over time chart (Recharts line chart)
- [ ] Build engagement over time chart (Recharts bar chart)
- [ ] Build follower growth chart (Recharts area chart)
- [ ] Build top-performing posts section
- [ ] Build AI insights panel
- [ ] Implement period comparison (vs last period indicators)
- [ ] Add loading states (skeleton components)

### 4.7 Frontend — Post Analytics
- [ ] Add metrics to individual post view
- [ ] Show engagement breakdown (likes, comments, shares)
- [ ] Show impressions over time for single post
- [ ] Show performance vs average comparison
- [ ] Add "Why it worked" AI analysis for top posts

### 4.8 Frontend — Weekly Report Page
- [ ] Create reports list page
- [ ] Create single report view page
- [ ] Display all report sections (summary, top post, insights, recommendations)
- [ ] "Generate content from insight" button
- [ ] Email preview styling

### 4.9 Dashboard Enhancement
- [ ] Replace placeholder stats with real analytics data
- [ ] Add sparkline trends to metric cards
- [ ] Show AI insights section on dashboard
- [ ] Add "this week's performance" summary
- [ ] Show upcoming scheduled posts with expected performance

---

## Deliverables

1. **Metrics collection** running automatically for all published posts
2. **Analytics dashboard** with charts, metrics, and time ranges
3. **Weekly AI reports** delivered via email and in-app
4. **AI insights** surfaced on dashboard with actionable recommendations
5. **Optimal timing** based on real user data
6. **Post-level analytics** showing individual content performance

---

## Definition of Done

- [ ] Post metrics are fetched within 1 hour of publishing
- [ ] Metrics refresh on schedule (4h for recent, daily for older)
- [ ] Analytics dashboard loads in < 2 seconds
- [ ] Charts display accurately for 7d, 30d, 90d ranges
- [ ] Period comparison shows correct % change
- [ ] Top performing posts are correctly identified and ranked
- [ ] Weekly report generates every Monday
- [ ] Report email delivers successfully to users
- [ ] AI insights are relevant and actionable
- [ ] Optimal posting times reflect user's actual data
- [ ] Analytics data is cached (not re-queried on every page load)
- [ ] Dashboard metric cards show real data with trends
