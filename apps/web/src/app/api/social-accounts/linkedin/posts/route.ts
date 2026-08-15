import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-guard';

const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const account = await prisma.socialAccount.findFirst({
    where: { userId: authUser.userId, provider: 'linkedin', status: 'active' },
  });

  if (!account) {
    return NextResponse.json(
      { error: { code: 'NOT_CONNECTED', message: 'LinkedIn not connected' } },
      { status: 404 }
    );
  }

  try {
    // Get the member URN first
    const profileRes = await fetch(LINKEDIN_USERINFO_URL, {
      headers: { Authorization: `Bearer ${account.accessToken}` },
    });

    if (!profileRes.ok) {
      return NextResponse.json({ data: { posts: [], error: 'token_expired' } });
    }

    const profile = await profileRes.json();
    const authorUrn = encodeURIComponent(`urn:li:person:${profile.sub}`);

    // Try the newer /rest/posts endpoint — works with w_member_social scope
    const postsRes = await fetch(
      `https://api.linkedin.com/rest/posts?q=author&author=${authorUrn}&count=20&sortBy=LAST_MODIFIED`,
      {
        headers: {
          Authorization: `Bearer ${account.accessToken}`,
          'LinkedIn-Version': '202501',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    if (!postsRes.ok) {
      const errBody = await postsRes.text();
      console.error('LinkedIn /rest/posts error:', postsRes.status, errBody);

      // Try legacy ugcPosts as fallback
      const legacyRes = await fetch(
        `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(${authorUrn})&count=20`,
        {
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      if (!legacyRes.ok) {
        return NextResponse.json({ data: { posts: [], error: 'linkedin_api_limited' } });
      }

      const legacyData = await legacyRes.json();
      const posts = (legacyData.elements || []).map((el: any) => ({
        id: el.id,
        content:
          el.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || '',
        createdAt: el.created?.time ? new Date(el.created.time).toISOString() : null,
        url: `https://www.linkedin.com/feed/update/${el.id}`,
      }));

      return NextResponse.json({ data: { posts } });
    }

    const data = await postsRes.json();
    const posts = (data.elements || []).map((el: any) => ({
      id: el.id,
      content: el.commentary || '',
      createdAt: el.publishedAt ? new Date(el.publishedAt).toISOString() : null,
      url: `https://www.linkedin.com/feed/update/${el.id}`,
    }));

    return NextResponse.json({ data: { posts } });
  } catch (error) {
    console.error('LinkedIn posts fetch error:', error);
    return NextResponse.json({ data: { posts: [], error: 'fetch_failed' } });
  }
}
