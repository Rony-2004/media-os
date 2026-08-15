import { serialize } from 'cookie';
import { NextRequest } from 'next/server';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

/**
 * Set-Cookie header for access token (short-lived, 15 minutes).
 */
export function setAccessTokenCookie(token: string): string {
  return serialize(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 15, // 15 minutes
  });
}

/**
 * Set-Cookie header for refresh token (long-lived, 30 days).
 */
export function setRefreshTokenCookie(token: string): string {
  return serialize(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/**
 * Clear both auth cookies (used on logout).
 */
export function clearAuthCookies(): string[] {
  return [
    serialize(ACCESS_TOKEN_COOKIE, '', {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    }),
    serialize(REFRESH_TOKEN_COOKIE, '', {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    }),
  ];
}

/**
 * Get a cookie value from a NextRequest using Next.js native API.
 */
export function getCookie(req: NextRequest, name: string): string | undefined {
  return req.cookies.get(name)?.value;
}
