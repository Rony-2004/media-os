import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain password with a bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Hash a refresh token using SHA-256 + salt for secure storage.
 * We don't use bcrypt for tokens because we need fast lookups.
 */
export function hashToken(token: string): string {
  const salt = process.env.COOKIE_SECRET || 'dev-salt';
  return createHash('sha256').update(`${token}:${salt}`).digest('hex');
}

/**
 * Generate a cryptographically secure random token.
 */
export function generateSecureToken(): string {
  return randomBytes(48).toString('hex');
}

/**
 * Generate a 6-digit OTP.
 */
export function generateOTP(): string {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

/**
 * Hash an OTP for storage (SHA-256 so we can compare later).
 */
export function hashOTP(otp: string): string {
  const salt = process.env.COOKIE_SECRET || 'dev-salt';
  return createHash('sha256').update(`${otp}:${salt}`).digest('hex');
}
