import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, hashToken, generateSecureToken } from '@/lib/hash';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { setAccessTokenCookie, setRefreshTokenCookie } from '@/lib/cookies';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.error.issues } },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    // Check password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    // Check email verified
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: { code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email first' } },
        { status: 403 }
      );
    }

    // Check active
    if (!user.isActive) {
      return NextResponse.json(
        { error: { code: 'ACCOUNT_DISABLED', message: 'Account is disabled' } },
        { status: 403 }
      );
    }

    // Generate tokens
    const tokenPayload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshTokenRaw = generateSecureToken();

    // Hash refresh token before storing
    const refreshTokenHash = hashToken(refreshTokenRaw);

    // Store hashed refresh token in database
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
        userAgent: req.headers.get('user-agent') || null,
      },
    });

    // Set cookies
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

    response.headers.append('Set-Cookie', setAccessTokenCookie(accessToken));
    response.headers.append('Set-Cookie', setRefreshTokenCookie(refreshTokenRaw));

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
