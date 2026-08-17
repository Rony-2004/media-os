import { NextRequest, NextResponse } from 'next/server';
import { auth } from './auth';
import { toAuthUser, type BetterAuthUserLike } from './auth-user';

export interface AuthIdentity {
  userId: string;
  email: string;
  role: string;
}

/**
 * Resolve the authenticated Better Auth session for a protected API request.
 */
export async function getAuthUser(req: NextRequest): Promise<AuthIdentity | null> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return null;

  const user = toAuthUser(session.user as BetterAuthUserLike);
  if (!user.isActive || user.isBlocked) return null;

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
    { status: 401 },
  );
}
