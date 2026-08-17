import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-guard';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const { id } = await params;

  const account = await prisma.socialAccount.findFirst({
    where: { id, userId: authUser.userId },
  });

  if (!account) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Account not found' } },
      { status: 404 }
    );
  }

  await prisma.socialAccount.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
