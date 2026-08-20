import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, unstable_cache } from 'next/cache';
import { SUGGESTIONS_CACHE_KEY, suggestionsTag } from '@/lib/suggestions-cache';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
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
import { generateClaudePostImage } from '@/lib/topic-card';
import { getGrowthInsights } from '@/lib/growth/repository';
import { buildGrowthDirectives, pickSlots } from '@/lib/growth/apply';
import {
  buildSuggestionPolishPrompt,
  polishSuggestionRequestSchema,
} from '@/lib/suggestion-polish';
import { z } from 'zod';
import { fingerprintPostContent } from '@/lib/post-dedupe';

export const runtime = 'nodejs';

interface TrendingTopic {
  id: string;
  trend: string;
  category: string;
  velocity: string;
  source: string;
  url?: string;
}

/** How many drafts one refresh produces. */
const SUGGESTION_COUNT = 5;

// ─── Topic generation ───────────────────────────────────────────────────────

async function fetchTopics(config: BrandVoiceConfig): Promise<TrendingTopic[]> {
  const focus =
    config.topics.length > 0
      ? `The reader's subject areas are: ${config.topics.join(', ')}. Every topic must sit inside one of them.`
      : 'Choose broadly useful software engineering and technology topics.';

  const banned =
    config.avoidWords.length > 0
      ? `\nNever use any of these words in a title: ${config.avoidWords.join(', ')}.`
      : '';

  const prompt = `List ${SUGGESTION_COUNT} specific, concrete topics suitable for professional posts.

${focus}${banned}

Each topic must be clearly distinct from the others — no two on the same angle.

Format as a JSON array of ${SUGGESTION_COUNT} objects:
[
  { "trend": "Specific Topic Title", "category": "one of the subject areas above", "source": "Engineering Breakdown", "velocity": "rising|peaking|emerging" },
  ...
]

Return ONLY the JSON array.`;

  const raw = await callAI({
    system:
      'You return only valid JSON arrays of specific, non-clickbait topic titles. No maths notation.',
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 700,
  });

  const topicSchema = z.object({
    trend: z.string().trim().min(1),
    category: z.string().trim().min(1),
    velocity: z.string().trim().min(1),
    source: z.string().trim().min(1),
  });
  const cleaned = raw.replace(/```json|```/g, '').trim();
  // Accept a short list rather than failing the whole refresh — one topic fewer
  // is better than no suggestions at all.
  const parsed = z.array(topicSchema).min(1).parse(JSON.parse(cleaned));

  return parsed.slice(0, SUGGESTION_COUNT).map((topic, index) => ({
    id: `eng-${Date.now()}-${index}`,
    ...topic,
  }));
}

// ─── Generate post content for a trend ─────────────────────────────────────

async function generatePostForTrend(
  topic: TrendingTopic,
  config: BrandVoiceConfig,
  growthDirectives: string,
): Promise<string> {
  const [, maxChars] = lengthRange[config.postLength];

  const prompt = `Write one post about: "${topic.trend}"
Source: ${topic.source}

Apply the voice exactly as specified:
${buildVoiceDirectives(config)}
${growthDirectives ? `
${growthDirectives}
` : ''}
Return only the post text — no preamble, no title, no surrounding quotes.`;

  return callAI({
    system: buildSystemPrompt(config),
    // Roughly four characters per token, plus headroom for hashtags.
    maxTokens: Math.ceil(maxChars / 3) + 120,
    messages: [{ role: 'user', content: prompt }],
  });
}

// ─── GET /api/ai/suggestions ────────────────────────────────────────────────

/**
 * Generating a batch costs five model calls plus five image generations and
 * takes 15-40s, so the result is cached per user and reused across refreshes.
 * The user regenerates deliberately via ?refresh=1.
 */
async function generateSuggestions(userId: string) {
    const config = await getBrandVoice(userId);
    // What has actually worked for this account, if there is enough history.
    const insights = await getGrowthInsights(userId);
    const growthDirectives = buildGrowthDirectives(insights);
    const topics = await fetchTopics(config);
    const intervalDays = postIntervalDays(config.postFrequency);
    const slots = pickSlots(insights, topics.length, intervalDays);

    const suggestions = await Promise.all(
      topics.map(async (topic, i) => {
        const content = await generatePostForTrend(topic, config, growthDirectives);
        const imageUrl = await generateClaudePostImage({
          trend: topic.trend,
          category: topic.category,
          content,
        });

        // Cadence from the brand voice; hour from whatever has actually
        // performed for this account, falling back to 09:00 when unproven.
        const scheduledAt = slots[i] ?? new Date();

        return {
          id: topic.id,
          trend: topic.trend,
          category: topic.category,
          velocity: topic.velocity,
          source: topic.source,
          url: topic.url,
          imageUrl,
          imageAltText: `System design diagram for ${topic.trend}`,
          content,
          platform: 'linkedin',
          scheduledAt: scheduledAt.toISOString(),
          characterCount: content.length,
        };
      }),
    );

    const existingPosts = await prisma.post.findMany({
      where: { userId: userId, platform: 'linkedin' },
      select: { content: true, contentFingerprint: true },
    });
    const seenFingerprints = new Set(
      existingPosts.map((post) => post.contentFingerprint || fingerprintPostContent(post.content)),
    );
    const uniqueSuggestions = suggestions.filter((suggestion) => {
      const fingerprint = fingerprintPostContent(suggestion.content);
      if (seenFingerprints.has(fingerprint)) return false;
      seenFingerprints.add(fingerprint);
      return true;
    });

  return uniqueSuggestions;
}

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const refresh = req.nextUrl.searchParams.get('refresh') === '1';

  try {
    // An explicit refresh drops the cached batch first so the next read misses.
    if (refresh) revalidateTag(suggestionsTag(authUser.userId));

    const suggestions = await unstable_cache(
      () => generateSuggestions(authUser.userId),
      [SUGGESTIONS_CACHE_KEY, authUser.userId],
      { revalidate: 60 * 60, tags: [suggestionsTag(authUser.userId)] },
    )();

    return NextResponse.json({ data: { suggestions, cached: !refresh } });
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

  const body: unknown = await req.json();
  const polishRequest = polishSuggestionRequestSchema.safeParse(body);
  if (polishRequest.success) {
    try {
      const config = await getBrandVoice(authUser.userId);
      const content = await callAI({
        system: buildSystemPrompt(config),
        messages: [
          { role: 'user', content: buildSuggestionPolishPrompt(polishRequest.data) },
        ],
        maxTokens: 1400,
        temperature: 0.45,
      });

      return NextResponse.json({ data: { content: content.slice(0, 25000) } });
    } catch (error: unknown) {
      console.error(
        '[AI Suggestion Polish]',
        error instanceof Error ? error.message : 'Polishing failed',
      );
      return NextResponse.json(
        {
          error: {
            code: 'AI_POLISH_FAILED',
            message: 'The post could not be polished. Please try again.',
          },
        },
        { status: 502 },
      );
    }
  }

  if (
    typeof body === 'object' &&
    body !== null &&
    'action' in body &&
    body.action === 'polish'
  ) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Enter polishing instructions before continuing.',
          details: polishRequest.error.issues,
        },
      },
      { status: 400 },
    );
  }

  const suggestionSchema = z.object({
    id: z.string().min(1),
    trend: z.string().trim().min(1),
    category: z.string().trim().min(1),
    velocity: z.string().trim().min(1),
    source: z.string().trim().min(1),
    content: z.string().trim().min(1).max(25000),
    platform: z.literal('linkedin'),
    scheduledAt: z.string().datetime(),
    imageUrl: z.string().startsWith('data:image/png;base64,'),
    imageAltText: z.string().trim().min(1).max(4086),
  });
  const approvalSchema = z.object({
    action: z.enum(['approve_all', 'approve_one', 'reject_one']),
    suggestions: z.array(suggestionSchema).min(1),
  });
  const parsed = approvalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Every approved AI suggestion must include its generated PNG image.',
          details: parsed.error.issues,
        },
      },
      { status: 400 },
    );
  }

  const { action, suggestions } = parsed.data;
  if (action === 'reject_one') return NextResponse.json({ data: { ok: true } });

  const account = await prisma.socialAccount.findFirst({
    where: { userId: authUser.userId, provider: 'linkedin', status: 'active' },
  });

  if (!account) {
    return NextResponse.json(
      { error: { code: 'NOT_CONNECTED', message: 'LinkedIn not connected' } },
      { status: 400 }
    );
  }

  const existingPosts = await prisma.post.findMany({
    where: { userId: authUser.userId, platform: 'linkedin' },
    select: { content: true, contentFingerprint: true },
  });
  const seenFingerprints = new Set(
    existingPosts.map((post) => post.contentFingerprint || fingerprintPostContent(post.content)),
  );
  const uniqueSuggestions = suggestions.filter((suggestion) => {
    const fingerprint = fingerprintPostContent(suggestion.content);
    if (seenFingerprints.has(fingerprint)) return false;
    seenFingerprints.add(fingerprint);
    return true;
  });

  if (action === 'approve_all') {
    try {
      const posts = await prisma.$transaction(
        uniqueSuggestions.map((s) =>
          prisma.post.create({
            data: {
              userId: authUser.userId,
              socialAccountId: account.id,
              content: s.content,
              contentFingerprint: fingerprintPostContent(s.content),
              platform: 'linkedin',
              status: 'scheduled',
              scheduledAt: new Date(s.scheduledAt),
              aiGenerated: true,
              mediaUrls: [s.imageUrl],
              metadata: {
                trend: s.trend,
                source: s.source,
                category: s.category,
                imageUrl: s.imageUrl,
                imageAltText: s.imageAltText,
              },
            },
          }),
        ),
      );
      return NextResponse.json({
        data: { approved: posts.length, skipped: suggestions.length - posts.length },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json(
          { error: { code: 'DUPLICATE_POST', message: 'A matching post already exists for this platform.' } },
          { status: 409 },
        );
      }
      throw error;
    }
  }

  if (action === 'approve_one') {
    const s = suggestions[0];
    if (!uniqueSuggestions.some((suggestion) => suggestion.id === s.id)) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE_POST', message: 'A matching post already exists for this platform.' } },
        { status: 409 },
      );
    }

    try {
      const post = await prisma.post.create({
        data: {
          userId: authUser.userId,
          socialAccountId: account.id,
          content: s.content,
          contentFingerprint: fingerprintPostContent(s.content),
          platform: 'linkedin',
          status: 'scheduled',
          scheduledAt: new Date(s.scheduledAt),
          aiGenerated: true,
          mediaUrls: [s.imageUrl],
          metadata: {
            trend: s.trend,
            source: s.source,
            category: s.category,
            imageUrl: s.imageUrl,
            imageAltText: s.imageAltText,
          },
        },
      });
      return NextResponse.json({ data: { post } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json(
          { error: { code: 'DUPLICATE_POST', message: 'A matching post already exists for this platform.' } },
          { status: 409 },
        );
      }
      throw error;
    }
  }

  return NextResponse.json({ data: { ok: true } });
}
