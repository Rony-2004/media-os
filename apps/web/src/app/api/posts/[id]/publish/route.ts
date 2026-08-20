import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-guard';
import { getLinkedInPostImage, publishLinkedInPost } from '@/lib/linkedin/publish';
import { PublishError } from '@/lib/scheduler';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const { id } = await params;
  const post = await prisma.post.findFirst({ where: { id, userId: authUser.userId } });
  if (!post) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Post not found' } },
      { status: 404 },
    );
  }

  if (post.status === 'published') {
    return NextResponse.json(
      { error: { code: 'ALREADY_PUBLISHED', message: 'This post has already been published.' } },
      { status: 409 },
    );
  }

  const account = await prisma.socialAccount.findFirst({
    where: { userId: authUser.userId, provider: 'linkedin', status: 'active' },
  });

  if (!account || !account.accessToken) {
    return NextResponse.json(
      {
        error: {
          code: 'ACCOUNT_NOT_CONNECTED',
          message:
            'No active LinkedIn account connected. Connect LinkedIn from the Accounts page first.',
        },
      },
      { status: 400 },
    );
  }

  // Fail fast when the stored grant predates the publishing scope, rather than
  // spending a round trip to be told 403.
  const grantedScopes = account.scopes?.split(/[\s,]+/).filter(Boolean) ?? [];
  if (grantedScopes.length > 0 && !grantedScopes.includes('w_member_social')) {
    return NextResponse.json(
      {
        error: {
          code: 'MISSING_PUBLISH_SCOPE',
          message:
            'This LinkedIn connection was authorized without the w_member_social permission, so it cannot post. Reconnect the account from the Accounts page to grant it.',
        },
      },
      { status: 403 },
    );
  }

  const previousStatus = post.status;
  const claim = await prisma.post.updateMany({
    where: {
      id,
      userId: authUser.userId,
      status: { in: ['draft', 'scheduled', 'failed'] },
    },
    data: { status: 'publishing' },
  });

  if (claim.count !== 1) {
    return NextResponse.json(
      {
        error: {
          code: 'PUBLISH_IN_PROGRESS',
          message: 'This post is already being published or is no longer publishable.',
        },
      },
      { status: 409 },
    );
  }

  try {
    const outcome = await publishLinkedInPost(account.accessToken, post.content, {
      image: getLinkedInPostImage(post),
    });

    const updated = await prisma.post.update({
      where: { id },
      data: {
        status: 'published',
        publishedAt: new Date(),
        errorMessage: null,
        platformPostId: outcome.platformPostId,
        platformPostUrl: outcome.platformPostUrl,
        metadata: {
          ...(typeof post.metadata === 'object' && post.metadata !== null
            ? (post.metadata as object)
            : {}),
          linkedInPostId: outcome.platformPostId,
          linkedInUrl: outcome.platformPostUrl,
        },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'The post could not be published to LinkedIn.';
    console.warn('[LinkedIn Publish]', message);

    await prisma.post.update({
      where: { id },
      data: { status: previousStatus, errorMessage: message },
    });

    return NextResponse.json(
      {
        error: {
          code: 'LINKEDIN_PUBLISH_FAILED',
          message,
          details: { retryable: error instanceof PublishError ? error.retryable : true },
        },
      },
      { status: 502 },
    );
  }
}
