import { sendEmail } from '@better-auth/infra';

export type AuthOTPType = 'sign-in' | 'email-verification' | 'forget-password' | 'change-email';

const otpVariables = (email: string, otp: string) => ({
  otpCode: otp,
  userEmail: email,
  appName: 'AI Social OS',
  expirationMinutes: '10',
});

export async function sendAuthOTPEmail(email: string, otp: string, type: AuthOTPType) {
  const variables = otpVariables(email, otp);

  let result;
  switch (type) {
    case 'sign-in':
      result = await sendEmail({ template: 'sign-in-otp', to: email, variables });
      break;
    case 'email-verification':
    case 'change-email':
      result = await sendEmail({ template: 'verify-email-otp', to: email, variables });
      break;
    case 'forget-password':
      result = await sendEmail({ template: 'reset-password-otp', to: email, variables });
      break;
  }

  if (!result.success) {
    throw new Error(result.error || 'Better Auth Infrastructure could not send the OTP email');
  }
}
