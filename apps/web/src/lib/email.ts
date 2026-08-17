import nodemailer from 'nodemailer';

const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';

export async function sendEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  if (IS_DEVELOPMENT) {
    console.log('\n========================================');
    console.log('[DEV EMAIL]');
    console.log(`  To:      ${options.to}`);
    console.log(`  Subject: ${options.subject}`);
    console.log(`  Body:    ${options.text}`);
    console.log('========================================\n');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@connectus.dev',
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

export type AuthOTPType = 'sign-in' | 'email-verification' | 'forget-password' | 'change-email';

export async function sendAuthOTPEmail(email: string, otp: string, type: AuthOTPType) {
  const subjectByType: Record<AuthOTPType, string> = {
    'sign-in': 'Your sign-in code - AI Social OS',
    'email-verification': 'Verify your email - AI Social OS',
    'forget-password': 'Reset your password - AI Social OS',
    'change-email': 'Confirm your email change - AI Social OS',
  };

  if (IS_DEVELOPMENT) {
    console.log(`\n[DEV] ${type} OTP for ${email}: ${otp}\n`);
  }

  await sendEmail({
    to: email,
    subject: subjectByType[type],
    text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
    html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
  });
}
