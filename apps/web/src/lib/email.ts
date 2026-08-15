import nodemailer from 'nodemailer';

const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';

/**
 * Send an email. In development mode, prints to console instead.
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  // Development mode: print to terminal
  if (IS_DEVELOPMENT) {
    console.log('\n========================================');
    console.log('[DEV EMAIL]');
    console.log(`  To:      ${options.to}`);
    console.log(`  Subject: ${options.subject}`);
    console.log(`  Body:    ${options.text}`);
    console.log('========================================\n');
    return;
  }

  // Production mode: send via Nodemailer
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

/**
 * Send OTP email for email verification.
 */
export async function sendOTPEmail(email: string, otp: string) {
  if (IS_DEVELOPMENT) {
    console.log(`\n[DEV] OTP for ${email}: ${otp}\n`);
  }

  await sendEmail({
    to: email,
    subject: 'Verify your email - AI Social OS',
    text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
    html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
  });
}

/**
 * Send password reset email.
 */
export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  if (IS_DEVELOPMENT) {
    console.log(`\n[DEV] Password reset for ${email}: ${resetUrl}\n`);
  }

  await sendEmail({
    to: email,
    subject: 'Reset your password - AI Social OS',
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
    html: `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p>`,
  });
}
