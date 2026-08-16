import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-email',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/refresh',
  '/api/social-accounts/linkedin/callback',
];

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/platform',
  '/ai-settings',
  '/accounts',
  '/quota',
  '/settings',
  '/help',
  '/posts',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (isPublic) return NextResponse.next();

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const accessToken = req.cookies.get('access_token')?.value;
  const refreshToken = req.cookies.get('refresh_token')?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Keep middleware edge-safe: avoid Node-only JWT verification here.
  // Full token verification happens in API routes/server logic.

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)'],
};
