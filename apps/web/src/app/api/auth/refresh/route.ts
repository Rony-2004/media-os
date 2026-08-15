import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashToken, generateSecureToken } from '@/lib/hash';
import { generateAccessToken } from '@/lib/jwt';
import { getCookie, REFRESH_TOKEN_COOKIE, setAccessTokenCookie, setRefreshTokenCookie } from '@/lib/cookies';

export async function POST(req: NextRequest) {
  try {
    const refreshTokenRaw = getCookie(req, REFRESH_TOKEN_COOKIE);

    if (!refreshTokenRaw) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'No refresh token' } },
        { status: 401 }
      );
    }

    // Hash the incoming token to compare with stored hash
    const tokenHash = hashToken(refreshTokenRaw);

    // Find the token in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      // Token not found, revoked, or expired
      // If token was found but revoked, this might be a token reuse attack
      // Revoke all tokens for this user as a safety measure
      if (storedToken && storedToken.revokedAt) {
        await prisma.refreshToken.updateMany({
          where: { userId: storedToken.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired refresh token' } },
        { status: 401 }
      );
    }

    const user = storedToken.user;

    // Rotate: revoke old token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const tokenPayload = { userId: user.id, email: user.email };
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshTokenRaw = generateSecureToken();
    const newRefreshTokenHash = hashToken(newRefreshTokenRaw);

    // Store new hashed refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: newRefreshTokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
        userAgent: req.headers.get('user-agent') || null,
      },
    });

    // Set new cookies
    const response = NextResponse.json({
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
      },
    });

    response.headers.append('Set-Cookie', setAccessTokenCookie(newAccessToken));
    response.headers.append('Set-Cookie', setRefreshTokenCookie(newRefreshTokenRaw));

    return response;
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
