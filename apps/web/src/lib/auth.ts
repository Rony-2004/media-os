import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { emailOTP } from 'better-auth/plugins';
import { dash } from '@better-auth/infra';
import { prisma } from '@/lib/db';
import { sendAuthOTPEmail } from '@/lib/email';
import { hashPassword, verifyPassword } from '@/lib/hash';

const baseURL = process.env.BETTER_AUTH_URL || process.env.FRONTEND_URL || 'http://localhost:3000';

export const auth = betterAuth({
  appName: 'ConnectUs',
  baseURL,
  basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET || process.env.COOKIE_SECRET,
  trustedOrigins: [baseURL, 'http://localhost:3000'],
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  user: {
    fields: {
      image: 'avatar',
    },
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'USER',
        input: false,
      },
      plan: {
        type: 'string',
        required: false,
        defaultValue: 'FREE',
        input: false,
      },
      weeklyPostLimit: {
        type: 'number',
        required: false,
        defaultValue: 2,
        input: false,
      },
      isBlocked: {
        type: 'boolean',
        required: false,
        defaultValue: false,
        input: false,
      },
      isActive: {
        type: 'boolean',
        required: false,
        defaultValue: true,
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    minPasswordLength: 8,
    password: {
      hash: hashPassword,
      verify: async ({ password, hash }) => verifyPassword(password, hash),
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      allowedAttempts: 5,
      sendVerificationOnSignUp: true,
      storeOTP: 'hashed',
      sendVerificationOTP: async ({ email, otp, type }) => {
        await sendAuthOTPEmail(email, otp, type);
      },
    }),
    dash({
      apiKey: process.env.BETTER_AUTH_API_KEY,
    }),
  ],
});
