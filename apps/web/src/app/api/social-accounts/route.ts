import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-guard';

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const accounts = await prisma.socialAccount.findMany({
    where: { userId: authUser.userId },
    select: {
      id: true,
      provider: true,
      providerUsername: true,
      providerName: true,
      providerAvatar: true,
      status: true,
      connectedAt: true,
      expiresAt: true,
    },
  });

  return NextResponse.json({ data: accounts });
}
