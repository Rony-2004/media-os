import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-guard';
import { z } from 'zod';

const createPostSchema = z.object({
  content: z.string().min(1).max(25000),
  platform: z.enum(['linkedin', 'twitter', 'instagram', 'facebook', 'threads']),
  socialAccountId: z.string().optional(),
  status: z.enum(['draft', 'scheduled']).default('draft'),
  scheduledAt: z.string().datetime().optional(),
});

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get('status');
  const statuses = statusParam
    ? statusParam.split(',')
    : ['draft', 'scheduled', 'published', 'failed', 'cancelled'];

  const posts = await prisma.post.findMany({
    where: { userId: authUser.userId, status: { in: statuses } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ data: posts });
}

export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const body = await req.json();
  const parsed = createPostSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const { content, platform, socialAccountId, status, scheduledAt } = parsed.data;

  const post = await prisma.post.create({
    data: {
      userId: authUser.userId,
      content,
      platform,
      socialAccountId: socialAccountId || null,
      status,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
  });

  return NextResponse.json({ data: post }, { status: 201 });
}
