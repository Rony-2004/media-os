/**
 * Post traits — the features the growth engine correlates against outcomes.
 *
 * Everything here is derived from data we already hold, so traits can be
 * recomputed for historical posts rather than only captured going forward.
 */

export type LengthBucket = 'short' | 'medium' | 'long';
export type HashtagBucket = 'none' | 'few' | 'many';
export type HookStyle = 'question' | 'number' | 'contrarian' | 'story' | 'statement';

export interface PostTraits {
  topic: string | null;
  length: LengthBucket;
  charCount: number;
  hook: HookStyle;
  hashtagCount: number;
  hashtags: HashtagBucket;
  emojiCount: number;
  closesWithQuestion: boolean;
  paragraphs: number;
  /** 0 = Sunday, matching Date#getDay. */
  weekday: number;
  hour: number;
}

const CONTRARIAN_MARKERS = [
  "isn't",
  'is not',
  "doesn't",
  "don't",
  'stop ',
  'nobody ',
  'no one ',
  'wrong',
  'myth',
  'mistake',
  'unpopular',
  'forget ',
  'never ',
];

const STORY_MARKERS = ['i ', "i'", 'we ', 'my ', 'last year', 'last week', 'when i', 'years ago'];

export function countHashtags(content: string): number {
  return (content.match(/(^|\s)#[\w-]+/g) || []).length;
}

export function countEmoji(content: string): number {
  return (content.match(/\p{Extended_Pictographic}/gu) || []).length;
}

export function lengthBucket(charCount: number): LengthBucket {
  if (charCount < 300) return 'short';
  if (charCount <= 800) return 'medium';
  return 'long';
}

export function hashtagBucket(count: number): HashtagBucket {
  if (count === 0) return 'none';
  if (count <= 3) return 'few';
  return 'many';
}

/** Classifies the opening line, which is the part that decides whether a reader stops. */
export function classifyHook(content: string): HookStyle {
  const firstLine = content.trim().split('\n').find((line) => line.trim().length > 0)?.trim() ?? '';
  if (!firstLine) return 'statement';

  const lower = firstLine.toLowerCase();

  if (firstLine.endsWith('?')) return 'question';
  if (/\d/.test(firstLine.slice(0, 60))) return 'number';
  if (CONTRARIAN_MARKERS.some((marker) => lower.includes(marker))) return 'contrarian';
  if (STORY_MARKERS.some((marker) => lower.startsWith(marker))) return 'story';
  return 'statement';
}

export function closesWithQuestion(content: string): boolean {
  const lines = content
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !/^#/.test(line));
  const last = lines[lines.length - 1] ?? '';
  return last.endsWith('?');
}

export function extractTraits(input: {
  content: string;
  publishedAt: Date;
  topic?: string | null;
}): PostTraits {
  const content = input.content;
  const charCount = content.length;
  const hashtagCount = countHashtags(content);

  return {
    topic: input.topic?.trim() || null,
    length: lengthBucket(charCount),
    charCount,
    hook: classifyHook(content),
    hashtagCount,
    hashtags: hashtagBucket(hashtagCount),
    emojiCount: countEmoji(content),
    closesWithQuestion: closesWithQuestion(content),
    paragraphs: content.split(/\n{2,}/).filter((block) => block.trim().length > 0).length,
    weekday: input.publishedAt.getDay(),
    hour: input.publishedAt.getHours(),
  };
}
