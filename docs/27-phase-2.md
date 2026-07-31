# Phase 2: AI Writer

## Timeline: Months 2-3

## Goals

1. Implement AI content generation with provider abstraction
2. Build the brand memory system (initial setup + learning)
3. Create the AI Writer UI with multi-variant output
4. Implement post editor with AI assist features
5. Set up AI usage tracking and cost management
6. Enable feedback loop for voice learning

---

## Tasks

### 2.1 AI Provider Abstraction
- [ ] Create AIProvider interface in `apps/api/src/features/ai/providers/`
- [ ] Implement OpenAI provider (GPT-4o)
- [ ] Implement Anthropic provider (Claude 3.5 Sonnet)
- [ ] Create provider router (primary + fallback logic)
- [ ] Add health check for AI providers
- [ ] Implement provider-specific error handling
- [ ] Add timeout and retry for AI API calls
- [ ] Set up API key management (environment variables)

### 2.2 Prompt Engineering System
- [ ] Create prompt templates directory/module
- [ ] Build system prompt builder (incorporates brand memory)
- [ ] Build user prompt builder per generation type (topic, URL, rewrite)
- [ ] Create platform-specific prompt rules (LinkedIn, Twitter, etc.)
- [ ] Implement content format templates (story, listicle, howto, etc.)
- [ ] Add tone modifiers (professional, casual, inspirational)
- [ ] Test prompts with various inputs, iterate on quality
- [ ] Document prompt templates and variables

### 2.3 Content Generation Service
- [ ] Create AI feature module (controller, service, routes, schema)
- [ ] Implement POST /api/ai/generate endpoint
- [ ] Implement POST /api/ai/improve endpoint (shorten, expand, rephrase)
- [ ] Implement POST /api/ai/hashtags endpoint
- [ ] Add response parsing (extract variants, validate output)
- [ ] Implement character limit validation per platform
- [ ] Add engagement scoring logic (estimated score per variant)
- [ ] Rate limit AI endpoints per user (plan-based)
- [ ] Track token usage per generation

### 2.4 Brand Memory System
- [ ] Create brand_memories table and Prisma model
- [ ] Create brand memory feature module
- [ ] Implement GET /api/brand-memory
- [ ] Implement PATCH /api/brand-memory/voice-config
- [ ] Implement PUT /api/brand-memory/pillars
- [ ] Implement POST /api/brand-memory/feedback
- [ ] Build initial voice analysis (onboarding sample posts)
- [ ] Build brand memory → prompt injection logic
- [ ] Create feedback collection on AI generations
- [ ] Store user edit diffs for learning signals

### 2.5 AI Usage & Cost Tracking
- [ ] Create ai_generations table and Prisma model
- [ ] Log every AI call (provider, model, tokens, cost, latency)
- [ ] Implement GET /api/ai/usage (user's monthly usage)
- [ ] Enforce plan limits (free: 10/month, pro: 100/month)
- [ ] Return 403 with upgrade prompt when limit reached
- [ ] Build admin dashboard query for total AI costs (internal)

### 2.6 Frontend — AI Writer Page
- [ ] Create AI Writer page layout
- [ ] Build input form (topic, URL, or rewrite tabs)
- [ ] Build configuration row (platform, tone, format, length)
- [ ] Implement generation with loading state
- [ ] Build variant cards (content, score, actions)
- [ ] "Use This" button → navigate to post editor with content
- [ ] "Regenerate" button → new generation with same params
- [ ] "Copy" button → clipboard
- [ ] Handle errors (AI unavailable, limit reached)

### 2.7 Frontend — Enhanced Post Editor
- [ ] Add character count with platform limit indicator
- [ ] Add platform-specific preview component
- [ ] Add AI Assist dropdown (Improve Hook, Shorten, Expand, Rephrase)
- [ ] Inline AI loading states
- [ ] Add emoji picker
- [ ] Add hashtag helper (input field, suggestions)
- [ ] Auto-save every 30 seconds (PATCH /posts/:id/autosave)
- [ ] Save indicator ("Saving..." / "Saved")

### 2.8 Frontend — Brand Voice Settings
- [ ] Create Brand Voice settings page
- [ ] Build voice configuration form (sliders for formality, humor, emoji)
- [ ] Build content pillars manager (add, edit, remove, allocate %)
- [ ] Build vocabulary preferences (add/remove words to use/avoid)
- [ ] "Test my voice" button → generates sample post
- [ ] Show learning status (posts analyzed, confidence level)
- [ ] Add feedback history (recent thumbs up/down)

### 2.9 Worker — Brand Memory Update Job
- [ ] Create AI worker (skeleton in apps/worker)
- [ ] Implement brand memory recalculation job
- [ ] Schedule weekly brand memory update (Sunday midnight)
- [ ] Process: gather feedback + posts → analyze → update memory
- [ ] Test with sample user data

---

## Deliverables

1. **AI content generation** working via API with 2-3 variants per request
2. **Brand memory system** storing voice config and learning from feedback
3. **AI Writer UI** with full generation workflow
4. **Enhanced post editor** with AI assist features
5. **Cost tracking** for AI usage per user
6. **Provider abstraction** enabling easy model swaps

---

## Definition of Done

- [ ] User can generate 3 content variants from a topic
- [ ] Generated content respects platform character limits
- [ ] Brand memory voice config affects generation output
- [ ] User can provide feedback (thumbs up/down) on generations
- [ ] AI usage is tracked and plan limits enforced
- [ ] Post editor has AI assist (improve, shorten, expand)
- [ ] Platform preview shows how post will appear
- [ ] Character count updates in real-time
- [ ] Auto-save works without disrupting editing
- [ ] Fallback to secondary AI provider works when primary fails
- [ ] Generation latency < 10 seconds (p95)
- [ ] Test coverage on AI service (prompt building, response parsing)

---

## Quality Benchmarks

- AI-generated content should be unique (not templated)
- First line should be a compelling hook in >80% of generations
- Content should match selected tone
- No hallucinated URLs or @mentions
- Content should not repeat recent topics (last 7 days check)
