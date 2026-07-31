# Phase 5: Engagement Agent

## Timeline: Months 5-6

## Goals

1. Build comment fetching from LinkedIn
2. Implement sentiment analysis on comments
3. Create unified comment inbox UI
4. Build AI reply suggestion system
5. Implement reply publishing back to platform
6. Priority scoring for efficient engagement management

---

## Tasks

### 5.1 Comment Data Collection
- [ ] Create comments table and Prisma model
- [ ] Implement comment worker (consume from comment-queue)
- [ ] Build LinkedIn comment fetcher (GET /socialActions/{post}/comments)
- [ ] Set up tiered fetch schedule (hourly for recent, daily for older)
- [ ] Deduplicate comments (by platform_comment_id)
- [ ] Store comment metadata (author, content, timestamp)
- [ ] Handle pagination for posts with many comments
- [ ] Respect LinkedIn API rate limits during comment fetching

### 5.2 Sentiment Analysis
- [ ] Implement sentiment analysis using AI (GPT-4o-mini for speed)
- [ ] Classify: positive, neutral, negative with confidence score
- [ ] Detect questions (boolean flag)
- [ ] Run sentiment analysis on fetch (batch for efficiency)
- [ ] Store sentiment results with each comment
- [ ] Handle edge cases (emoji-only, multiple languages)

### 5.3 Priority Scoring
- [ ] Implement priority calculation algorithm
- [ ] Factors: sentiment, is_question, author_influence, comment_age, content_length
- [ ] High priority: questions, negative comments, influential authors
- [ ] Medium priority: detailed positive feedback, long comments
- [ ] Low priority: simple reactions ("Great!", emojis)
- [ ] Update priority on new data (comment likes, etc.)

### 5.4 Comment API
- [ ] Implement GET /api/comments (inbox with filters)
- [ ] Implement GET /api/comments/:id (detail)
- [ ] Implement POST /api/comments/:id/suggestions (AI reply generation)
- [ ] Implement POST /api/comments/:id/reply (publish reply)
- [ ] Implement POST /api/comments/:id/dismiss (mark as handled)
- [ ] Implement POST /api/comments/bulk/reply (batch simple replies)
- [ ] Implement GET /api/comments/analytics (engagement stats)
- [ ] Add filters: replied, sentiment, isQuestion, postId, priority
- [ ] Add sorting: priority desc, platformCreatedAt desc

### 5.5 AI Reply Generation
- [ ] Create reply generation prompt template
- [ ] Incorporate brand memory into reply voice
- [ ] Consider original post context in replies
- [ ] Generate 2-3 reply options per comment
- [ ] Different reply styles: detailed, concise, engagement-driving
- [ ] Handle different comment types (praise, question, disagreement)
- [ ] Track which suggestions are selected (for learning)
- [ ] Cost-optimize: use GPT-4o-mini for reply generation

### 5.6 Reply Publishing
- [ ] Implement LinkedIn comment reply API call
- [ ] Handle reply posting errors
- [ ] Update comment record (replied=true, replyContent, repliedAt)
- [ ] Send through comment queue for reliability
- [ ] Respect rate limits for reply posting

### 5.7 Frontend — Engagement Inbox
- [ ] Create engagement page layout
- [ ] Build comment list with cards
- [ ] Show: author, content, sentiment indicator, post reference, time
- [ ] Implement filter tabs (All, Needs Reply, Questions, Positive, Negative)
- [ ] Implement sort options (Priority, Newest)
- [ ] Show unread count in sidebar navigation
- [ ] Build inbox stats bar (total, reply rate, response time)

### 5.8 Frontend — Reply Interface
- [ ] Build comment detail view (expanded)
- [ ] Show original post context (collapsible)
- [ ] Show AI reply suggestions (2-3 cards)
- [ ] Allow editing suggestions before sending
- [ ] Custom reply textarea
- [ ] Send button with loading state
- [ ] Dismiss button (no reply needed)
- [ ] Success confirmation after reply sent
- [ ] Navigate to next unread comment

### 5.9 Frontend — Bulk Actions
- [ ] "Thank you" batch reply for simple positive comments
- [ ] Select multiple comments → bulk dismiss
- [ ] Keyboard shortcuts for power users (n=next, r=reply, d=dismiss)

### 5.10 Notifications for Comments
- [ ] Send in-app notification when new comments arrive
- [ ] Batch notifications (don't spam for every comment)
- [ ] Show comment count in notification bell
- [ ] Email digest option: "You have X new comments" (daily, if enabled)

---

## Deliverables

1. **Comment inbox** showing all comments across published posts
2. **Sentiment analysis** on every comment
3. **Priority scoring** surfacing important comments first
4. **AI reply suggestions** matching user's brand voice
5. **Reply publishing** back to LinkedIn
6. **Engagement analytics** (reply rate, response time)

---

## Definition of Done

- [ ] Comments are fetched automatically for published posts
- [ ] New comments appear in inbox within 1-4 hours of being posted
- [ ] Sentiment analysis runs on all fetched comments
- [ ] Priority score correctly ranks important comments higher
- [ ] AI generates 2-3 relevant reply suggestions per comment
- [ ] Replies match user's brand voice
- [ ] Sent replies appear on LinkedIn within seconds
- [ ] User can handle 20+ comments in < 10 minutes using AI suggestions
- [ ] Comment analytics show reply rate and response time
- [ ] Bulk actions work for batch handling simple comments
- [ ] Notifications inform user of new comments without spamming
