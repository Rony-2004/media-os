import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, tryRefreshAuth, unauthorizedResponse } from '@/lib/auth-guard';

export async function GET(req: NextRequest) {
  // 1. Try access token first
  let authUser = getAuthUser(req);
  let refreshedCookies: { accessCookie: string; refreshCookie: string } | null = null;

  // 2. If access token expired/missing, try refresh token
  if (!authUser) {
    const refreshed = await tryRefreshAuth(req);
    if (!refreshed) return unauthorizedResponse();
    authUser = refreshed.user;
    refreshedCookies = {
      accessCookie: refreshed.accessCookie,
      refreshCookie: refreshed.refreshCookie,
    };
  }

  // 3. Fetch user from DB
  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) return unauthorizedResponse();

  // 4. Build response — attach new cookies if we refreshed
  const response = NextResponse.json({ data: { user } });

  if (refreshedCookies) {
    response.headers.append('Set-Cookie', refreshedCookies.accessCookie);
    response.headers.append('Set-Cookie', refreshedCookies.refreshCookie);
  }

  return response;
}
