import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-guard';
import { parsePostUpdate } from '@/lib/post-workspace';
import { fingerprintPostContent } from '@/lib/post-dedupe';
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
    const contentFingerprint = data.content
      ? fingerprintPostContent(data.content)
      : undefined;

    if (contentFingerprint) {
      const existingPosts = await prisma.post.findMany({
        where: { userId: authUser.userId, platform: post.platform, NOT: { id } },
        select: { content: true, contentFingerprint: true },
      });
      const duplicateExists = existingPosts.some(
        (existingPost) =>
          existingPost.contentFingerprint === contentFingerprint ||
          fingerprintPostContent(existingPost.content) === contentFingerprint,
      );

      if (duplicateExists) {
        return NextResponse.json(
          {
            error: {
              code: 'DUPLICATE_POST',
              message: 'A matching post already exists for this platform.',
            },
          },
          { status: 409 },
        );
      }
    }

    const updated = await prisma.post.update({
      where: { id },
      data: {
        ...data,
        contentFingerprint,
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        {
          error: {
            code: 'DUPLICATE_POST',
            message: 'A matching post already exists for this platform.',
          },
        },
        { status: 409 },
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
