import { Resend } from 'resend';

export type AuthOTPType = 'sign-in' | 'email-verification' | 'forget-password' | 'change-email';

const subjectByType: Record<AuthOTPType, string> = {
  'sign-in': 'Your sign-in code - AI Social OS',
  'email-verification': 'Verify your email - AI Social OS',
  'forget-password': 'Reset your password - AI Social OS',
  'change-email': 'Confirm your email change - AI Social OS',
};

export async function sendAuthOTPEmail(email: string, otp: string, type: AuthOTPType) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    throw new Error('RESEND_API_KEY and RESEND_FROM must be configured to send OTP emails');
  }

  const { error } = await new Resend(apiKey).emails.send({
    from,
    to: email,
    subject: subjectByType[type],
    text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
    html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
  });

  if (error) {
    throw new Error(error.message || 'Resend could not send the OTP email');
  }
}
