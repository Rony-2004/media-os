import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateSecureToken, hashToken } from '@/lib/hash';
import { sendPasswordResetEmail } from '@/lib/email';
import { z } from 'zod';

const forgotSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = forgotSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid email' } },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Always return success (don't reveal if email exists)
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Generate reset token
      const resetToken = generateSecureToken();
      const tokenHash = hashToken(resetToken);

      // Invalidate existing reset tokens
      await prisma.passwordReset.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      // Store hashed token
      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      // Send email (or print in dev)
      await sendPasswordResetEmail(email, resetToken);
    }

    return NextResponse.json({
      data: { message: 'If an account exists with this email, a reset link has been sent.' },
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
