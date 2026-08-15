import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, verifyRefreshToken, generateAccessToken, TokenPayload } from './jwt';
import { hashToken, generateSecureToken } from './hash';
import { setAccessTokenCookie, setRefreshTokenCookie } from './cookies';
import { prisma } from './db';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

/**
 * Get authenticated user from request cookies.
 * Uses Next.js native req.cookies for reliable cookie parsing.
 * Returns null if not authenticated.
 */
export function getAuthUser(req: NextRequest): TokenPayload | null {
  // Use Next.js native cookie API (more reliable than parsing Cookie header)
  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) return null;
  return verifyAccessToken(accessToken);
}

/**
 * Attempt to refresh expired access token using refresh token cookie.
 * Returns new token payload + Set-Cookie headers, or null if refresh fails.
 */
export async function tryRefreshAuth(req: NextRequest): Promise<{
  user: TokenPayload;
  accessCookie: string;
  refreshCookie: string;
} | null> {
  const refreshTokenRaw = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshTokenRaw) return null;

  // Verify JWT signature on refresh token
  const payload = verifyRefreshToken(refreshTokenRaw);
  if (!payload) return null;

  // Verify token exists in DB and is not revoked
  const tokenHash = hashToken(refreshTokenRaw);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    // Reuse attack: revoke all tokens for this user
    if (stored?.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return null;
  }

  // Rotate: revoke old token
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  // Issue new tokens
  const newPayload: TokenPayload = { userId: stored.user.id, email: stored.user.email };
  const newAccessToken = generateAccessToken(newPayload);
  const newRefreshTokenRaw = generateSecureToken();
  const newRefreshTokenHash = hashToken(newRefreshTokenRaw);

  await prisma.refreshToken.create({
    data: {
      userId: stored.user.id,
      tokenHash: newRefreshTokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ipAddress: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
    },
  });

  return {
    user: newPayload,
    accessCookie: setAccessTokenCookie(newAccessToken),
    refreshCookie: setRefreshTokenCookie(newRefreshTokenRaw),
  };
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
    { status: 401 }
  );
}
