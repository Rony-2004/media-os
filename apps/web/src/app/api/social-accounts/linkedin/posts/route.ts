import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-guard';
import { fetchLinkedInPosts } from '@/lib/linkedin/client';

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const account = await prisma.socialAccount.findFirst({
    where: { userId: authUser.userId, provider: 'linkedin', status: 'active' },
  });

  if (!account?.accessToken) {
    return NextResponse.json(
      { error: { code: 'NOT_CONNECTED', message: 'LinkedIn is not connected.' } },
      { status: 404 },
    );
  }

  const result = await fetchLinkedInPosts(
    account.accessToken,
    `urn:li:person:${account.providerUserId}`,
  );

  if (!result.ok) {
    const status =
      result.status === 'token_expired'
        ? 401
        : result.status === 'permission_required'
          ? 403
          : result.status === 'rate_limited'
            ? 429
            : 502;
    return NextResponse.json(
      {
        error: {
          code: `LINKEDIN_${result.status.toUpperCase()}`,
          message: result.message,
        },
      },
      { status },
    );
  }

  return NextResponse.json({ data: { posts: result.data } });
}
