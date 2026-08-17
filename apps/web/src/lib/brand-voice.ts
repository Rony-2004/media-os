import { z } from 'zod';
import { prisma } from '@/lib/db';

/**
 * Brand voice — the per-user writing configuration that drives AI drafting.
 *
 * This is the single source of truth for the shape. The settings UI, both API
 * routes, and the suggestion generator all read from here, so a field cannot
 * drift between where it is edited and where it is used.
 */

export const EMOJI_USAGE = ['none', 'light', 'moderate', 'heavy'] as const;
export const POST_LENGTH = ['short', 'medium', 'long'] as const;
export const POST_FREQUENCY = ['1_week', '3_week', '5_week', '7_week'] as const;

export const brandVoiceSchema = z.object({
  formality: z.number().int().min(1).max(5),
  humor: z.number().int().min(1).max(5),
  emojiUsage: z.enum(EMOJI_USAGE),
  postLength: z.enum(POST_LENGTH),
  imageStyle: z.string().trim().min(1).max(60),
  proficiency: z.string().trim().min(1).max(60),
  postFrequency: z.enum(POST_FREQUENCY),
  topics: z.array(z.string().trim().min(1).max(80)).max(40),
  avoidWords: z.array(z.string().trim().min(1).max(60)).max(100),
  samplePosts: z.string().max(8000),
  autoApprove: z.boolean(),
  autoSchedule: z.boolean(),
});

export type BrandVoiceConfig = z.infer<typeof brandVoiceSchema>;

export const brandVoiceDefaults: BrandVoiceConfig = {
  formality: 3,
  humor: 2,
  emojiUsage: 'light',
  postLength: 'medium',
  imageStyle: 'professional',
  proficiency: 'expert',
  postFrequency: '3_week',
  topics: ['Software Engineering', 'System Design', 'AI Infrastructure'],
  avoidWords: ['synergy', 'leverage', 'game-changer'],
  samplePosts: '',
  autoApprove: false,
  autoSchedule: true,
};

/** Accepts partial/legacy payloads and fills the gaps with defaults. */
export function normalizeBrandVoice(input: unknown): BrandVoiceConfig {
  const merged = { ...brandVoiceDefaults, ...(input as Record<string, unknown> | null ?? {}) };
  return brandVoiceSchema.parse(merged);
}

export async function getBrandVoice(userId: string): Promise<BrandVoiceConfig> {
  const row = await prisma.brandVoice.findUnique({ where: { userId } });
  if (!row) return brandVoiceDefaults;

  return normalizeBrandVoice({
    formality: row.formality,
    humor: row.humor,
    emojiUsage: row.emojiUsage,
    postLength: row.postLength,
    imageStyle: row.imageStyle,
    proficiency: row.proficiency,
    postFrequency: row.postFrequency,
    topics: row.topics,
    avoidWords: row.avoidWords,
    samplePosts: row.samplePosts,
    autoApprove: row.autoApprove,
    autoSchedule: row.autoSchedule,
  });
}

export async function saveBrandVoice(
  userId: string,
  input: unknown,
): Promise<BrandVoiceConfig> {
  const config = normalizeBrandVoice(input);
  await prisma.brandVoice.upsert({
    where: { userId },
    create: { userId, ...config },
    update: config,
  });
  return config;
}

/* ── Prompt construction ─────────────────────────────────────────────────── */

const formalityScale = [
  'very casual — contractions, short sentences, first person',
  'casual and conversational',
  'balanced: professional but human',
  'formal and measured',
  'corporate and authoritative',
];

const humorScale = [
  'strictly serious and technical; no jokes',
  'mostly serious, occasional light aside',
  'lightly witty where it fits naturally',
  'playful and personable',
  'very playful; humour is part of the voice',
];

const emojiRule: Record<(typeof EMOJI_USAGE)[number], string> = {
  none: 'Do not use emoji at all.',
  light: 'Use at most one or two emoji in the whole post.',
  moderate: 'Use roughly three to five emoji.',
  heavy: 'Use emoji liberally throughout.',
};

export const lengthRange: Record<(typeof POST_LENGTH)[number], [number, number]> = {
  short: [100, 300],
  medium: [300, 800],
  long: [800, 1500],
};

/** Days between consecutive suggested slots, from the target cadence. */
export function postIntervalDays(frequency: BrandVoiceConfig['postFrequency']): number {
  switch (frequency) {
    case '7_week':
      return 1;
    case '5_week':
      return 1;
    case '3_week':
      return 2;
    case '1_week':
      return 7;
  }
}

/**
 * Render the config as explicit instructions for the model. Kept deterministic
 * and free of hidden defaults so the output can be asserted in tests.
 */
export function buildVoiceDirectives(config: BrandVoiceConfig): string {
  const [min, max] = lengthRange[config.postLength];
  const lines = [
    `Tone: ${formalityScale[config.formality - 1]}.`,
    `Personality: ${humorScale[config.humor - 1]}.`,
    `Emoji: ${emojiRule[config.emojiUsage]}`,
    `Length: between ${min} and ${max} characters.`,
    `Audience level: write for a ${config.proficiency} reader.`,
  ];

  if (config.topics.length > 0) {
    lines.push(`Subject areas: ${config.topics.join(', ')}.`);
  }

  if (config.avoidWords.length > 0) {
    lines.push(
      `Banned words and phrases — never use any of these, in any form: ${config.avoidWords.join(', ')}.`,
    );
  }

  if (config.samplePosts.trim()) {
    lines.push(
      `Match the voice of these samples written by the user:\n"""\n${config.samplePosts.trim().slice(0, 4000)}\n"""`,
    );
  }

  return lines.join('\n');
}

/** System prompt for draft generation, derived entirely from the config. */
export function buildSystemPrompt(config: BrandVoiceConfig): string {
  return `You write social posts on behalf of one person. Match their voice exactly.

${buildVoiceDirectives(config)}

Always:
- Write plain prose. No LaTeX or maths notation (never write things like $O(N^2)$).
- Explain mechanics concretely, using real-world analogies where they help.
- Open with a specific hook, not a throat-clearing preamble.
- Close with a question that invites a real reply, plus 3-4 relevant hashtags.
- Never fabricate statistics, benchmarks, quotes, or sources.`;
}
