# Comment Agent

## Overview

The Comment Agent manages engagement by monitoring comments on published posts, analyzing sentiment, generating AI reply suggestions, and providing a unified inbox for efficient comment management across all platforms.

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Comment Agent System                      │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌───────────────┐  │
│  │ Comment      │   │ Analysis     │   │ Reply         │  │
│  │ Fetcher      │→  │ Engine       │→  │ Generator     │  │
│  │ (Worker)     │   │ (Sentiment)  │   │ (AI)          │  │
│  └──────────────┘   └──────────────┘   └───────────────┘  │
│         ↑                                       │          │
│         │                                       ▼          │
│  ┌──────────────┐                     ┌───────────────┐   │
│  │ Platform     │                     │ Reply         │   │
│  │ APIs         │                     │ Publisher     │   │
│  └──────────────┘                     └───────────────┘   │
└────────────────────────────────────────────────────────────┘
```

---

## Comment Fetching

### Fetch Schedule

```
Posts < 24 hours old:   Fetch every 1 hour
Posts 1-7 days old:     Fetch every 4 hours
Posts 7-14 days old:    Fetch every 12 hours
Posts 14-30 days old:   Fetch daily
Posts > 30 days old:    Stop fetching
```

### Fetch Logic

```typescript
async function fetchCommentsForPost(postId: string) {
  const post = await postRepository.findById(postId);
  const account = await socialAccountRepository.findById(post.socialAccountId);
  
  // Decrypt and validate token
  const accessToken = await getValidToken(account);
  
  // Fetch from platform
  const platformComments = await platformProvider.getComments(
    accessToken, 
    post.platformPostId
  );
  
  // Process each comment
  for (const comment of platformComments) {
    // Check if already stored (dedup by platform_comment_id)
    const existing = await commentRepository.findByPlatformId(
      postId, 
      comment.platformId
    );
    
    if (!existing) {
      // New comment — analyze and store
      const sentiment = await analyzeSentiment(comment.content);
      const isQuestion = detectQuestion(comment.content);
      const priority = calculatePriority(comment, sentiment, isQuestion);
      
      await commentRepository.create({
        postId,
        userId: post.userId,
        platformCommentId: comment.platformId,
        authorName: comment.authorName,
        authorProfileUrl: comment.authorProfileUrl,
        authorAvatarUrl: comment.authorAvatarUrl,
        content: comment.content,
        sentiment: sentiment.label,
        sentimentScore: sentiment.score,
        isQuestion,
        priority,
        platformCreatedAt: comment.createdAt
      });
      
      // Notify user of new comment
      await notificationQueue.add('notify', {
        userId: post.userId,
        type: 'comment_received',
        title: `New comment from ${comment.authorName}`,
        message: comment.content.substring(0, 100),
        data: { postId, commentId: comment.platformId }
      });
    }
  }
}
```

---

## Sentiment Analysis

### Classification

```
Positive (0.6 - 1.0):
  "Great post! Really helpful advice."
  "Congratulations on the milestone!"
  "This resonates with me deeply."

Neutral (0.3 - 0.6):
  "Interesting perspective."
  "What about X scenario?"
  "I've seen different approaches to this."

Negative (0.0 - 0.3):
  "I completely disagree with this take."
  "This is misleading information."
  "Not sure this applies in the real world."
```

### Analysis Method

```typescript
async function analyzeSentiment(content: string): Promise<SentimentResult> {
  // Use lightweight AI call for sentiment
  const response = await aiProvider.generateContent({
    systemPrompt: `Analyze the sentiment of this social media comment. 
                   Return JSON: { "label": "positive|neutral|negative", "score": 0.0-1.0 }`,
    userPrompt: content,
    temperature: 0.1,
    maxTokens: 50,
    model: 'gpt-4o-mini' // Cheap, fast model for classification
  });
  
  return JSON.parse(response.content);
}
```

---

## Priority Scoring

### Priority Algorithm

```
Priority Score (0-100):

High Priority (75-100):
  - Questions from verified/notable accounts (+30)
  - Negative sentiment comments (+25)
  - Questions that indicate interest/potential lead (+20)
  - Comments with many likes themselves (+15)
  - First comment on a post (+10)

Medium Priority (40-74):
  - General questions (+20)
  - Detailed positive feedback (+15)
  - Comments that mention the user by name (+10)
  - Comments with engagement (likes on the comment) (+10)

Low Priority (0-39):
  - Simple positive reactions ("Great!", "Love this!") (+5)
  - Emoji-only comments (+2)
  - Obvious spam/irrelevant (0)
```

### Priority Factors

```typescript
function calculatePriority(comment, sentiment, isQuestion): number {
  let score = 0;
  
  // Question weight
  if (isQuestion) score += 25;
  
  // Sentiment weight  
  if (sentiment.label === 'negative') score += 20;
  if (sentiment.label === 'positive' && comment.content.length > 50) score += 10;
  
  // Engagement signals
  if (comment.likesCount > 5) score += 15;
  if (comment.isVerifiedAuthor) score += 20;
  
  // Content depth
  if (comment.content.length > 100) score += 10;
  if (comment.content.length < 10) score -= 10;
  
  // Recency
  const hoursOld = (Date.now() - comment.createdAt) / 3600000;
  if (hoursOld < 1) score += 15;
  else if (hoursOld < 6) score += 10;
  else if (hoursOld < 24) score += 5;
  
  return Math.max(0, Math.min(100, score));
}
```

---

## AI Reply Generation

### Reply Generation Flow

```
1. User opens comment in inbox
2. System triggers reply generation:
   - Load original post content
   - Load comment content and context
   - Load user's brand memory
   - Load user's past reply patterns

3. Generate 2-3 reply options:
   - Option A: Thoughtful/detailed reply
   - Option B: Concise/appreciative reply
   - Option C: Engagement-driving reply (question back)

4. Display options to user
5. User selects, edits if needed, and sends
```

### Reply Generation Prompt

```
SYSTEM PROMPT:
You are generating a reply to a social media comment on behalf of the user.
Match the user's brand voice exactly.

USER'S VOICE: {brand_memory_summary}
USER'S REPLY STYLE: {past_reply_patterns}

CONTEXT:
Original post: "{post_content}"
Comment from {author_name}: "{comment_content}"
Comment sentiment: {sentiment}
Is this a question: {is_question}

RULES:
- Be authentic and personal (not corporate)
- Match the energy of the comment
- If it's a question, provide a helpful answer
- If it's positive, be grateful but add value
- If it's negative, be respectful and professional
- Keep replies concise (1-3 sentences typically)
- Never be defensive or argumentative
- Add a follow-up question when appropriate (drives engagement)

Generate 3 reply options with different approaches.
```

### Reply Types

| Comment Type | Reply Strategy |
|-------------|---------------|
| Simple praise | Brief thanks + value add |
| Detailed praise | Acknowledge specifically what they noted + extend |
| Question | Direct answer + offer to elaborate |
| Disagreement | Acknowledge perspective + explain reasoning calmly |
| Personal story | Relate to their experience + ask follow-up |
| Tag/mention | Acknowledge + engage |
| Spam | Don't reply (mark as spam) |

---

## API Endpoints

### Get Comment Inbox

```
GET /api/comments?replied=false&sort=priority:desc&limit=20

Response:
{
  "data": {
    "comments": [
      {
        "id": "comment-uuid",
        "postId": "post-uuid",
        "postPreview": "First 80 chars of the original post...",
        "authorName": "Jane Smith",
        "authorAvatarUrl": "https://...",
        "authorProfileUrl": "https://linkedin.com/in/janesmith",
        "content": "Great insights! How do you balance automation with authenticity?",
        "sentiment": "positive",
        "isQuestion": true,
        "priority": 82,
        "replied": false,
        "platformCreatedAt": "2026-08-01T14:30:00Z",
        "fetchedAt": "2026-08-01T15:00:00Z"
      }
    ],
    "stats": {
      "totalUnreplied": 12,
      "highPriority": 3,
      "questions": 5,
      "negative": 1
    }
  },
  "pagination": { ... }
}

Filters:
  - replied: true | false
  - sentiment: positive | neutral | negative
  - isQuestion: true | false
  - postId: filter by specific post
  - priority: min priority score
  - sort: priority:desc | platformCreatedAt:desc
```

### Get Reply Suggestions

```
POST /api/comments/:id/suggestions

Response:
{
  "data": {
    "suggestions": [
      {
        "id": "suggestion-1",
        "content": "Thanks Jane! Great question. I balance it by always reviewing AI drafts before posting and adding personal touches. The AI handles the heavy lifting, but the voice is always mine. What's been your experience with AI tools?",
        "type": "detailed",
        "tone": "warm"
      },
      {
        "id": "suggestion-2",
        "content": "Appreciate you asking! Short answer: AI drafts, human approves. Never let AI have full autonomy — your unique perspective is what builds trust.",
        "type": "concise",
        "tone": "direct"
      },
      {
        "id": "suggestion-3",
        "content": "Thanks for the thoughtful question! I actually wrote about this last week. The key is using AI as a starting point, not the final word. Curious — are you using any AI tools for your content?",
        "type": "engagement",
        "tone": "curious"
      }
    ]
  }
}
```

### Send Reply

```
POST /api/comments/:id/reply

Request Body:
{
  "content": "Thanks Jane! Great question...",
  "suggestionId": "suggestion-1"  // optional, for tracking which suggestion was used
}

Process:
1. Validate reply content
2. Call platform API to post reply
3. Update comment record (replied = true, replyContent, repliedAt)
4. Track which suggestion was used (for learning)

Response (200):
{
  "data": {
    "commentId": "comment-uuid",
    "replied": true,
    "replyContent": "Thanks Jane! Great question...",
    "repliedAt": "2026-08-01T16:00:00Z"
  }
}
```

### Mark Comment (No Reply Needed)

```
POST /api/comments/:id/dismiss

Request Body:
{
  "reason": "no_reply_needed"  // no_reply_needed | spam | duplicate
}
```

### Bulk Reply

```
POST /api/comments/bulk/reply

Request Body:
{
  "replies": [
    { "commentId": "uuid-1", "content": "Thank you!" },
    { "commentId": "uuid-2", "content": "Appreciate it!" },
    { "commentId": "uuid-3", "content": "Thanks for sharing your perspective!" }
  ]
}

// For simple positive comments, allows batch handling
```

---

## Comment Analytics

### Engagement Metrics

```
GET /api/comments/analytics?period=30d

Response:
{
  "data": {
    "totalComments": 89,
    "repliedCount": 72,
    "replyRate": 0.81,
    "avgResponseTime": "4.2 hours",
    "sentimentBreakdown": {
      "positive": 62,
      "neutral": 20,
      "negative": 7
    },
    "topCommenters": [
      { "name": "Jane Smith", "count": 8, "sentiment": "mostly_positive" }
    ],
    "questionsAsked": 23,
    "questionsAnswered": 21
  }
}
```

---

## Auto-Reply System (Future - Phase 6+)

### Configuration

```json
{
  "autoReply": {
    "enabled": false,
    "rules": [
      {
        "condition": "simple_positive",
        "examples": ["Great post!", "Love this!", "Amazing!", "🔥", "👏"],
        "action": "auto_reply",
        "replyTemplates": ["Thank you! 🙏", "Appreciate it!", "Thanks for reading!"],
        "confidenceThreshold": 0.95
      },
      {
        "condition": "question",
        "action": "suggest_only",
        "note": "Never auto-reply to questions"
      },
      {
        "condition": "negative",
        "action": "flag_only",
        "note": "Always require human review for negative comments"
      }
    ],
    "dailyLimit": 20,
    "excludeAuthors": ["competitor_handle"],
    "reviewQueue": true  // Show auto-replies in a review queue for undo
  }
}
```

### Auto-Reply Safety

- Never auto-reply to questions
- Never auto-reply to negative comments
- Maximum 20 auto-replies per day
- Confidence threshold of 95% required
- All auto-replies visible in review queue
- User can undo any auto-reply within 5 minutes
- System learns from undo actions (reduce confidence for similar)

---

## Comment Worker

```typescript
// Comment fetch scheduler
const commentScheduler = {
  // Fetch comments for recent posts
  recentPosts: {
    cron: '0 */1 * * *',  // Every hour
    filter: 'posts published < 24 hours ago'
  },
  activePosts: {
    cron: '0 */4 * * *',  // Every 4 hours
    filter: 'posts published 1-7 days ago'
  },
  olderPosts: {
    cron: '0 */12 * * *', // Every 12 hours
    filter: 'posts published 7-14 days ago'
  },
  archivePosts: {
    cron: '0 0 * * *',    // Daily
    filter: 'posts published 14-30 days ago'
  }
};
```
