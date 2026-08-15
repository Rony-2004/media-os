import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { linkedinStateStore } from '@/lib/linkedin-store';
import { LINKEDIN_OAUTH_SCOPES } from '@/lib/linkedin/oauth';

const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';

interface LinkedInTokenResponse {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // LinkedIn returned an error
  if (error) {
    console.error('LinkedIn OAuth error:', error, searchParams.get('error_description'));
    return NextResponse.redirect(new URL(`/accounts?error=${error}`, req.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/accounts?error=missing_params', req.url));
  }

  // Validate state and get userId from it (no cookie needed here)
  const stored = linkedinStateStore.get(state);
  if (!stored || stored.expiresAt < Date.now()) {
    linkedinStateStore.delete(state);
    return NextResponse.redirect(new URL('/accounts?error=invalid_state', req.url));
  }

  const userId = stored.userId;
  linkedinStateStore.delete(state);

  try {
    const callbackUrl = process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:3000/api/social-accounts/linkedin/callback';

    // Exchange code for tokens
    const tokenResponse = await fetch(LINKEDIN_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error('LinkedIn token exchange failed:', errText);
      return NextResponse.redirect(new URL('/accounts?error=token_exchange_failed', req.url));
    }

    const tokens = (await tokenResponse.json()) as LinkedInTokenResponse;

    // Fetch LinkedIn profile
    const profileResponse = await fetch(LINKEDIN_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileResponse.ok) {
      console.error('LinkedIn profile fetch failed:', await profileResponse.text());
      return NextResponse.redirect(new URL('/accounts?error=profile_fetch_failed', req.url));
    }

    const profile = await profileResponse.json();

    // Store social account
    await prisma.socialAccount.upsert({
      where: {
        userId_provider_providerUserId: {
          userId,
          provider: 'linkedin',
          providerUserId: profile.sub,
        },
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        expiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
        providerName: profile.name,
        providerAvatar: profile.picture,
        scopes: tokens.scope || LINKEDIN_OAUTH_SCOPES.join(' '),
        status: 'active',
        connectedAt: new Date(),
      },
      create: {
        userId,
        provider: 'linkedin',
        providerUserId: profile.sub,
        providerName: profile.name,
        providerAvatar: profile.picture,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        expiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
        scopes: tokens.scope || LINKEDIN_OAUTH_SCOPES.join(' '),
        status: 'active',
      },
    });

    return NextResponse.redirect(new URL('/accounts?connected=linkedin', req.url));
  } catch (err) {
    console.error('LinkedIn callback error:', err);
    return NextResponse.redirect(new URL('/accounts?error=linkedin_connection_failed', req.url));
  }
}
