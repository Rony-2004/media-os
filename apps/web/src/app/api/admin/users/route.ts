import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  // Check admin role or superuser
  const currentUser = await prisma.user.findUnique({ where: { id: authUser.userId } });
  if (!currentUser || ((currentUser as any).role !== 'ADMIN' && authUser.email !== 'admin@connectus.dev')) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin privileges required' } },
      { status: 403 }
    );
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      isBlocked: true,
      plan: true,
      weeklyPostLimit: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: { posts: true, socialAccounts: true },
      },
    },
  });

  return NextResponse.json({ data: users });
}
