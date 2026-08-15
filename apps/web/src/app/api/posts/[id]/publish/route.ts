import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-guard';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const { id } = await params;
  const post = await prisma.post.findFirst({ where: { id, userId: authUser.userId } });
  if (!post) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Post not found' } }, { status: 404 });
  }

  const updated = await prisma.post.update({
    where: { id },
    data: {
      status: 'published',
      publishedAt: new Date(),
    },
  });

  return NextResponse.json({ data: updated });
}
