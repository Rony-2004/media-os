import { prisma } from '@/lib/db';
import { analyzeGrowth, type AnalyzedPost, type GrowthInsights } from './analyze';
import { extractTraits } from './traits';

/**
 * Persistence for the growth engine: capturing engagement over time and
 * replaying it back as analysable history.
 */

/**
 * Records a snapshot, but only when the numbers actually moved.
 *
 * Sync runs roughly every minute while a pipeline is open; writing a row each
 * time would bloat the table without adding information.
 */
export async function recordPostMetric(
  postId: string,
  reactions: number,
  comments: number,
): Promise<boolean> {
  const latest = await prisma.postMetric.findFirst({
    where: { postId },
    orderBy: { capturedAt: 'desc' },
    select: { reactions: true, comments: true },
  });

  if (latest && latest.reactions === reactions && latest.comments === comments) {
    return false;
  }

  await prisma.postMetric.create({ data: { postId, reactions, comments } });
  return true;
}

/** Published posts paired with their most recent verified engagement. */
export async function loadAnalyzedPosts(userId: string): Promise<AnalyzedPost[]> {
  const posts = await prisma.post.findMany({
    where: { userId, status: 'published', publishedAt: { not: null } },
    select: {
      content: true,
      publishedAt: true,
      metadata: true,
      metrics: {
        orderBy: { capturedAt: 'desc' },
        take: 1,
        select: { reactions: true, comments: true },
      },
    },
  });

  const analyzed: AnalyzedPost[] = [];

  for (const post of posts) {
    if (!post.publishedAt) continue;

    const metadata =
      typeof post.metadata === 'object' && post.metadata !== null && !Array.isArray(post.metadata)
        ? (post.metadata as Record<string, unknown>)
        : {};

    // Prefer the time series; fall back to the metadata snapshot so posts that
    // predate metric capture still contribute.
    const latest = post.metrics[0];
    let reactions: number | null = latest?.reactions ?? null;
    let comments: number | null = latest?.comments ?? null;

    if (reactions === null && metadata.hasRealStats === true) {
      reactions = typeof metadata.likes === 'number' ? metadata.likes : null;
      comments = typeof metadata.comments === 'number' ? metadata.comments : null;
    }

    // A post whose engagement was never verified would poison the averages
    // with a fake zero, so it is excluded rather than counted.
    if (reactions === null) continue;

    analyzed.push({
      engagement: reactions + (comments ?? 0),
      traits: extractTraits({
        content: post.content,
        publishedAt: post.publishedAt,
        topic: typeof metadata.category === 'string' ? metadata.category : null,
      }),
    });
  }

  return analyzed;
}

export async function getGrowthInsights(userId: string): Promise<GrowthInsights> {
  return analyzeGrowth(await loadAnalyzedPosts(userId));
}
