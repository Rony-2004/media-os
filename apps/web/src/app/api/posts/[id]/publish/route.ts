import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-guard';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const { id } = await params;
  const post = await prisma.post.findFirst({ where: { id, userId: authUser.userId } });
  if (!post) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Post not found' } }, { status: 404 });
  }

  // 1. Fetch user's active LinkedIn account
  const account = await prisma.socialAccount.findFirst({
    where: { userId: authUser.userId, provider: 'linkedin', status: 'active' },
  });

  if (!account || !account.accessToken) {
    return NextResponse.json(
      {
        error: {
          code: 'ACCOUNT_NOT_CONNECTED',
          message: 'No active LinkedIn account connected. Please connect LinkedIn from the Accounts page first.',
        },
      },
      { status: 400 }
    );
  }

  let linkedInPostId: string | null = null;
  let linkedInUrl: string | null = null;

  try {
    // Step A: Get profile sub / author Urn
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${account.accessToken}` },
    });

    if (!profileRes.ok) {
      return NextResponse.json(
        {
          error: {
            code: 'LINKEDIN_AUTH_EXPIRED',
            message: 'LinkedIn token expired or unauthorized. Please reconnect your account in Accounts.',
          },
        },
        { status: 401 }
      );
    }

    const profile = await profileRes.json();
    const authorUrn = `urn:li:person:${profile.sub}`;

    // Step B: Post to LinkedIn ugcPosts API
    const postBody = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: post.content,
          },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postBody),
    });

    if (postRes.ok) {
      const resData = await postRes.json().catch(() => ({}));
      linkedInPostId = resData.id || postRes.headers.get('x-restli-id');
      if (linkedInPostId) {
        linkedInUrl = `https://www.linkedin.com/feed/update/${linkedInPostId}`;
      }
    } else {
      const errText = await postRes.text();
      console.warn('[LinkedIn API Post Error]:', postRes.status, errText);

      return NextResponse.json(
        {
          error: {
            code: 'LINKEDIN_PUBLISH_FAILED',
            message: `LinkedIn API Error (${postRes.status}): ${errText}`,
          },
        },
        { status: 400 }
      );
    }
  } catch (e: any) {
    console.error('[LinkedIn Publishing Exception]:', e);
    return NextResponse.json(
      { error: { code: 'LINKEDIN_ERROR', message: e.message } },
      { status: 500 }
    );
  }

  // 2. Update post in PostgreSQL DB upon verified LinkedIn publication
  const updated = await prisma.post.update({
    where: { id },
    data: {
      status: 'published',
      publishedAt: new Date(),
      platformPostId: linkedInPostId,
      platformPostUrl: linkedInUrl,
      metadata: {
        ...(typeof post.metadata === 'object' && post.metadata !== null ? (post.metadata as object) : {}),
        linkedInPostId,
        linkedInUrl,
        likes: 0,
        comments: 0,
        views: 0,
        hasRealStats: false,
      },
    },
  });

  return NextResponse.json({ data: updated });
}
