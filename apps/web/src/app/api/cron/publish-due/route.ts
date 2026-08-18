import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getLinkedInPostImage, publishLinkedInPost } from '@/lib/linkedin/publish';
import {
  processDuePosts,
  PublishError,
  type DuePost,
  type PublishOutcome,
  type ScheduledPostRepository,
} from '@/lib/scheduler';

export const runtime = 'nodejs';

const MAX_POSTS_PER_RUN = 50;

function unauthorizedCronResponse(message: string, status: number) {
  return NextResponse.json({ error: { code: 'CRON_UNAUTHORIZED', message } }, { status });
}

function createRepository(): ScheduledPostRepository {
  return {
    async findDuePosts(now = new Date()): Promise<DuePost[]> {
      const posts = await prisma.post.findMany({
        where: {
          status: 'scheduled',
          platform: 'linkedin',
          scheduledAt: { not: null, lte: now },
        },
        orderBy: { scheduledAt: 'asc' },
        take: MAX_POSTS_PER_RUN,
        select: {
          id: true,
          content: true,
          mediaUrls: true,
          metadata: true,
          retryCount: true,
          socialAccount: {
            select: { provider: true, status: true, accessToken: true },
          },
        },
      });

      return posts.map((post) => ({
        id: post.id,
        content: post.content,
        retryCount: post.retryCount,
        accessToken:
          post.socialAccount?.provider === 'linkedin' && post.socialAccount.status === 'active'
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

    async markPublished(id: string, result: PublishOutcome): Promise<void> {
      await prisma.post.updateMany({
        where: { id, status: 'publishing' },
        data: {
          status: 'published',
          publishedAt: new Date(),
          platformPostId: result.platformPostId,
          platformPostUrl: result.platformPostUrl,
          errorMessage: null,
        },
      });
    },

    async markRetry(id: string, message: string): Promise<void> {
      await prisma.post.updateMany({
        where: { id, status: 'publishing' },
        data: {
          status: 'scheduled',
          retryCount: { increment: 1 },
          errorMessage: message.slice(0, 1000),
        },
      });
    },

    async markFailed(id: string, message: string): Promise<void> {
      await prisma.post.updateMany({
        where: { id, status: 'publishing' },
        data: { status: 'failed', errorMessage: message.slice(0, 1000) },
      });
    },
  };
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return unauthorizedCronResponse('CRON_SECRET is not configured.', 503);

  const authorization = request.headers.get('authorization');
  if (authorization !== `Bearer ${cronSecret}`) {
    return unauthorizedCronResponse('Invalid cron authorization.', 401);
  }

  const summary = await processDuePosts(createRepository(), {
    publish: async (post) => {
      if (!post.accessToken) {
        throw new PublishError('LinkedIn account is not connected or active.', false);
      }
      return publishLinkedInPost(post.accessToken, post.content, { image: post.image });
    },
  });

  return NextResponse.json({ data: summary });
}
