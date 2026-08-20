import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-guard';
import { z } from 'zod';
import {
  canonicalizeLinkedInPostUrn,
  fetchLinkedInPosts,
  fetchLinkedInSocialMetadata,
} from '@/lib/linkedin/client';
import { mergeSuccessfulEngagement, readCachedEngagement } from '@/lib/linkedin/sync';
import { recordPostMetric } from '@/lib/growth/repository';
import { deduplicatePosts, fingerprintPostContent } from '@/lib/post-dedupe';

const createPostSchema = z.object({
  content: z.string().min(1).max(25000),
  platform: z.enum(['linkedin', 'twitter', 'instagram', 'facebook', 'threads']),
  socialAccountId: z.string().optional(),
  status: z.enum(['draft', 'scheduled']).default('draft'),
  scheduledAt: z.string().datetime().optional(),
});

function asMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get('status');
  const platform = searchParams.get('platform');
  const statuses = statusParam
    ? statusParam.split(',')
    : ['draft', 'scheduled', 'published', 'failed', 'cancelled'];

  const posts = await prisma.post.findMany({
    where: {
      userId: authUser.userId,
      status: { in: statuses },
      ...(platform ? { platform } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const account = await prisma.socialAccount.findFirst({
    where: { userId: authUser.userId, provider: 'linkedin', status: 'active' },
  });

  const updatedPosts = await Promise.all(
    posts.map(async (post) => {
      if (post.status !== 'published') return post;

      const metadata = asMetadata(post.metadata);
      const cached = readCachedEngagement(metadata);
      const postUrn = [
        post.platformPostId,
        typeof metadata.linkedInPostId === 'string' ? metadata.linkedInPostId : null,
        post.platformPostUrl,
        typeof metadata.linkedInUrl === 'string' ? metadata.linkedInUrl : null,
      ]
        .map(canonicalizeLinkedInPostUrn)
        .find((value): value is string => Boolean(value));
      const safeMetadata = { ...metadata, ...cached };

      if (!account?.accessToken) {
        return {
          ...post,
          metadata: safeMetadata,
          engagementSync: {
            status: 'not_connected' as const,
            message: 'Connect LinkedIn to sync reactions and comments.',
            cached: cached.hasRealStats,
            syncedAt: cached.lastSyncedAt,
          },
        };
      }

      if (!postUrn) {
        return {
          ...post,
          metadata: safeMetadata,
          engagementSync: {
            status: 'missing_post_urn' as const,
            message: 'This post is missing the LinkedIn URN required for engagement sync.',
            cached: cached.hasRealStats,
            syncedAt: cached.lastSyncedAt,
          },
        };
      }

      const result = await fetchLinkedInSocialMetadata(account.accessToken, postUrn);
      if (!result.ok) {
        return {
          ...post,
          metadata: safeMetadata,
          engagementSync: {
            status: result.status,
            message: result.message,
            cached: cached.hasRealStats,
            syncedAt: cached.lastSyncedAt,
          },
        };
      }

      const syncedAt = new Date().toISOString();
      const syncedMetadata = mergeSuccessfulEngagement(metadata, result.data, syncedAt);
      await prisma.post
        .update({
          where: { id: post.id },
          data: { metadata: syncedMetadata as Prisma.InputJsonValue },
        })
        .catch(() => undefined);

      // Feed the growth engine. Best-effort: a metrics write must never break
      // the post list.
      await recordPostMetric(post.id, result.data.reactions, result.data.comments).catch(
        () => undefined,
      );

      return {
        ...post,
        metadata: syncedMetadata,
        engagementSync: { status: 'ok' as const, cached: false, syncedAt },
      };
    })
  );

  // Older rows may predate content fingerprints. Deduplicate the response as
  // a defensive read path so historical duplicates are not shown twice.
  const deduplicatedPosts = deduplicatePosts(updatedPosts);

  if (
    account?.accessToken &&
    statuses.includes('published') &&
    (!platform || platform === 'linkedin')
  ) {
    const authorUrn = `urn:li:person:${account.providerUserId}`;
    const remotePostsResult = await fetchLinkedInPosts(account.accessToken, authorUrn);

    if (remotePostsResult.ok) {
      const localUrns = new Set(
        deduplicatedPosts
          .flatMap((post) => {
            const metadata = asMetadata(post.metadata);
            const urn = [
              post.platformPostId,
              typeof metadata.linkedInPostId === 'string' ? metadata.linkedInPostId : null,
              post.platformPostUrl,
            ]
              .map(canonicalizeLinkedInPostUrn)
              .find((value): value is string => Boolean(value));
            return urn ? [urn] : [];
          }),
      );

      const remoteOnlyPosts = await Promise.all(
        remotePostsResult.data
          .filter((remotePost) => !localUrns.has(remotePost.urn))
          .map(async (remotePost) => {
            const metadataResult = await fetchLinkedInSocialMetadata(account.accessToken, remotePost.urn);
            const syncedAt = metadataResult.ok ? new Date().toISOString() : null;
            const metadata = metadataResult.ok
              ? mergeSuccessfulEngagement(
                  { linkedInPostId: remotePost.urn, linkedInUrl: remotePost.url },
                  metadataResult.data,
                  syncedAt!,
                )
              : {
                  linkedInPostId: remotePost.urn,
                  linkedInUrl: remotePost.url,
                  ...readCachedEngagement({}),
                };

            return {
              id: `linkedin:${remotePost.urn}`,
              userId: authUser.userId,
              socialAccountId: account.id,
              content: remotePost.commentary,
              platform: 'linkedin',
              status: 'published',
              scheduledAt: null,
              publishedAt: remotePost.publishedAt,
              platformPostId: remotePost.urn,
              platformPostUrl: remotePost.url,
              mediaUrls: [],
              hashtags: [],
              aiGenerated: false,
              aiModel: null,
              aiPrompt: null,
              retryCount: 0,
              errorMessage: null,
              metadata,
              createdAt: remotePost.publishedAt,
              updatedAt: remotePost.publishedAt,
              engagementSync: metadataResult.ok
                ? { status: 'ok' as const, cached: false, syncedAt }
                : {
                    status: metadataResult.status,
                    message: metadataResult.message,
                    cached: false,
                    syncedAt: null,
                  },
            };
          }),
      );

      return NextResponse.json({
        data: deduplicatePosts([...deduplicatedPosts, ...remoteOnlyPosts]).sort((a, b) => {
          const aTime = new Date(a.publishedAt ?? a.createdAt ?? 0).getTime();
          const bTime = new Date(b.publishedAt ?? b.createdAt ?? 0).getTime();
          return bTime - aTime;
        }),
      });
    }
  }

  return NextResponse.json({ data: deduplicatedPosts });
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const body = await req.json();
  const parsed = createPostSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const { content, platform, socialAccountId, status, scheduledAt } = parsed.data;

  const account = await prisma.socialAccount.findFirst({
    where: {
      userId: authUser.userId,
      provider: platform,
      status: 'active',
      ...(socialAccountId ? { id: socialAccountId } : {}),
    },
    select: { id: true },
  });

  if (status === 'scheduled' && !account) {
    return NextResponse.json(
      {
        error: {
          code: 'ACCOUNT_NOT_CONNECTED',
          message: `Connect an active ${platform} account before scheduling this post.`,
        },
      },
      { status: 400 },
    );
  }

  const contentFingerprint = fingerprintPostContent(content);
  const existingPosts = await prisma.post.findMany({
    where: { userId: authUser.userId, platform },
    select: { content: true, contentFingerprint: true },
  });
  const duplicateExists = existingPosts.some(
    (existingPost) =>
      existingPost.contentFingerprint === contentFingerprint ||
      fingerprintPostContent(existingPost.content) === contentFingerprint,
  );

  if (duplicateExists) {
    return NextResponse.json(
      {
        error: {
          code: 'DUPLICATE_POST',
          message: 'A matching post already exists for this platform.',
        },
      },
      { status: 409 },
    );
  }

  try {
    const post = await prisma.post.create({
      data: {
        userId: authUser.userId,
        content,
        contentFingerprint,
        platform,
        socialAccountId: account?.id ?? null,
        status,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    });

    return NextResponse.json({ data: post }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        {
          error: {
            code: 'DUPLICATE_POST',
            message: 'A matching post already exists for this platform.',
          },
        },
        { status: 409 },
      );
    }
    throw error;
  }
}
