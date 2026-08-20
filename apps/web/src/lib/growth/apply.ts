import type { GrowthInsights, TraitStat } from './analyze';

/**
 * Feeds learned patterns back into generation and scheduling — the step that
 * makes the loop a loop rather than a dashboard.
 *
 * Nothing is emitted unless the analysis is confident, so an account with a
 * thin history keeps the neutral defaults instead of chasing noise.
 */

/** Only surface a pattern that beats the baseline by a real margin. */
const MIN_LIFT = 0.15;

function leader(stats: TraitStat[]): TraitStat | null {
  const top = stats[0];
  if (!top || top.lift < MIN_LIFT) return null;
  return top;
}

function laggard(stats: TraitStat[]): TraitStat | null {
  const bottom = stats[stats.length - 1];
  if (!bottom || stats.length < 2 || bottom.lift > -MIN_LIFT) return null;
  return bottom;
}

/**
 * Prompt fragment describing what has actually worked for this account.
 * Returns '' when there is nothing trustworthy to say.
 */
export function buildGrowthDirectives(insights: GrowthInsights): string {
  if (!insights.confident) return '';

  const lines: string[] = [];

  const topTopic = leader(insights.topics);
  if (topTopic) {
    lines.push(
      `Posts about "${topTopic.value}" earn ${Math.round(topTopic.lift * 100)}% more engagement than this account's average. Prefer that territory when the topic allows.`,
    );
  }

  const topHook = leader(insights.hooks);
  if (topHook) {
    lines.push(`Openings of the "${topHook.value}" style perform best here — open that way.`);
  }

  const weakHook = laggard(insights.hooks);
  if (weakHook && weakHook.value !== topHook?.value) {
    lines.push(`Avoid "${weakHook.value}" openings; they underperform for this account.`);
  }

  const topLength = leader(insights.lengths);
  if (topLength) {
    lines.push(`${topLength.value} posts outperform other lengths here.`);
  }

  const topHashtags = leader(insights.hashtags);
  if (topHashtags) {
    const guidance = { none: 'no hashtags', few: '1-3 hashtags', many: '4 or more hashtags' }[
      topHashtags.value
    ];
    if (guidance) lines.push(`Use ${guidance} — that pattern performs best on this account.`);
  }

  const topClosing = leader(insights.closingQuestion);
  if (topClosing) {
    lines.push(
      topClosing.value === 'ends with a question'
        ? 'Close with a direct question; posts here that do earn more replies.'
        : 'A closing question is not required for this account; it does not lift engagement.',
    );
  }

  if (lines.length === 0) return '';

  return [
    `What has actually worked on this account (measured across ${insights.sampleSize} published posts):`,
    ...lines.map((line) => `- ${line}`),
  ].join('\n');
}

/**
 * Chooses publish times, preferring hours that have measurably performed.
 * Falls back to `fallbackHour` when no hour clears the sample threshold.
 */
export function pickSlots(
  insights: GrowthInsights,
  count: number,
  intervalDays: number,
  options: { fallbackHour?: number; from?: Date } = {},
): Date[] {
  const fallbackHour = options.fallbackHour ?? 9;
  const from = options.from ? new Date(options.from) : new Date();
  const hours = insights.confident && insights.bestHours.length > 0 ? insights.bestHours : [fallbackHour];

  return Array.from({ length: count }, (_, index) => {
    const slot = new Date(from);
    slot.setDate(slot.getDate() + intervalDays * (index + 1));
    slot.setHours(hours[index % hours.length], 0, 0, 0);
    return slot;
  });
}

/** One-line summary for the UI. */
export function summarizeInsights(insights: GrowthInsights): string {
  if (!insights.confident) return insights.reason ?? 'Not enough data yet.';

  const parts: string[] = [];
  const topTopic = leader(insights.topics);
  const topHook = leader(insights.hooks);

  if (topTopic) parts.push(`"${topTopic.value}" is your strongest topic`);
  if (topHook) parts.push(`${topHook.value} openings work best`);
  if (insights.bestHours.length > 0) {
    parts.push(`${insights.bestHours[0]}:00 is your best hour`);
  }

  if (parts.length === 0) {
    return `Across ${insights.sampleSize} posts, no pattern is yet strong enough to act on.`;
  }

  return `${parts.join(' · ')}.`;
}
