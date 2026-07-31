# Phase 3: Scheduler & Publisher

## Timeline: Months 3-4

## Goals

1. Build the auto-publishing system (BullMQ workers)
2. Implement post scheduling with AI-optimized timing
3. Create the content calendar UI
4. Build queue-based scheduling
5. Implement notification system for publish events
6. Launch basic paid plan (Stripe integration)

---

## Tasks

### 3.1 Worker Infrastructure
- [ ] Set up `apps/worker` application structure
- [ ] Configure BullMQ connection to Redis
- [ ] Create queue registry (publish, notification queues)
- [ ] Implement graceful shutdown handling
- [ ] Create worker health check endpoint
- [ ] Set up Bull Board for queue monitoring (development)
- [ ] Deploy worker as separate process
- [ ] Configure worker concurrency settings

### 3.2 Publish Worker
- [ ] Implement publish worker (consume from publish-queue)
- [ ] Build LinkedIn publishing integration (POST /v2/posts)
- [ ] Handle image upload flow (initialize → upload → reference)
- [ ] Implement token validation before publish (refresh if needed)
- [ ] Implement retry logic (4 attempts, exponential backoff)
- [ ] Handle non-retryable errors (content policy, permission)
- [ ] Update post status on success (published, platformPostId, publishedAt)
- [ ] Update post status on failure (failed, errorMessage, retryCount)
- [ ] Send success/failure notifications via notification queue
- [ ] Queue analytics fetch on successful publish (1h delay)

### 3.3 Scheduling API
- [ ] Implement POST /api/posts/:id/schedule
- [ ] Implement POST /api/posts/:id/unschedule
- [ ] Implement POST /api/posts/:id/publish (publish now)
- [ ] Implement POST /api/posts/:id/retry
- [ ] Implement PATCH /api/posts/:id/reschedule
- [ ] Validate scheduledAt is in future (min 5 minutes)
- [ ] Add job to BullMQ with calculated delay
- [ ] Remove job from BullMQ on unschedule
- [ ] Handle timezone conversion correctly

### 3.4 AI-Optimized Scheduling
- [ ] Implement GET /api/scheduler/optimal-times
- [ ] Build optimal time calculation algorithm
- [ ] Use historical post performance data (or platform defaults for new users)
- [ ] Consider user's timezone
- [ ] Avoid scheduling conflicts (min 3h between posts)
- [ ] Return top 3 suggestions with confidence scores and reasons
- [ ] Surface suggestions in schedule modal UI

### 3.5 Queue System
- [ ] Create scheduler settings table/fields (user's time slot preferences)
- [ ] Implement PUT /api/scheduler/slots (configure weekly slots)
- [ ] Implement "Add to Queue" logic (find next empty slot, assign)
- [ ] Implement GET /api/scheduler/queue (view current queue)
- [ ] Implement queue reordering (drag and drop backend)
- [ ] Implement POST /api/scheduler/pause and /resume
- [ ] Handle vacation mode (pause all, resume with rescheduling)

### 3.6 Calendar API
- [ ] Implement GET /api/posts/calendar (date range, platform filter)
- [ ] Return posts grouped by date with status
- [ ] Include AI-suggested empty slots
- [ ] Support drag-and-drop reschedule (PATCH endpoint)

### 3.7 Notification System (Backend)
- [ ] Create notifications table and Prisma model
- [ ] Create notification feature module
- [ ] Implement notification worker (process notification-queue)
- [ ] Create in-app notifications (store in database)
- [ ] Implement email notifications (via Resend)
- [ ] Implement GET /api/notifications
- [ ] Implement GET /api/notifications/unread-count
- [ ] Implement PATCH /api/notifications/:id/read
- [ ] Implement POST /api/notifications/mark-all-read
- [ ] Implement notification preferences (PUT /api/notifications/preferences)
- [ ] Implement deduplication logic (prevent notification spam)
- [ ] Implement quiet hours respect

### 3.8 Frontend — Calendar Page
- [ ] Create calendar page with month/week/day views
- [ ] Implement month view (dots for posts)
- [ ] Implement week view (post cards per day)
- [ ] Color coding by platform
- [ ] Status indicators (scheduled=blue, published=green, failed=red)
- [ ] Click empty slot → create post dialog
- [ ] Click post → view details/edit
- [ ] Drag and drop to reschedule (call API)
- [ ] Show AI-suggested optimal slots

### 3.9 Frontend — Schedule Modal
- [ ] Build schedule modal component
- [ ] Date picker with calendar
- [ ] Time picker
- [ ] Timezone display
- [ ] AI-suggested time section (highlighted with reason)
- [ ] "Add to Queue" option
- [ ] Confirmation and success toast

### 3.10 Frontend — Notifications
- [ ] Build notification bell component (header)
- [ ] Show unread count badge
- [ ] Build notification dropdown (last 10)
- [ ] Build full notifications page
- [ ] Mark as read on click
- [ ] "Mark all read" button
- [ ] Build notification preferences page in settings

### 3.11 Stripe Integration (Basic)
- [ ] Create Stripe account and products/prices
- [ ] Implement POST /api/billing/checkout (create Stripe Checkout session)
- [ ] Implement POST /api/billing/portal (customer portal)
- [ ] Implement POST /api/billing/webhook (handle Stripe events)
- [ ] Handle subscription.created → upgrade user plan
- [ ] Handle subscription.deleted → downgrade to free
- [ ] Handle payment_failed → notify user
- [ ] Build pricing page (frontend)
- [ ] Build billing settings page (current plan, upgrade/downgrade)
- [ ] Implement plan limit enforcement middleware

---

## Deliverables

1. **Auto-publishing system** that reliably publishes posts at scheduled time
2. **Calendar UI** with visual schedule management
3. **AI-optimized scheduling** suggestions
4. **Queue system** for automated time slot assignment
5. **Notification system** (in-app + email)
6. **Stripe billing** with free and pro plans
7. **Publish reliability** with retry logic and failure notifications

---

## Definition of Done

- [ ] User can schedule a post for a future date/time
- [ ] Scheduled posts are published within 60 seconds of scheduled time
- [ ] Failed publishes retry up to 4 times with exponential backoff
- [ ] User receives notification on publish success or failure
- [ ] Calendar view shows all scheduled and published posts
- [ ] User can drag-and-drop to reschedule posts
- [ ] AI suggests optimal posting times based on available data
- [ ] User can subscribe to Pro plan via Stripe
- [ ] Plan limits are enforced (free users limited)
- [ ] Notification preferences are configurable
- [ ] Worker handles graceful shutdown without losing jobs
- [ ] Queue depth monitored, no job loss under normal conditions
