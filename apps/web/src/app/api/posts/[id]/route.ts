import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-guard';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const { id } = await params;
  const post = await prisma.post.findFirst({ where: { id, userId: authUser.userId } });
  if (!post) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Post not found' } }, { status: 404 });

  return NextResponse.json({ data: post });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const { id } = await params;
  const post = await prisma.post.findFirst({ where: { id, userId: authUser.userId } });
  if (!post) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Post not found' } }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.post.update({ where: { id }, data: body });

  return NextResponse.json({ data: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authUser = getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const { id } = await params;
  const post = await prisma.post.findFirst({ where: { id, userId: authUser.userId } });
  if (!post) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Post not found' } }, { status: 404 });

  await prisma.post.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
