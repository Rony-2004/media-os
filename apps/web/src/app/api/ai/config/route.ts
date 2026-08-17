import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-guard';
import { getBrandVoice, saveBrandVoice } from '@/lib/brand-voice';

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const data = await getBrandVoice(authUser.userId);
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    const body = await req.json();
    const data = await saveBrandVoice(authUser.userId, body);
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_CONFIG',
            message: 'That brand voice configuration is not valid.',
            details: error.issues.map((issue) => ({
              field: issue.path.join('.'),
              message: issue.message,
            })),
          },
        },
        { status: 400 },
      );
    }

    console.error('[AI Config]', error instanceof Error ? error.message : 'Save failed');
    return NextResponse.json(
      { error: { code: 'CONFIG_SAVE_FAILED', message: 'The configuration could not be saved.' } },
      { status: 500 },
    );
  }
}
