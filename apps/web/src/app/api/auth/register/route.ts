import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/hash';
import { generateOTP, hashOTP } from '@/lib/hash';
import { sendOTPEmail } from '@/lib/email';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.error.issues } },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data;

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'An account with this email already exists' } },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });

    // Generate OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);

    // Store OTP (expires in 10 minutes)
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        otp: otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // Send OTP
    await sendOTPEmail(email, otp);

    // Build response
    const responseData: any = {
      message: 'Account created. Please verify your email.',
      userId: user.id,
    };

    // Development mode: include OTP in response
    if (process.env.NODE_ENV !== 'production') {
      responseData.otp = otp;
    }

    return NextResponse.json({ data: responseData }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
