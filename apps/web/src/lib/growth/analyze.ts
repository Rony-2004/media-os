import type { PostTraits } from './traits';

/**
 * Correlates post traits against verified engagement.
 *
 * Two rules govern everything here:
 *  1. Never report a pattern below the sample thresholds. A single lucky post
 *     is not a strategy, and acting on one would actively harm the account.
 *  2. Engagement is `reactions + comments`. LinkedIn does not expose
 *     impressions to this app, so true reach cannot be measured — this is an
 *     explicit proxy, and it is named as one wherever it surfaces.
 */

export const MIN_POSTS_FOR_INSIGHTS = 5;
export const MIN_SAMPLES_PER_TRAIT = 3;
export const MIN_SAMPLES_PER_SLOT = 2;
/** An hour must beat the account baseline by this much to be called "best". */
export const MIN_HOUR_LIFT = 0.15;

export interface AnalyzedPost {
  traits: PostTraits;
  /** reactions + comments */
  engagement: number;
}

export interface TraitStat {
  value: string;
  samples: number;
  average: number;
  /** Fractional difference from the baseline; +0.4 means 40% above average. */
  lift: number;
}

export interface SlotStat {
  weekday: number;
  hour: number;
  samples: number;
  average: number;
}

export interface GrowthInsights {
  sampleSize: number;
  baseline: number | null;
  confident: boolean;
  /** Present when insights are withheld, explaining exactly what is missing. */
  reason: string | null;
  topics: TraitStat[];
  lengths: TraitStat[];
  hooks: TraitStat[];
  hashtags: TraitStat[];
  closingQuestion: TraitStat[];
  slots: SlotStat[];
  bestHours: number[];
}

const EMPTY: Omit<GrowthInsights, 'sampleSize' | 'reason'> = {
  baseline: null,
  confident: false,
  topics: [],
  lengths: [],
  hooks: [],
  hashtags: [],
  closingQuestion: [],
  slots: [],
  bestHours: [],
};

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function groupBy(
  posts: AnalyzedPost[],
  key: (traits: PostTraits) => string | null,
  baseline: number,
  minSamples: number,
): TraitStat[] {
  const buckets = new Map<string, number[]>();

  for (const post of posts) {
    const value = key(post.traits);
    if (value === null) continue;
    const bucket = buckets.get(value);
    if (bucket) bucket.push(post.engagement);
    else buckets.set(value, [post.engagement]);
  }

  return [...buckets.entries()]
    .filter(([, values]) => values.length >= minSamples)
    .map(([value, values]) => {
      const average = mean(values);
      return {
        value,
        samples: values.length,
        average: Math.round(average * 10) / 10,
        lift: baseline > 0 ? Math.round(((average - baseline) / baseline) * 100) / 100 : 0,
      };
    })
    .sort((a, b) => b.average - a.average);
}

export function analyzeGrowth(posts: AnalyzedPost[]): GrowthInsights {
  if (posts.length < MIN_POSTS_FOR_INSIGHTS) {
    return {
      ...EMPTY,
      sampleSize: posts.length,
      reason: `Needs ${MIN_POSTS_FOR_INSIGHTS} published posts with verified engagement to find patterns; ${posts.length} available so far.`,
    };
  }

  const baseline = mean(posts.map((post) => post.engagement));

  const slotBuckets = new Map<string, { weekday: number; hour: number; values: number[] }>();
  for (const post of posts) {
    const { weekday, hour } = post.traits;
    const key = `${weekday}-${hour}`;
    const bucket = slotBuckets.get(key);
    if (bucket) bucket.values.push(post.engagement);
    else slotBuckets.set(key, { weekday, hour, values: [post.engagement] });
  }

  const slots = [...slotBuckets.values()]
    .filter((bucket) => bucket.values.length >= MIN_SAMPLES_PER_SLOT)
    .map((bucket) => ({
      weekday: bucket.weekday,
      hour: bucket.hour,
      samples: bucket.values.length,
      average: Math.round(mean(bucket.values) * 10) / 10,
    }))
    .sort((a, b) => b.average - a.average);

  const hourBuckets = new Map<number, number[]>();
  for (const post of posts) {
    const bucket = hourBuckets.get(post.traits.hour);
    if (bucket) bucket.push(post.engagement);
    else hourBuckets.set(post.traits.hour, [post.engagement]);
  }

  const qualifiedHours = [...hourBuckets.entries()]
    .filter(([, values]) => values.length >= MIN_SAMPLES_PER_SLOT)
    .map(([hour, values]) => ({ hour, average: mean(values) }))
    .sort((a, b) => b.average - a.average);

  // An hour is only "best" if there is something to be better *than*, and if it
  // clears the baseline by a real margin. Without both guards a flat account —
  // every post equal, all at one hour — would report that hour as a winner.
  const bestHours =
    qualifiedHours.length >= 2
      ? qualifiedHours
          .filter((entry) => baseline > 0 && entry.average >= baseline * (1 + MIN_HOUR_LIFT))
          .slice(0, 3)
          .map((entry) => entry.hour)
      : [];

  return {
    sampleSize: posts.length,
    baseline: Math.round(baseline * 10) / 10,
    confident: true,
    reason: null,
    topics: groupBy(posts, (t) => t.topic, baseline, MIN_SAMPLES_PER_TRAIT),
    lengths: groupBy(posts, (t) => t.length, baseline, MIN_SAMPLES_PER_TRAIT),
    hooks: groupBy(posts, (t) => t.hook, baseline, MIN_SAMPLES_PER_TRAIT),
    hashtags: groupBy(posts, (t) => t.hashtags, baseline, MIN_SAMPLES_PER_TRAIT),
    closingQuestion: groupBy(
      posts,
      (t) => (t.closesWithQuestion ? 'ends with a question' : 'no closing question'),
      baseline,
      MIN_SAMPLES_PER_TRAIT,
    ),
    slots,
    bestHours,
  };
}
