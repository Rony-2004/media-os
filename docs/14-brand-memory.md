# Brand Memory System

## Overview

Brand Memory is the learning system that allows AI Social OS to generate content that sounds authentically like the user. It continuously learns from the user's writing patterns, preferences, and feedback to produce increasingly personalized content.

---

## How Brand Memory Works

```
┌─────────────────────────────────────────────────────┐
│                  Input Sources                        │
│                                                      │
│  • User's existing posts (onboarding import)         │
│  • Manual voice configuration                        │
│  • AI generation feedback (accept/reject/edit)       │
│  • Published post performance data                   │
│  • User's edits to AI-generated content              │
└──────────────────────────┬──────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│              Brand Memory Processor                   │
│                                                      │
│  Analyzes inputs → Extracts patterns → Stores        │
│  Runs: On onboarding + weekly recalculation          │
└──────────────────────────┬──────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│              Brand Memory Store                       │
│                                                      │
│  • Voice Configuration (manual settings)             │
│  • Learned Patterns (AI-extracted)                   │
│  • Vocabulary Profile (words/phrases)                │
│  • Topic Preferences (what to write about)           │
│  • Content Pillars (strategic focus areas)           │
│  • Tone Profile (formality, humor, etc.)             │
│  • Performance Patterns (what works)                 │
└──────────────────────────┬──────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│              Content Generation                       │
│                                                      │
│  Brand memory injected into every AI prompt          │
│  Results in personalized, authentic content          │
└─────────────────────────────────────────────────────┘
```

---

## Memory Components

### 1. Voice Configuration (Manual)

User-defined settings that directly control AI output:

```json
{
  "formality": 4,           // 1=very casual, 5=very formal
  "humor": 2,              // 1=never, 5=constant humor
  "emojiUsage": "light",   // none | light | moderate | heavy
  "preferredLength": "medium", // short | medium | long
  "ctaStyle": "question",  // question | link | follow | none
  "hashtagCount": 3,       // 0-10
  "firstPerson": true,     // Use "I" vs "we" vs third person
  "storytelling": true,    // Include personal anecdotes
  "dataOriented": true,    // Include statistics/numbers
  "controversialLevel": 2  // 1=safe, 5=provocative
}
```

### 2. Learned Patterns (AI-Extracted)

Automatically extracted from user's content:

```json
{
  "averageSentenceLength": 12.5,
  "paragraphStyle": "short",     // short (1-2 sentences) vs long
  "openingPatterns": [
    "question_hook",
    "bold_statement",
    "personal_story_start"
  ],
  "closingPatterns": [
    "question_to_audience",
    "call_to_action",
    "summary_statement"
  ],
  "transitionWords": ["But here's the thing", "The truth is", "What I learned"],
  "structurePreferences": {
    "usesLineBreaks": true,
    "lineBreakFrequency": "every_sentence",
    "usesBulletPoints": true,
    "usesNumberedLists": true
  },
  "contentRatio": {
    "personal_stories": 0.35,
    "educational": 0.30,
    "opinions": 0.20,
    "promotional": 0.10,
    "questions": 0.05
  }
}
```

### 3. Vocabulary Profile

Words and phrases the user consistently uses or avoids:

```json
{
  "favoriteWords": [
    "leverage", "scale", "iterate", "ship", "unlock"
  ],
  "favoritePhrases": [
    "Here's the thing",
    "What most people miss",
    "I used to think... now I know",
    "The data shows"
  ],
  "avoidWords": [
    "utilize", "synergy", "paradigm", "disrupt"
  ],
  "industryTerms": [
    "ARR", "MRR", "churn", "product-market fit", "CAC"
  ],
  "emojiPreferences": ["🚀", "💡", "→", "✅", "📈"],
  "hashtagStyle": "camelCase"  // camelCase | lowercase | UPPERCASE
}
```

### 4. Topic Preferences

What the user writes about and their expertise areas:

```json
{
  "expertiseAreas": [
    { "topic": "SaaS growth", "confidence": 0.95 },
    { "topic": "remote team management", "confidence": 0.82 },
    { "topic": "AI in business", "confidence": 0.78 },
    { "topic": "startup fundraising", "confidence": 0.65 }
  ],
  "frequentTopics": [
    "product development", "hiring", "culture", "AI tools"
  ],
  "avoidTopics": [
    "politics", "religion"
  ],
  "topicFatigue": {
    "AI tools": { "lastPosted": "2026-07-28", "count7days": 3 }
  }
}
```

### 5. Content Pillars

Strategic content categories defined by the user:

```json
{
  "pillars": [
    {
      "name": "SaaS Growth",
      "allocation": 0.40,
      "subTopics": ["metrics", "pricing", "customer acquisition", "retention"],
      "referenceUrls": ["https://example.com/saas-guide"],
      "examplePosts": ["post-id-1", "post-id-2"]
    },
    {
      "name": "Leadership",
      "allocation": 0.30,
      "subTopics": ["hiring", "culture", "decision making", "remote teams"],
      "referenceUrls": [],
      "examplePosts": ["post-id-3"]
    },
    {
      "name": "Personal Journey",
      "allocation": 0.30,
      "subTopics": ["lessons learned", "failures", "milestones", "behind the scenes"],
      "referenceUrls": [],
      "examplePosts": []
    }
  ]
}
```

### 6. Performance Patterns

What content actually performs well:

```json
{
  "bestPerforming": {
    "formats": ["story", "listicle"],
    "topics": ["hiring mistakes", "AI tools review"],
    "lengths": { "optimal_range": [800, 1500] },
    "postingTimes": ["tuesday_9am", "thursday_12pm"],
    "hookTypes": ["question", "bold_statement"],
    "ctaTypes": ["question_to_audience"]
  },
  "underperforming": {
    "formats": ["pure_promotional"],
    "topics": ["generic_motivation"],
    "lengths": { "too_short": true, "under": 200 }
  }
}
```

---

## Learning Pipeline

### Phase 1: Initial Setup (Onboarding)

```
1. User provides 3-5 sample posts (or we fetch from connected account)
2. AI analyzes samples:
   - Extract vocabulary patterns
   - Identify sentence structure preferences
   - Detect tone and formality level
   - Identify common formats and openings
   - Categorize topics
3. User fills manual voice configuration
4. Combine into initial brand memory profile
5. Generate test post → user validates → refine
```

### Phase 2: Continuous Learning (Ongoing)

```
Every user interaction creates a learning signal:

Strong Positive Signals:
  - User accepts AI content without edits
  - Published post gets above-average engagement

Moderate Positive Signals:
  - User accepts with minor edits (< 20% change)
  - User uses similar patterns in manual posts

Learning Signals:
  - User's specific edits to AI content (what they changed)
  - Deleted words → add to avoid list
  - Added words → add to preferred list
  - Structure changes → update format preferences

Negative Signals:
  - User regenerates (rejects first output)
  - User significantly rewrites (> 50% change)
  - Published post gets below-average engagement
```

### Phase 3: Weekly Recalculation

```
Job: update-brand-memory (runs weekly, Sunday night)

Process:
1. Gather all new data since last recalculation:
   - New published posts (manual + AI-generated)
   - AI generation feedback (last 7 days)
   - User edits to AI content
   - Post performance data

2. Send to AI for analysis:
   Prompt: "Analyze these posts and interactions. 
   Update the user's brand voice profile.
   What new patterns emerge? What should change?"

3. Merge AI analysis with existing profile:
   - New patterns get low confidence initially
   - Patterns confirmed over multiple weeks get higher confidence
   - Contradicted patterns get lower confidence

4. Store updated brand memory

5. Log what changed (for transparency/debugging)
```

---

## API Endpoints

### Get Brand Memory

```
GET /api/brand-memory

Response:
{
  "data": {
    "voiceConfig": { ... },
    "learnedPatterns": { ... },
    "vocabulary": { ... },
    "topics": { ... },
    "contentPillars": { ... },
    "performancePatterns": { ... },
    "lastUpdatedAt": "2026-07-28T00:00:00Z",
    "learningStatus": {
      "postsAnalyzed": 45,
      "feedbackReceived": 23,
      "confidenceLevel": "high"   // low | medium | high
    }
  }
}
```

### Update Voice Configuration

```
PATCH /api/brand-memory/voice-config

Request Body:
{
  "formality": 3,
  "humor": 4,
  "emojiUsage": "moderate"
}

Response: Updated brand memory
```

### Update Content Pillars

```
PUT /api/brand-memory/pillars

Request Body:
{
  "pillars": [
    { "name": "AI & Technology", "allocation": 0.40, "subTopics": [...] },
    { "name": "Startup Life", "allocation": 0.35, "subTopics": [...] },
    { "name": "Personal Growth", "allocation": 0.25, "subTopics": [...] }
  ]
}
```

### Submit Feedback on Generation

```
POST /api/brand-memory/feedback

Request Body:
{
  "generationId": "gen-uuid",
  "postId": "post-uuid",
  "feedback": "positive",          // positive | negative
  "editedContent": "...",          // if user edited before accepting
  "reason": "tone_wrong"          // optional: tone_wrong | too_generic | wrong_format | perfect
}
```

### Trigger Voice Re-Analysis

```
POST /api/brand-memory/reanalyze

Triggers immediate recalculation of brand memory.
Useful after user connects a new account with history.

Response:
{
  "data": {
    "status": "processing",
    "estimatedCompletion": "2026-08-01T10:05:00Z"
  }
}
```

---

## Brand Memory in Prompts

### How Memory Feeds Into Generation

When generating content, the brand memory is injected into the system prompt:

```
VOICE PROFILE:
You write with formality level 4/5 (professional but not stiff).
You occasionally use light humor (2/5) — dry observations, not jokes.
You use emojis sparingly — mainly 🚀 💡 → to emphasize points.

WRITING PATTERNS:
- Start most posts with a bold statement or question
- Use short paragraphs (1-2 sentences each)
- Line break between every thought
- End with a question to the audience
- Average post length: 800-1200 characters

VOCABULARY:
Use these words naturally: "ship", "iterate", "leverage", "unlock"
NEVER use: "utilize", "synergy", "paradigm", "game-changer"
Industry terms you use: ARR, MRR, CAC, LTV, PMF

CONTENT STYLE:
- 35% personal stories with business lessons
- 30% educational how-to content
- 20% opinions and hot takes
- 10% promotional (subtle)
- 5% questions to audience

TOP PERFORMING PATTERNS:
- Posts with numbered lists get 2x engagement
- Opening with "I made a mistake..." gets high comments
- Tuesday 9am posts perform 40% better than average
- Posts between 800-1200 chars are your sweet spot
```

---

## Privacy & Data Handling

### What We Store
- Aggregated patterns (not raw posts from other platforms)
- User's feedback and preferences
- Performance statistics

### What We Don't Store
- Full copies of posts from external platforms (only snippets for analysis)
- Private messages or DMs
- Connection/follower personal data

### User Control
- User can view their entire brand memory profile
- User can reset brand memory (start fresh)
- User can export brand memory as JSON
- User can delete brand memory (part of account deletion)
- All learning is opt-in (user controls what feeds into memory)

---

## Confidence Scoring

Each aspect of brand memory has a confidence score:

```
Confidence Levels:
  High (>0.8): Pattern confirmed across 20+ posts and consistent feedback
  Medium (0.5-0.8): Pattern seen in 5-20 posts, mostly consistent
  Low (<0.5): Pattern emerging, limited data, may change

Usage:
  High confidence: Always apply in generation
  Medium confidence: Apply by default, allow variation
  Low confidence: Experiment — sometimes apply, sometimes don't

Example:
  "User prefers short paragraphs" — confidence: 0.92 (always do this)
  "User likes starting with questions" — confidence: 0.65 (do this ~65% of time)
  "User avoids exclamation marks" — confidence: 0.45 (sometimes avoid, test)
```
