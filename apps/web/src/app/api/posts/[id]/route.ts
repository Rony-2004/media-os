import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-guard';
import { parsePostUpdate } from '@/lib/post-workspace';
import { z } from 'zod';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const { id } = await params;
  const post = await prisma.post.findFirst({ where: { id, userId: authUser.userId } });
  if (!post) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Post not found' } }, { status: 404 });

  return NextResponse.json({ data: post });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const { id } = await params;
  const post = await prisma.post.findFirst({ where: { id, userId: authUser.userId } });
  if (!post) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Post not found' } }, { status: 404 });

  try {
    const data = parsePostUpdate(await req.json());
    const updated = await prisma.post.update({
      where: { id },
      data: {
        ...data,
        scheduledAt:
          data.scheduledAt === undefined
            ? undefined
            : data.scheduledAt === null
              ? null
              : new Date(data.scheduledAt),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid post update.',
            details: error.issues,
          },
        },
        { status: 400 },
      );
    }
    throw error;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const { id } = await params;
  const post = await prisma.post.findFirst({ where: { id, userId: authUser.userId } });
  if (!post) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Post not found' } }, { status: 404 });

  await prisma.post.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
