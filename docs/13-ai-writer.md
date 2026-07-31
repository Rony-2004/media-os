# AI Writer

## Overview

The AI Writer is the core differentiator of AI Social OS. It generates social media content that sounds like the user, adapts to platform-specific best practices, and improves over time through continuous learning.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     AI Writer Service                     │
│                                                          │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────┐ │
│  │ Prompt      │   │ Provider     │   │ Response     │ │
│  │ Builder     │──→│ Router       │──→│ Parser       │ │
│  └─────────────┘   └──────────────┘   └──────────────┘ │
│        ↑                                       │        │
│        │                                       ▼        │
│  ┌─────────────┐                     ┌──────────────┐  │
│  │ Brand       │                     │ Feedback     │  │
│  │ Memory      │                     │ Collector    │  │
│  └─────────────┘                     └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Provider Abstraction

### Interface

```typescript
interface AIProvider {
  name: string;
  generateContent(request: GenerationRequest): Promise<GenerationResponse>;
  estimateCost(request: GenerationRequest): CostEstimate;
  isAvailable(): Promise<boolean>;
}

interface GenerationRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
  model: string;
}

interface GenerationResponse {
  content: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
  latencyMs: number;
  finishReason: 'stop' | 'length' | 'error';
}
```

### Provider Selection Strategy

```
Primary: OpenAI (GPT-4o)
  ├── Fast, good at following instructions
  ├── Best for: content generation, reformatting
  └── Cost: ~$0.005 per generation

Fallback: Anthropic (Claude 3.5 Sonnet)
  ├── Triggered when: OpenAI unavailable or rate limited
  ├── Best for: nuanced writing, longer content
  └── Cost: ~$0.006 per generation

Routing Logic:
  1. Check if primary provider is available (health check)
  2. Check user hasn't exceeded provider rate limits
  3. Use primary if available
  4. Fallback to secondary if primary fails
  5. Return error if both fail
```

### Future: Model Selection by Task

| Task | Recommended Model | Reason |
|------|------------------|--------|
| Short posts (< 280 chars) | GPT-4o-mini | Fast, cheap, good for short-form |
| Long-form content | GPT-4o | Better at structure and coherence |
| Reply generation | GPT-4o-mini | Speed matters, replies are short |
| Content analysis | Claude 3.5 | Better at nuanced analysis |
| Brand voice extraction | Claude 3.5 | Better at pattern recognition |
| Trend summarization | GPT-4o-mini | Straightforward summarization |

---

## Prompt Engineering

### System Prompt Template

```
You are an AI social media content writer. You write as if you ARE the user — matching their voice, expertise, and personality exactly.

BRAND VOICE PROFILE:
- Formality: {formality_level}/5
- Humor: {humor_level}/5
- Emoji usage: {emoji_preference}
- Expertise areas: {topics}
- Writing patterns: {learned_patterns}
- Vocabulary preferences: {preferred_words}
- Words to avoid: {avoid_words}
- Typical post length: {preferred_length}

PLATFORM: {target_platform}
PLATFORM RULES:
{platform_specific_rules}

CONTENT THAT PERFORMS WELL FOR THIS USER:
{top_performing_patterns}

RECENTLY POSTED TOPICS (avoid repetition):
{recent_topics_last_7_days}

OUTPUT REQUIREMENTS:
- Generate exactly {variant_count} different versions
- Each version should take a different angle/format
- Include engagement score estimate (1-10)
- Separate versions with ---
- Do NOT use generic phrases like "In today's fast-paced world"
- Do NOT start with "I" too frequently
- Make the first line a strong hook that stops scrolling
```

### User Prompt Templates

**Topic-Based Generation**:
```
Write a {platform} post about: {user_topic}

Tone: {selected_tone}
Format: {selected_format}
Include CTA: {cta_type}
Include hashtags: {yes/no, count}
Target length: {short/medium/long}
```

**URL Repurposing**:
```
Repurpose this article into a {platform} post:

Article Title: {title}
Article Summary: {extracted_summary}
Key Points: {extracted_key_points}

The post should share the key insight without being a simple summary. Add personal perspective or hot take.
```

**Improvement/Rewrite**:
```
Improve this existing post for better engagement:

Original: {original_content}

Instructions: {user_instructions}
Focus on: {improvement_area}  // hook, clarity, CTA, engagement
```

---

## Content Generation Flow

### Step-by-Step Process

```
1. User Input
   ├── Topic/idea text
   ├── Selected platform
   ├── Tone preference
   ├── Format preference
   └── Additional parameters

2. Context Loading
   ├── Fetch brand memory for user
   ├── Fetch top 5 performing posts (for patterns)
   ├── Fetch last 10 post topics (avoid repetition)
   └── Load platform-specific rules

3. Prompt Construction
   ├── Build system prompt with brand voice
   ├── Build user prompt with request + context
   └── Set parameters (temperature, max_tokens)

4. AI Generation
   ├── Send to primary provider
   ├── Parse response into variants
   ├── Validate output (character limits, format)
   └── Retry if output is malformed

5. Post-Processing
   ├── Extract hashtags
   ├── Calculate estimated character counts
   ├── Score each variant (engagement prediction)
   └── Format for frontend display

6. Response to User
   ├── 2-3 content variants
   ├── Engagement score per variant
   ├── Suggested posting time
   └── Hashtag recommendations
```

### Generation Parameters

| Parameter | Default | Range |
|-----------|---------|-------|
| temperature | 0.8 | 0.3 - 1.0 |
| max_tokens | 1000 | 200 - 2000 |
| variant_count | 3 | 1 - 5 |
| top_p | 0.95 | 0.8 - 1.0 |

**Temperature by use case**:
- Professional/factual content: 0.5
- Creative/engaging content: 0.8
- Hot takes/controversial: 0.9
- Replies (matching tone): 0.6

---

## Content Formats

### Supported Formats

| Format | Description | Best For |
|--------|-------------|----------|
| `story` | Personal narrative with lesson | LinkedIn, engagement |
| `howto` | Step-by-step guide | Educational, saves |
| `listicle` | Numbered/bulleted list | Quick reads, shares |
| `opinion` | Hot take with reasoning | Discussion, comments |
| `question` | Thought-provoking question | Engagement, comments |
| `case_study` | Before/after with results | Credibility, saves |
| `celebration` | Milestone/achievement | Community, likes |
| `behind_scenes` | Process/journey reveal | Authenticity, trust |
| `thread` | Multi-part connected posts | Deep topics (X/Twitter) |

### Format-Specific Prompts

Each format has a structural template:

**Story Format**:
```
Structure:
- Hook (provocative first line that creates curiosity)
- Setup (brief context, 1-2 sentences)
- Narrative (what happened, with specifics)
- Turning point (the insight moment)
- Lesson (actionable takeaway)
- CTA (question or call to action)
```

**Listicle Format**:
```
Structure:
- Hook (what they'll learn + why it matters)
- Items (3-7 points, each with brief explanation)
- Wrap-up (summary insight)
- CTA
```

---

## AI API Endpoints

### Generate Content

```
POST /api/ai/generate

Request Body:
{
  "input": {
    "type": "topic",              // topic | url | rewrite
    "content": "productivity tips for remote workers"
  },
  "platform": "linkedin",
  "tone": "professional",         // professional | casual | inspirational | educational
  "format": "listicle",           // story | howto | listicle | opinion | question | auto
  "options": {
    "includeHashtags": true,
    "hashtagCount": 3,
    "includeCta": true,
    "ctaType": "question",        // question | link | follow | comment
    "length": "medium",           // short | medium | long
    "variantCount": 3
  }
}

Response (200):
{
  "data": {
    "variants": [
      {
        "id": "variant-1",
        "content": "🚀 5 productivity habits that doubled my output working remotely:\n\n1. Time-blocking with 90-min deep work sessions...",
        "characterCount": 1847,
        "estimatedEngagement": 7.2,
        "format": "listicle",
        "hashtags": ["#RemoteWork", "#Productivity", "#WFH"]
      },
      {
        "id": "variant-2",
        "content": "Last year I was barely getting 4 hours of real work done from home.\n\nThen I made 3 changes...",
        "characterCount": 1534,
        "estimatedEngagement": 8.1,
        "format": "story",
        "hashtags": ["#RemoteWork", "#Productivity"]
      },
      {
        "id": "variant-3",
        "content": "Hot take: Most remote workers are doing productivity wrong.\n\nHere's why...",
        "characterCount": 1203,
        "estimatedEngagement": 6.8,
        "format": "opinion",
        "hashtags": ["#RemoteWork", "#HotTake"]
      }
    ],
    "suggestedTime": "2026-08-01T13:00:00Z",
    "tokensUsed": 1250,
    "model": "gpt-4o",
    "generationId": "gen-uuid"
  }
}
```

### Improve Existing Content

```
POST /api/ai/improve

Request Body:
{
  "content": "I think remote work is great because...",
  "action": "improve_hook",       // improve_hook | shorten | expand | rephrase | add_cta
  "platform": "linkedin"
}

Response:
{
  "data": {
    "improved": "The #1 reason I'll never go back to an office has nothing to do with the commute.\n\nIt's because...",
    "changes": "Rewrote opening hook to create curiosity. Added line break for readability.",
    "characterCount": 856
  }
}
```

### Generate Hashtags

```
POST /api/ai/hashtags

Request Body:
{
  "content": "Post content...",
  "platform": "linkedin",
  "count": 5
}

Response:
{
  "data": {
    "hashtags": [
      { "tag": "#RemoteWork", "relevance": 0.95, "popularity": "high" },
      { "tag": "#Productivity", "relevance": 0.88, "popularity": "high" },
      { "tag": "#WFHTips", "relevance": 0.82, "popularity": "medium" },
      { "tag": "#FutureOfWork", "relevance": 0.75, "popularity": "medium" },
      { "tag": "#WorkLifeBalance", "relevance": 0.70, "popularity": "high" }
    ]
  }
}
```

---

## Engagement Scoring

### Score Algorithm

The AI estimates engagement potential (1-10 scale) based on:

```
Score Components:
  Hook strength (30%):
    - Curiosity gap
    - Pattern interrupt
    - Personal vs generic

  Content quality (25%):
    - Specificity (numbers, examples)
    - Storytelling elements
    - Actionable value

  Format optimization (20%):
    - Appropriate length for platform
    - White space / readability
    - Visual structure (lists, emojis)

  Topic relevance (15%):
    - Trending topic alignment
    - User's audience interest match
    - Timely vs evergreen

  CTA effectiveness (10%):
    - Clear ask
    - Low friction
    - Engagement-driving
```

---

## Cost Management

### Per-Generation Cost Tracking

```typescript
// Track every generation for billing and optimization
await aiGenerationRepository.create({
  userId,
  provider: 'openai',
  model: 'gpt-4o',
  promptTokens: response.tokensUsed.prompt,
  completionTokens: response.tokensUsed.completion,
  totalTokens: response.tokensUsed.total,
  estimatedCost: calculateCost(response.tokensUsed, 'gpt-4o'),
  promptType: 'content_generation',
  success: true,
  latencyMs: response.latencyMs
});
```

### Cost per Model (approximate)

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Avg cost/generation |
|-------|----------------------|------------------------|---------------------|
| GPT-4o | $2.50 | $10.00 | $0.005 |
| GPT-4o-mini | $0.15 | $0.60 | $0.001 |
| Claude 3.5 Sonnet | $3.00 | $15.00 | $0.007 |

### Usage Limits by Plan

| Plan | Generations/Month | Estimated AI Cost/User |
|------|-------------------|----------------------|
| Free | 10 | $0.05 |
| Pro | 100 | $0.50 |
| Business | Unlimited (fair use: ~500) | $2.50 |
| Agency | Unlimited (fair use: ~1000) | $5.00 |

---

## Quality Control

### Output Validation

```
After AI generates content, validate:
1. Not empty
2. Within platform character limit
3. No hallucinated URLs or handles
4. No inappropriate content (basic filter)
5. Doesn't match recent posts too closely (plagiarism self-check)
6. Contains the requested format elements
7. Properly formatted (line breaks, emoji placement)
```

### Feedback Loop

```
User interacts with generated content:
  ├── Accepts as-is → Strong positive signal
  ├── Accepts with minor edits → Positive signal + learn from edits
  ├── Accepts with major edits → Weak signal + learn from edits
  ├── Regenerates → Negative signal for that approach
  └── Discards → Strong negative signal

Feedback stored:
  - Post table: generationFeedback field
  - Used in weekly brand memory recalculation
  - Influences future prompt construction
```

---

## Rate Limiting & Quotas

### User-Level Limits

```
Free plan: 10 generations per month (tracked in database)
Pro plan: 100 generations per month
Business: 500 per month (soft limit, alert at 80%)
Agency: 1000 per month (soft limit)

Rate limit per request: 5 requests per minute per user
(Prevents abuse while allowing normal usage)
```

### Provider-Level Limits

```
OpenAI: 500 RPM, 200,000 TPM (organization level)
Anthropic: 400 RPM, 400,000 TPM (organization level)

If approaching limits: queue requests instead of rejecting
```
