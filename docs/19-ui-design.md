# UI Design System

## Overview

AI Social OS uses a modern, clean design system built on Tailwind CSS and shadcn/ui components. The interface prioritizes clarity, speed, and minimal cognitive load.

---

## Design Principles

1. **Content First** — The user's content is the hero. UI elements support, not compete.
2. **Minimal Clicks** — Common actions require 1-2 clicks maximum.
3. **Progressive Disclosure** — Show what's needed now, reveal complexity on demand.
4. **Consistent Patterns** — Same interactions behave the same everywhere.
5. **Responsive** — Full functionality on desktop, optimized for tablet, usable on mobile.
6. **Accessible** — WCAG 2.1 AA compliance for all interactive elements.

---

## Color System

### Brand Colors

```
Primary: Blue-600 (#2563EB) — Actions, links, active states
Primary Hover: Blue-700 (#1D4ED8)
Primary Light: Blue-50 (#EFF6FF) — Subtle backgrounds

Secondary: Slate-600 (#475569) — Secondary text, icons
```

### Semantic Colors

```
Success: Green-600 (#16A34A) — Published, connected, positive
Warning: Amber-500 (#F59E0B) — Attention needed, expiring
Error: Red-600 (#DC2626) — Failed, disconnected, errors
Info: Blue-500 (#3B82F6) — Informational notices

LinkedIn: #0A66C2
Twitter/X: #000000
Instagram: #E4405F
Facebook: #1877F2
Threads: #000000
```

### Dark Mode

Full dark mode support using CSS variables:

```
Light Mode:
  --background: white
  --foreground: slate-900
  --card: white
  --border: slate-200
  --muted: slate-100

Dark Mode:
  --background: slate-950
  --foreground: slate-50
  --card: slate-900
  --border: slate-800
  --muted: slate-800
```

---

## Typography

```
Font Family: Inter (sans-serif)
Fallback: system-ui, -apple-system, sans-serif

Heading 1: 30px / 36px, font-bold (page titles)
Heading 2: 24px / 32px, font-semibold (section titles)
Heading 3: 20px / 28px, font-semibold (card titles)
Body: 14px / 20px, font-normal (default text)
Body Large: 16px / 24px, font-normal (important body text)
Small: 12px / 16px, font-normal (metadata, timestamps)
Caption: 11px / 14px, font-medium (labels, badges)
```

---

## Spacing System

```
Based on 4px grid:
  xs: 4px (0.25rem)
  sm: 8px (0.5rem)
  md: 12px (0.75rem)
  lg: 16px (1rem)
  xl: 24px (1.5rem)
  2xl: 32px (2rem)
  3xl: 48px (3rem)
  4xl: 64px (4rem)
```

---

## Layout Structure

### Dashboard Layout

```
┌────────────────────────────────────────────────────┐
│  Header (fixed top, 64px)                          │
│  [Logo] [Search] [Notifications] [Avatar]          │
├──────────┬─────────────────────────────────────────┤
│ Sidebar  │  Main Content Area                      │
│ (240px)  │                                         │
│          │  ┌──────────────────────────────────┐   │
│ □ Dash   │  │  Page Header                     │   │
│ □ Posts  │  │  [Title]    [Primary Action]     │   │
│ □ AI     │  └──────────────────────────────────┘   │
│ □ Cal    │                                         │
│ □ Engage │  ┌──────────────────────────────────┐   │
│ □ Trends │  │  Page Content                    │   │
│ □ Stats  │  │                                  │   │
│          │  │                                  │   │
│ ─────── │  │                                  │   │
│ □ Settings │                                  │   │
│          │  │                                  │   │
│          │  └──────────────────────────────────┘   │
└──────────┴─────────────────────────────────────────┘
```

### Sidebar Navigation Items

```
Main:
  📊 Dashboard
  ✏️  Posts
  🤖 AI Writer
  📅 Calendar
  💬 Engagement
  📈 Analytics
  🔥 Trends

Settings (bottom):
  ⚙️  Settings
  🔔 Notifications
```

### Responsive Breakpoints

```
Mobile: < 768px (sidebar collapses to bottom nav or hamburger)
Tablet: 768px - 1024px (sidebar collapses, expandable)
Desktop: > 1024px (full sidebar visible)
Large: > 1440px (wider content area)
```

---

## Component Library (shadcn/ui based)

### Core Components

| Component | Usage |
|-----------|-------|
| Button | Primary/secondary/ghost/destructive actions |
| Card | Content containers throughout dashboard |
| Dialog/Modal | Confirmation, forms, previews |
| Dropdown Menu | Context menus, actions overflow |
| Input | Text input fields |
| Textarea | Multi-line text (post editor) |
| Select | Dropdown selections |
| Switch | Toggle settings |
| Tabs | Content area tabbing |
| Toast | Success/error feedback |
| Badge | Status indicators, tags |
| Avatar | User/platform images |
| Skeleton | Loading placeholders |
| Table | Data lists (posts, analytics) |
| Calendar | Date picker, content calendar |
| Chart | Analytics visualizations |
| Tooltip | Contextual help text |
| Popover | Rich tooltip/dropdown content |

### Custom Components

| Component | Description |
|-----------|-------------|
| PlatformIcon | Social platform logo with consistent sizing |
| PostCard | Post preview card (content, status, metrics) |
| MetricsCard | Stat card with value, change indicator |
| StatusBadge | Post status with color coding |
| EmptyState | Illustrated empty state with CTA |
| PostEditor | Rich textarea with character count |
| ScheduleModal | Date/time picker with AI suggestion |
| NotificationBell | Bell icon with unread badge |
| BrandVoiceSlider | Labeled slider for voice config |
| PlatformSelector | Multi-select for target platforms |

---

## Key Page Designs

### Dashboard Page

```
┌──────────────────────────────────────────────┐
│  Welcome back, {name}                        │
│  Here's your social media overview           │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │Impr │ │Engag│ │Posts│ │Grow │           │
│  │12.5k│ │ 340 │ │  5  │ │ +42 │           │
│  │+12% │ │ +8% │ │ ─── │ │+18% │           │
│  └─────┘ └─────┘ └─────┘ └─────┘          │
│                                              │
│  ┌────────────────────┐ ┌────────────────┐  │
│  │ Recent Posts        │ │ AI Insights    │  │
│  │                    │ │                │  │
│  │ • Post 1 (pub)    │ │ 💡 Best day:   │  │
│  │ • Post 2 (sched)  │ │   Tuesday     │  │
│  │ • Post 3 (draft)  │ │               │  │
│  │                    │ │ 💡 Try more   │  │
│  │ [View All]         │ │   questions   │  │
│  └────────────────────┘ └────────────────┘  │
│                                              │
│  ┌────────────────────┐ ┌────────────────┐  │
│  │ Upcoming (Calendar)│ │ Quick Actions  │  │
│  │                    │ │                │  │
│  │ Today: 1 post 9am │ │ [New Post]     │  │
│  │ Tomorrow: 2 posts  │ │ [AI Writer]    │  │
│  │                    │ │ [View Reports] │  │
│  └────────────────────┘ └────────────────┘  │
└──────────────────────────────────────────────┘
```

### Post Editor Page

```
┌──────────────────────────────────────────────┐
│  Create Post                    [Save Draft]  │
├──────────────────────────────────────────────┤
│                                              │
│  Platform: [LinkedIn ▼]                      │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  │  Write your post here...               │  │
│  │                                        │  │
│  │                                        │  │
│  │                                        │  │
│  │                                        │  │
│  │                                        │  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │
│  1,247 / 3,000 characters                    │
│                                              │
│  [🤖 AI Assist ▼] [😊 Emoji] [# Hashtags]   │
│                                              │
│  ┌─────────────────────────────────┐        │
│  │ Preview (LinkedIn)              │        │
│  │ ┌─────────────────────────────┐ │        │
│  │ │ [Avatar] Your Name          │ │        │
│  │ │ Headline • 2h               │ │        │
│  │ │                             │ │        │
│  │ │ Post content rendered       │ │        │
│  │ │ as it would appear...       │ │        │
│  │ │                             │ │        │
│  │ │ 👍 💬 🔄 ✈️                  │ │        │
│  │ └─────────────────────────────┘ │        │
│  └─────────────────────────────────┘        │
│                                              │
│  [Schedule] [Publish Now]                    │
└──────────────────────────────────────────────┘
```

### AI Writer Page

```
┌──────────────────────────────────────────────┐
│  AI Writer                                    │
├──────────────────────────────────────────────┤
│                                              │
│  What do you want to write about?            │
│  ┌────────────────────────────────────────┐  │
│  │ e.g., "remote work productivity tips"  │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Platform: [LinkedIn] Tone: [Professional]   │
│  Format: [Auto]  Length: [Medium]            │
│  ☑ Include hashtags  ☑ Include CTA           │
│                                              │
│  [✨ Generate Content]                        │
│                                              │
│  ──────── Results ────────                   │
│                                              │
│  ┌─── Variant 1 ──── Score: 8.1/10 ──────┐  │
│  │                                        │  │
│  │ Last year I was barely getting 4 hours  │  │
│  │ of real work done from home.            │  │
│  │                                        │  │
│  │ Then I made 3 changes...               │  │
│  │                                        │  │
│  │ [Use This] [Edit] [Regenerate]         │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌─── Variant 2 ──── Score: 7.4/10 ──────┐  │
│  │ ...                                    │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

---

## Interaction Patterns

### Loading States
- Skeleton placeholders for content areas
- Spinner for action buttons (disable button during load)
- Progress bar for multi-step processes
- Optimistic UI for quick actions (like, mark read)

### Toast Notifications
- Bottom-right corner
- Auto-dismiss after 5 seconds
- Success: green accent
- Error: red accent, stays until dismissed
- Info: blue accent
- Max 3 toasts visible at once

### Empty States
- Illustrated (simple SVG)
- Clear explanation of what goes here
- Primary CTA to create first item
- Example: "No posts yet. Create your first post to get started." [Create Post]

### Confirmation Dialogs
- Used for destructive actions (delete, disconnect)
- Clear description of what will happen
- Primary action button matches intent (red for delete)
- Always include cancel option

### Form Patterns
- Inline validation (on blur)
- Error messages below field
- Required fields marked with asterisk
- Submit button disabled until valid
- Loading state on submit button

---

## Accessibility Requirements

### Keyboard Navigation
- All interactive elements focusable
- Tab order follows visual layout
- Escape closes modals/dropdowns
- Enter/Space activates buttons
- Arrow keys navigate menus

### Screen Readers
- Semantic HTML (nav, main, article, section)
- ARIA labels on icon-only buttons
- ARIA live regions for dynamic content
- Skip navigation link
- Form labels associated with inputs

### Visual
- Color contrast ratio ≥ 4.5:1 (text)
- Color contrast ratio ≥ 3:1 (UI elements)
- Color is not the only indicator (icons + color for status)
- Focus visible indicators (ring style)
- Reduced motion respected (prefers-reduced-motion)

### Content
- Alt text on all images
- Error messages describe how to fix
- Links have descriptive text (not "click here")
- Tables have proper headers
