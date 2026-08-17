import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-guard';
import { callAI } from '@/lib/ai';
import {
  buildSystemPrompt,
  buildVoiceDirectives,
  getBrandVoice,
  lengthRange,
  postIntervalDays,
  type BrandVoiceConfig,
} from '@/lib/brand-voice';
import { z } from 'zod';

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

async function fetchTopics(config: BrandVoiceConfig): Promise<TrendingTopic[]> {
  const focus =
    config.topics.length > 0
      ? `The reader's subject areas are: ${config.topics.join(', ')}. Every topic must sit inside one of them.`
      : 'Choose broadly useful software engineering and technology topics.';

  const banned =
    config.avoidWords.length > 0
      ? `\nNever use any of these words in a title: ${config.avoidWords.join(', ')}.`
      : '';

  const prompt = `List 3 specific, concrete topics suitable for professional posts.

${focus}${banned}

Format as a JSON array of 3 objects:
[
  { "trend": "Specific Topic Title", "category": "one of the subject areas above", "source": "Engineering Breakdown", "velocity": "rising|peaking|emerging" },
  ...
]

Return ONLY the JSON array.`;

  const raw = await callAI({
    system:
      'You return only valid JSON arrays of specific, non-clickbait topic titles. No maths notation.',
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

async function generatePostForTrend(
  topic: TrendingTopic,
  config: BrandVoiceConfig,
): Promise<string> {
  const [, maxChars] = lengthRange[config.postLength];

  const prompt = `Write one post about: "${topic.trend}"
Source: ${topic.source}

Apply the voice exactly as specified:
${buildVoiceDirectives(config)}

Return only the post text — no preamble, no title, no surrounding quotes.`;

  return callAI({
    system: buildSystemPrompt(config),
    // Roughly four characters per token, plus headroom for hashtags.
    maxTokens: Math.ceil(maxChars / 3) + 120,
    messages: [{ role: 'user', content: prompt }],
  });
}

// ─── GET /api/ai/suggestions ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    const config = await getBrandVoice(authUser.userId);
    const topics = await fetchTopics(config);
    const intervalDays = postIntervalDays(config.postFrequency);

    const suggestions = await Promise.all(
      topics.map(async (topic, i) => {
        const content = await generatePostForTrend(topic, config);

        // Space slots by the configured cadence rather than a fixed one a day.
        const scheduledAt = new Date();
        scheduledAt.setDate(scheduledAt.getDate() + intervalDays * (i + 1));
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
  const authUser = await getAuthUser(req);
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
