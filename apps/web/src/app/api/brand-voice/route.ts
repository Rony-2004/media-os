import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-guard';

// In-memory store per user (replace with DB table in Phase 2)
const store = new Map<string, any>();

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const data = store.get(authUser.userId) || null;
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const body = await req.json();
  store.set(authUser.userId, body);

  return NextResponse.json({ data: body });
}
