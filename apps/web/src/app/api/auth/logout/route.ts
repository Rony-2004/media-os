import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { clearAuthCookies, REFRESH_TOKEN_COOKIE } from '@/lib/cookies';
import { hashToken } from '@/lib/hash';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    const response = NextResponse.json({ data: { message: 'Logged out successfully' } });
    clearAuthCookies().forEach((c) => response.headers.append('Set-Cookie', c));
    return response;
  } catch {
    const response = NextResponse.json({ data: { message: 'Logged out' } });
    clearAuthCookies().forEach((c) => response.headers.append('Set-Cookie', c));
    return response;
  }
}
