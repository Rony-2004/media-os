import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-guard';
import { sumStoredEngagement } from '@/lib/linkedin/sync';

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  // Compute REAL live counts directly from PostgreSQL via Prisma
  const publishedCount = await prisma.post.count({
    where: { userId: authUser.userId, status: 'published' },
  });

  const scheduledCount = await prisma.post.count({
    where: { userId: authUser.userId, status: 'scheduled' },
  });

  const aiApprovedCount = await prisma.post.count({
    where: { userId: authUser.userId, aiGenerated: true },
  });

  const nextScheduledPost = await prisma.post.findFirst({
    where: { userId: authUser.userId, status: 'scheduled' },
    orderBy: { scheduledAt: 'asc' },
  });

  const totalPostsCount = await prisma.post.count({
    where: { userId: authUser.userId },
  });

  const publishedPosts = await prisma.post.findMany({
    where: { userId: authUser.userId, platform: 'linkedin', status: 'published' },
    select: { metadata: true },
  });
  const engagement = sumStoredEngagement(publishedPosts.map((post) => post.metadata));

  const acceptanceRate = totalPostsCount > 0
    ? Math.min(100, Math.round((aiApprovedCount / Math.max(1, totalPostsCount)) * 100))
    : 0;

  return NextResponse.json({
    data: {
      publishedCount,
      scheduledCount,
      aiApprovedCount,
      acceptanceRate: `${acceptanceRate}% acceptance`,
      totalReactions: engagement.reactions,
      totalComments: engagement.comments,
      engagementSyncedPosts: engagement.syncedPosts,
      nextScheduled: nextScheduledPost?.scheduledAt
        ? `Next: ${new Date(nextScheduledPost.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : 'Next: Queue Empty',
    },
  });
}
