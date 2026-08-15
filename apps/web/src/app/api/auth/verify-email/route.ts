import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashOTP } from '@/lib/hash';
import { z } from 'zod';

const verifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.error.issues } },
        { status: 400 }
      );
    }

    const { email, otp } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Invalid email or OTP' } },
        { status: 400 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Email already verified' } },
        { status: 400 }
      );
    }

    // Find latest non-verified OTP for this user
    const verification = await prisma.emailVerification.findFirst({
      where: {
        userId: user.id,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return NextResponse.json(
        { error: { code: 'EXPIRED', message: 'OTP expired. Please request a new one.' } },
        { status: 400 }
      );
    }

    // Check attempts (max 5)
    if (verification.attempts >= 5) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMIT', message: 'Too many attempts. Please request a new OTP.' } },
        { status: 429 }
      );
    }

    // Verify OTP
    const otpHash = hashOTP(otp);
    if (otpHash !== verification.otp) {
      // Increment attempts
      await prisma.emailVerification.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      });

      return NextResponse.json(
        { error: { code: 'INVALID_OTP', message: 'Invalid OTP' } },
        { status: 400 }
      );
    }

    // Mark as verified
    await prisma.$transaction([
      prisma.emailVerification.update({
        where: { id: verification.id },
        data: { verified: true },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      }),
    ]);

    return NextResponse.json({ data: { message: 'Email verified successfully' } });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
