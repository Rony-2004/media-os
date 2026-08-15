import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-guard';
import { randomBytes } from 'crypto';
import { linkedinStateStore } from '@/lib/linkedin-store';
import { LINKEDIN_OAUTH_SCOPES } from '@/lib/linkedin/oauth';

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);

  if (!authUser) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const callbackUrl = process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:3000/api/social-accounts/linkedin/callback';

  if (!clientId) {
    return NextResponse.redirect(new URL('/accounts?error=linkedin_not_configured', req.url));
  }

  // Generate CSRF state token
  const state = randomBytes(32).toString('hex');
  linkedinStateStore.set(state, {
    userId: authUser.userId,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: callbackUrl,
    state,
    scope: LINKEDIN_OAUTH_SCOPES.join(' '),
  });

  return NextResponse.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`);
}
