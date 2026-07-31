# Dashboard Pages

## Overview

This document specifies every page in the application, its content, data requirements, and behavior.

---

## 1. Dashboard (Home)

**Route**: `/dashboard`
**Purpose**: At-a-glance overview of social media performance and quick actions.

### Content Sections

**Header**:
- Welcome message: "Welcome back, {name}"
- Current date and time
- Quick action buttons: [Create Post] [AI Writer]

**Metrics Summary Cards** (top row, 4 cards):
- Total Impressions (period) with % change vs previous period
- Total Engagement (likes + comments + shares) with % change
- Posts Published (this week/month) with count
- Follower Growth (net new) with % change

**Recent Posts** (left column):
- Last 5 posts with status, preview, and basic metrics
- Status badge (draft, scheduled, published, failed)
- Published posts show impressions/engagement inline
- "View All Posts" link

**AI Insights Panel** (right column):
- 3-5 actionable insights
- Each has an icon, brief text, and optional action button
- Refresh weekly
- Examples: "Your Tuesday posts get 40% more engagement", "Try posting a question — they drive 2x comments"

**Upcoming Schedule** (bottom left):
- Next 5 scheduled posts with date/time
- Platform icon and content preview
- "View Calendar" link

**Quick Actions** (bottom right):
- Create New Post
- Open AI Writer
- View Weekly Report
- Check Comments (with unread count)

### Data Requirements
- User profile (name)
- Analytics overview (current period)
- Recent posts (last 5)
- Scheduled posts (next 5)
- AI insights (cached, refreshed weekly)
- Notification count

---

## 2. Posts Page

**Route**: `/posts`
**Purpose**: Manage all posts with filtering, searching, and bulk actions.

### Content

**Page Header**:
- Title: "Posts"
- Filters: Status tabs (All | Drafts | Scheduled | Published | Failed)
- Platform filter dropdown
- Search input
- Sort: Newest / Oldest / Scheduled Date
- [Create Post] button

**Post List**:
- Card or table view toggle
- Each post shows:
  - Content preview (first 100 chars)
  - Platform icon
  - Status badge
  - Date (created or scheduled or published)
  - Metrics (if published): impressions, engagement
  - Actions: Edit, Schedule, Delete, Duplicate

**Bulk Actions** (when items selected):
- Schedule Selected
- Delete Selected
- Change status

**Empty State**: "No posts yet. Start by creating your first post or let AI write one for you."

---

## 3. Post Editor Page

**Route**: `/posts/new` or `/posts/:id`
**Purpose**: Create or edit a post with full editing capabilities.

### Content

- Platform selector (dropdown)
- Social account selector (if multiple accounts for same platform)
- Rich textarea with character count and limit indicator
- AI Assist button (inline: shorten, expand, rephrase, improve hook)
- Emoji picker
- Hashtag helper
- Media upload area (drag & drop)
- Platform-specific preview panel
- Action bar: [Save Draft] [Schedule] [Publish Now]
- If editing scheduled post: show current schedule, allow reschedule

---

## 4. AI Writer Page

**Route**: `/ai-writer`
**Purpose**: Generate content with full AI control.

### Content

**Input Section**:
- Input type tabs: Topic | URL | Rewrite
- Main input field (topic text, URL, or paste existing content)
- Configuration row:
  - Platform selector
  - Tone selector (Professional, Casual, Inspirational, Educational, Controversial)
  - Format selector (Auto, Story, How-to, Listicle, Opinion, Question)
  - Length (Short, Medium, Long)
- Toggles: Include Hashtags, Include CTA
- [Generate] button (with loading state)

**Results Section** (shown after generation):
- 2-3 variant cards, each showing:
  - Full content
  - Character count
  - Engagement score (1-10 with bar indicator)
  - Format label
  - Suggested hashtags
  - Actions: [Use This] [Edit] [Copy]
- Regenerate button (creates new variants)
- "Use This" → navigates to Post Editor with content pre-filled

---

## 5. Calendar Page

**Route**: `/calendar`
**Purpose**: Visual schedule management.

### Content

**Calendar Views** (tab switch):
- Month view: dots/indicators for posts
- Week view: detailed cards per day
- Day view: timeline with exact times

**Calendar Features**:
- Color coding by platform
- Status indicators (scheduled = blue, published = green, failed = red)
- Click empty slot → Create post for that time
- Click post → View/Edit
- Drag and drop → Reschedule
- AI-suggested empty slots highlighted (subtle)

**Side Panel** (visible in week/day view):
- Selected post details
- Quick edit capability
- Platform preview
- Action buttons

---

## 6. Engagement Page

**Route**: `/engagement`
**Purpose**: Unified comment inbox with AI reply assistance.

### Content

**Inbox Header**:
- Unread count badge
- Filters: All | Needs Reply | Questions | Positive | Negative
- Sort: Priority | Newest | Post

**Comment List**:
- Each comment shows:
  - Author name + avatar
  - Comment text
  - Parent post reference (clickable)
  - Sentiment indicator (color dot)
  - Time ago
  - Question badge (if detected)
  - Priority indicator
- Click to expand / open reply interface

**Reply Interface** (expanded comment):
- Original post context (collapsible)
- Full comment text
- AI suggestion cards (2-3 options)
- Custom reply textarea
- [Send Reply] button
- [Dismiss] button

**Stats Bar**:
- Total comments this period
- Reply rate
- Average response time
- Sentiment breakdown (pie chart)

---

## 7. Analytics Page

**Route**: `/analytics`
**Purpose**: Detailed performance metrics and insights.

### Content

**Time Range Selector**: 7 days | 30 days | 90 days | Custom

**Overview Metrics** (top cards):
- Impressions (with sparkline trend)
- Engagement Rate (with trend)
- Followers (with growth rate)
- Posts Published (count)

**Charts Section**:
- Impressions over time (line chart)
- Engagement over time (bar chart)
- Follower growth (area chart)
- Best times heatmap (optional)

**Top Performing Posts**:
- Top 5 posts ranked by engagement
- Each shows: preview, metrics, AI analysis of why it worked

**AI Insights Panel**:
- Weekly insights with recommendations
- Actionable: each insight has a "Do this" button

**Reports Tab**:
- List of weekly reports
- Click to view full report
- Download as PDF (future)

---

## 8. Trends Page

**Route**: `/trends`
**Purpose**: Discover trending topics and content opportunities.

### Content

**Active Trends**:
- Cards sorted by relevance score
- Each shows: topic, description, relevance score, velocity indicator, platform
- Suggested content angle
- [Generate Content] [Dismiss] actions
- Time remaining indicator ("~2 days of relevance")

**Competitor Insights** (tab):
- Competitor list with recent activity summary
- Top performing competitor content
- Content gaps and opportunities
- [Add Competitor] button

---

## 9. Settings Pages

### General Settings (`/settings`)
- Profile information
- Timezone
- Language preference

### Profile (`/settings/profile`)
- Name, email, avatar upload
- Change password
- Two-factor auth (future)

### Social Accounts (`/settings/accounts`)
- Connected accounts list with health status
- Connect new account buttons per platform
- Disconnect option (with confirmation)
- Token status indicator (valid, expiring soon, expired)
- Last synced timestamp

### Brand Voice (`/settings/brand-voice`)
- Voice configuration sliders
- Content pillars management
- Vocabulary preferences (add/remove words)
- Topics configuration
- "Test my voice" button (generates sample)
- Learning status indicator

### Notifications (`/settings/notifications`)
- Toggle grid: notification types × channels (in-app, email)
- Quiet hours configuration
- Email digest settings

### Scheduling (`/settings/scheduling`)
- Default time slots per day of week
- Timezone setting
- Queue preferences
- Vacation mode toggle

### Billing (`/settings/billing`)
- Current plan display
- Usage meters (posts, AI generations, accounts)
- Upgrade/downgrade buttons
- Payment method (last 4 digits)
- Invoice history table
- Cancel subscription option

---

## 10. Notifications Page

**Route**: `/notifications`
**Purpose**: Full notification history and management.

### Content

- Full list of all notifications (paginated)
- Filter: All | Unread
- Each notification: icon, title, message, time, read status
- Click to navigate to related resource
- [Mark All Read] button
- Notification preference link

---

## 11. Onboarding Pages

**Route**: `/onboarding/step-{1-5}`
**Purpose**: Guide new users through setup.

### Steps
1. Welcome (product intro, value prop)
2. Connect Account (LinkedIn OAuth)
3. Industry & Goals (select from options)
4. Posting Preferences (frequency, times)
5. Voice Setup (paste samples or skip)

### Design
- Progress bar at top
- Large, clear step content
- Skip option on non-critical steps
- Clean, focused layout (no sidebar)
- Celebration/success animation on completion

---

## 12. Auth Pages

### Login (`/login`)
- Email + password form
- Remember me checkbox
- Forgot password link
- OAuth buttons (Google, GitHub)
- Register link

### Register (`/register`)
- Name, email, password form
- Password strength indicator
- Terms acceptance checkbox
- OAuth buttons
- Login link

### Forgot Password (`/forgot-password`)
- Email input
- Submit button
- Back to login link

### Reset Password (`/reset-password`)
- New password + confirm
- Password requirements list
- Submit button

### Verify Email (`/verify-email`)
- Auto-verifies from token in URL
- Success/error state
- Resend option if expired
