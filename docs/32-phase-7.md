# Phase 7: Multi-Platform Expansion

## Timeline: Months 8-10

## Goals

1. Integrate X (Twitter) as second platform
2. Integrate Instagram, Facebook, and Threads
3. Implement cross-platform content repurposing
4. Adapt all features for multi-platform (analytics, comments, trends)
5. Build platform-specific AI generation rules
6. Ensure abstraction layer handles all platforms cleanly

---

## Tasks

### 7.1 Platform Abstraction Layer
- [ ] Refactor LinkedIn provider to implement shared interface
- [ ] Create SocialPlatformProvider interface:
  - authenticate()
  - publishPost()
  - getPostMetrics()
  - getComments()
  - replyToComment()
  - getProfileMetrics()
  - refreshToken()
- [ ] Create platform registry (factory pattern for provider lookup)
- [ ] Ensure all workers use platform abstraction (not LinkedIn-specific calls)
- [ ] Test abstraction with LinkedIn to verify no regressions

### 7.2 X (Twitter) Integration
- [ ] Register Twitter Developer account and app
- [ ] Implement Twitter OAuth 2.0 flow (PKCE)
- [ ] Implement Twitter provider (publish, metrics, comments)
- [ ] Handle Twitter-specific content rules (280 chars, threads)
- [ ] Implement thread publishing (multi-tweet posts)
- [ ] Fetch Twitter analytics (impressions, likes, retweets)
- [ ] Fetch Twitter replies
- [ ] Handle Twitter API rate limits (different structure)
- [ ] Update AI prompts for Twitter-specific formatting
- [ ] Test end-to-end: connect → create → publish → analyze

### 7.3 Instagram Integration
- [ ] Register Facebook/Instagram developer app
- [ ] Implement Instagram Graph API OAuth (via Facebook)
- [ ] Implement Instagram provider
- [ ] Handle Instagram requirement: image is mandatory
- [ ] Implement image upload for Instagram posts
- [ ] Handle Instagram carousel posts (multiple images)
- [ ] Fetch Instagram insights (reach, impressions, engagement)
- [ ] Fetch Instagram comments
- [ ] Handle Instagram's unique content style in AI prompts
- [ ] Handle Instagram hashtag limits (30 max)

### 7.4 Facebook Integration
- [ ] Implement Facebook OAuth (page-level publishing)
- [ ] Implement Facebook provider (pages, not personal profiles)
- [ ] Handle Facebook page publishing
- [ ] Fetch Facebook page insights
- [ ] Fetch Facebook post comments
- [ ] Handle Facebook's content limits and formatting

### 7.5 Threads Integration
- [ ] Implement Threads API OAuth
- [ ] Implement Threads provider
- [ ] Handle Threads content rules (500 chars)
- [ ] Publish to Threads
- [ ] Fetch Threads metrics
- [ ] Fetch Threads replies

### 7.6 Cross-Platform Publishing
- [ ] Allow selecting multiple platforms for a single post
- [ ] AI automatically adapts content per platform:
  - LinkedIn: full length, professional tone
  - Twitter: concise, hook-first, thread if long
  - Instagram: visual-first, hashtag-heavy, caption style
  - Facebook: more casual, link-friendly
  - Threads: short, conversational
- [ ] Platform-specific preview for each version
- [ ] Independent scheduling per platform (different optimal times)
- [ ] Cross-platform post linking (track versions of same content)
- [ ] UI: multi-platform selector with per-platform preview tabs

### 7.7 Multi-Platform Analytics
- [ ] Aggregate analytics across all platforms
- [ ] Show per-platform breakdown in analytics dashboard
- [ ] Cross-platform comparison (which platform performs best)
- [ ] Platform selector on all analytics views
- [ ] Unified metrics: normalize impressions/engagement across platforms
- [ ] Weekly report includes all platforms

### 7.8 Multi-Platform Comments
- [ ] Comment inbox shows comments from all platforms
- [ ] Platform indicator on each comment
- [ ] Reply through correct platform API
- [ ] Filter by platform in inbox
- [ ] Priority scoring considers platform context

### 7.9 Multi-Platform Trends
- [ ] Trend engine monitors all connected platforms
- [ ] Platform-specific trending topics
- [ ] Cross-platform trend correlation (topic trending on multiple platforms)
- [ ] Platform recommendation: "This topic does better on LinkedIn than Twitter"

### 7.10 Frontend Updates
- [ ] Add platform connection buttons for new platforms (settings)
- [ ] Multi-platform selector in post editor
- [ ] Platform tabs in content preview
- [ ] Platform filter across all pages (posts, analytics, calendar, inbox)
- [ ] Platform icons consistently throughout UI
- [ ] Cross-platform post creation flow
- [ ] Update AI Writer with platform selector

---

## Deliverables

1. **X (Twitter)** fully integrated (OAuth, publish, analytics, comments)
2. **Instagram** integrated (OAuth, publish with image, analytics)
3. **Facebook** page publishing integrated
4. **Threads** basic integration (publish, metrics)
5. **Cross-platform repurposing** AI adapts content per platform
6. **Unified analytics** across all platforms
7. **Multi-platform inbox** for comments
8. **Platform abstraction** making future platforms easy to add

---

## Definition of Done

- [ ] User can connect X, Instagram, Facebook, and Threads accounts
- [ ] User can publish to any connected platform
- [ ] AI adapts content for each platform's style and limits
- [ ] Cross-platform post creates platform-specific versions
- [ ] Analytics show data from all platforms
- [ ] Comment inbox includes comments from all platforms
- [ ] Platform filter works across all views
- [ ] Each platform's API rate limits are respected
- [ ] Token refresh works for all platforms
- [ ] New platform can be added by implementing provider interface
- [ ] All platform-specific tests pass
- [ ] No regression in LinkedIn functionality

---

## Platform-Specific Notes

### X (Twitter)
- API v2 (OAuth 2.0 with PKCE)
- Free tier: 1,500 tweets/month, read-only analytics
- Basic tier ($100/month): full analytics, higher limits
- Consider using basic tier for the product

### Instagram
- Requires Facebook Business account
- Image is mandatory (no text-only posts)
- Content Publishing API limits: 25 posts per 24 hours
- Reels support (future enhancement)

### Facebook
- Page publishing (not personal profile)
- Requires page admin permissions
- Rich link preview support
- Longer content allowed

### Threads
- Relatively new API (launched 2024)
- Simpler API than other Meta products
- 500 character limit
- No scheduling API (publish directly)
