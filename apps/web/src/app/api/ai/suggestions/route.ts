import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-guard';
import { callAI } from '@/lib/ai';
import { z } from 'zod';

// ─── Humanized Engineering System Prompt ─────────────────────────────────────

const SYSTEM_ENGINEERING_PROMPT = `You are a friendly Senior Software Engineer sharing genuine tech insights on LinkedIn.

TONE & STYLE:
- Human, conversational, and easy to read. Write like a passionate developer explaining a cool concept to a teammate over coffee.
- ABSOLUTELY NO COMPLEX MATH SYMBOLS or LATEX (NO $O(N^2)$, NO ODEs, NO LaTeX math notation).
- Use clear real-world analogies to make technical concepts digestible.
- Explain core mechanics clearly (e.g. how bcrypt hashing introduces deliberate computational delay so hackers can't brute-force passwords easily).
- NO corporate marketing buzzwords ("game-changer", "paradigm shift", "synergy").

STRUCTURE:
1. Hook: A clear, eye-opening tech fact or release takeaway.
2. Core Breakdown: Simple explanation of how and why it works under the hood.
3. Practical Takeaway: What senior developers and teams should keep in mind.
4. Engaging question to start a developer discussion + 3-4 targeted hashtags (#SoftwareEngineering #Backend #WebDev #Coding).`;

interface TrendingTopic {
  id: string;
  trend: string;
  category: string;
  velocity: string;
  source: string;
  url?: string;
  imageUrl?: string;
}

// ─── Crisp Topic-Matched Technical Visual Assets ─────────────────────────────

const TOPIC_VISUALS = {
  security: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80', // Digital security lock & encryption
  ai: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80', // Neural network AI mesh
  database: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80', // High-performance server cluster
  systems: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', // Microchip hardware architecture
};

function getMatchingImageForTopic(trend: string, category: string): string {
  const lower = (trend + ' ' + category).toLowerCase();

  if (lower.includes('security') || lower.includes('bcrypt') || lower.includes('hash') || lower.includes('auth')) {
    return TOPIC_VISUALS.security;
  }
  if (lower.includes('ai') || lower.includes('claude') || lower.includes('anthropic') || lower.includes('llm') || lower.includes('model')) {
    return TOPIC_VISUALS.ai;
  }
  if (lower.includes('postgres') || lower.includes('database') || lower.includes('sql') || lower.includes('mvcc')) {
    return TOPIC_VISUALS.database;
  }
  return TOPIC_VISUALS.systems;
}

// ─── Generate Humanized Software Engineering Topics ─────────────────────────

async function fetchSoftwareEngineeringTopics(): Promise<TrendingTopic[]> {
  const prompt = `List 3 engaging software engineering topics or core computer science concepts (like Bcrypt password security, Anthropic model context handling, or PostgreSQL concurrency) for developer posts.

Format as JSON array of 3 objects:
[
  { "trend": "Clear Developer Topic Title", "category": "AI Infrastructure|Backend|Database|Security|Systems", "source": "Engineering Breakdown", "velocity": "rising|peaking|emerging" },
  ...
]

Return ONLY the JSON array.`;

  const raw = await callAI({
    system: 'You return only valid JSON arrays of humanized software engineering topic titles. No math notation, no clickbait.',
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 400,
  });

  const topicSchema = z.object({
    trend: z.string().trim().min(1),
    category: z.string().trim().min(1),
    velocity: z.string().trim().min(1),
    source: z.string().trim().min(1),
  });
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const parsed = z.array(topicSchema).min(3).parse(JSON.parse(cleaned));

  return parsed.slice(0, 3).map((topic, index) => ({
    id: `eng-${Date.now()}-${index}`,
    ...topic,
    imageUrl: getMatchingImageForTopic(topic.trend, topic.category),
  }));
}

// ─── Generate post content for a trend ─────────────────────────────────────

async function generatePostForTrend(topic: TrendingTopic): Promise<string> {
  const prompt = `Write a human, easy-to-understand technical LinkedIn post about: "${topic.trend}"
Source: ${topic.source}

Requirements:
- Written in clear, plain developer terms (no LaTeX math like $O(N^2)$, no scary equations)
- Explain the real-world engineering mechanics using simple analogies
- Highlight why this matters for software developers building applications today
- NO corporate marketing buzzwords ("game-changer", "paradigm shift", "synergy")
- 400-750 characters total
- End with a friendly discussion question for devs and 3-4 hashtags`;

  return callAI({
    system: SYSTEM_ENGINEERING_PROMPT,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 750,
  });
}

// ─── GET /api/ai/suggestions ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    const topics = await fetchSoftwareEngineeringTopics();
    const suggestions = await Promise.all(
      topics.map(async (topic, i) => {
        const content = await generatePostForTrend(topic);

        const scheduledAt = new Date();
        scheduledAt.setDate(scheduledAt.getDate() + i + 1);
        scheduledAt.setHours(9, 0, 0, 0);

        return {
          id: topic.id,
          trend: topic.trend,
          category: topic.category,
          velocity: topic.velocity,
          source: topic.source,
          url: topic.url,
          imageUrl: topic.imageUrl || getMatchingImageForTopic(topic.trend, topic.category),
          content,
          platform: 'linkedin',
          scheduledAt: scheduledAt.toISOString(),
          characterCount: content.length,
        };
      }),
    );

    return NextResponse.json({ data: { suggestions } });
  } catch (error: unknown) {
    console.error(
      '[AI Suggestions]',
      error instanceof Error ? error.message : 'Suggestion generation failed',
    );
    return NextResponse.json(
      {
        error: {
          code: 'AI_GENERATION_FAILED',
          message: 'AI suggestions could not be generated. Please try again.',
        },
      },
      { status: 502 },
    );
  }
}

// ─── POST /api/ai/suggestions ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const { action, suggestions } = await req.json();

  const account = await prisma.socialAccount.findFirst({
    where: { userId: authUser.userId, provider: 'linkedin', status: 'active' },
  });

  if (!account) {
    return NextResponse.json(
      { error: { code: 'NOT_CONNECTED', message: 'LinkedIn not connected' } },
      { status: 400 }
    );
  }

  if (action === 'approve_all') {
    const posts = await Promise.all(
      suggestions.map((s: any) =>
        prisma.post.create({
          data: {
            userId: authUser.userId,
            socialAccountId: account.id,
            content: s.content,
            platform: 'linkedin',
            status: 'scheduled',
            scheduledAt: new Date(s.scheduledAt),
            aiGenerated: true,
            metadata: { trend: s.trend, source: s.source, category: s.category, imageUrl: s.imageUrl },
          },
        })
      )
    );
    return NextResponse.json({ data: { approved: posts.length } });
  }

  if (action === 'approve_one') {
    const s = suggestions[0];
    const post = await prisma.post.create({
      data: {
        userId: authUser.userId,
        socialAccountId: account.id,
        content: s.content,
        platform: 'linkedin',
        status: 'scheduled',
        scheduledAt: new Date(s.scheduledAt),
        aiGenerated: true,
        metadata: { trend: s.trend, source: s.source, category: s.category, imageUrl: s.imageUrl },
      },
    });
    return NextResponse.json({ data: { post } });
  }

  return NextResponse.json({ data: { ok: true } });
}
