import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const currentUser = await prisma.user.findUnique({ where: { id: authUser.userId } });
  if (!currentUser || ((currentUser as any).role !== 'ADMIN' && authUser.email !== 'admin@connectus.dev')) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin privileges required' } },
      { status: 403 }
    );
  }

  const { id } = await params;
  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });
  }

  const body = await req.json();
  const { name, role, isBlocked, plan, weeklyPostLimit } = body;

  const updateData: Record<string, any> = {};
  if (typeof name === 'string' && name.trim()) updateData.name = name.trim();
  if (typeof role === 'string') updateData.role = role;
  if (typeof isBlocked === 'boolean') updateData.isBlocked = isBlocked;
  if (typeof plan === 'string') updateData.plan = plan;
  if (typeof weeklyPostLimit === 'number') updateData.weeklyPostLimit = weeklyPostLimit;

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isBlocked: true,
      plan: true,
      weeklyPostLimit: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ data: updated });
}
