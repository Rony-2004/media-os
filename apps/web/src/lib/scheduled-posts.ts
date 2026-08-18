import { prisma } from '@/lib/db';
import type {
  DuePost,
  PublishOutcome,
  ScheduledPostRepository,
} from '@/lib/scheduler';
import { getLinkedInPostImage } from '@/lib/linkedin/publish';

/**
 * Prisma-backed repository for the scheduler.
 *
 * `claim` uses a conditional update so two overlapping cron runs cannot both
 * take the same post: whoever flips `scheduled` -> `publishing` first wins.
 */
export function createScheduledPostRepository(now: () => Date = () => new Date()): ScheduledPostRepository {
  return {
    async findDuePosts(): Promise<DuePost[]> {
      const posts = await prisma.post.findMany({
        where: {
          status: 'scheduled',
          scheduledAt: { lte: now() },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 25,
        select: {
          id: true,
          content: true,
          mediaUrls: true,
          metadata: true,
          retryCount: true,
          socialAccount: { select: { accessToken: true, status: true } },
        },
      });

      return posts.map((post) => ({
        id: post.id,
        content: post.content,
        retryCount: post.retryCount,
        accessToken:
          post.socialAccount && post.socialAccount.status === 'active'
            ? post.socialAccount.accessToken
            : null,
        image: getLinkedInPostImage(post),
      }));
    },

    async claim(id: string): Promise<boolean> {
      const result = await prisma.post.updateMany({
        where: { id, status: 'scheduled' },
        data: { status: 'publishing' },
      });
      return result.count === 1;
    },

    async markPublished(id: string, outcome: PublishOutcome): Promise<void> {
      const existing = await prisma.post.findUnique({ where: { id }, select: { metadata: true } });

      await prisma.post.update({
        where: { id },
        data: {
          status: 'published',
          publishedAt: now(),
          errorMessage: null,
          platformPostId: outcome.platformPostId,
          platformPostUrl: outcome.platformPostUrl,
          metadata: {
            ...(typeof existing?.metadata === 'object' && existing.metadata !== null
              ? (existing.metadata as object)
              : {}),
            linkedInPostId: outcome.platformPostId,
            linkedInUrl: outcome.platformPostUrl,
          },
        },
      });
    },

    async markRetry(id: string, message: string): Promise<void> {
      // Back to `scheduled` so the next run picks it up again.
      await prisma.post.update({
        where: { id },
        data: {
          status: 'scheduled',
          retryCount: { increment: 1 },
          errorMessage: message,
        },
      });
    },

    async markFailed(id: string, message: string): Promise<void> {
      await prisma.post.update({
        where: { id },
        data: { status: 'failed', errorMessage: message },
      });
    },
  };
}
