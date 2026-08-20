import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-guard';
import { getGrowthInsights } from '@/lib/growth/repository';
import { summarizeInsights } from '@/lib/growth/apply';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    const insights = await getGrowthInsights(authUser.userId);
    return NextResponse.json({
      data: { ...insights, summary: summarizeInsights(insights) },
    });
  } catch (error) {
    console.error('[Growth Insights]', error instanceof Error ? error.message : 'failed');
    return NextResponse.json(
      { error: { code: 'INSIGHTS_FAILED', message: 'Growth insights could not be loaded.' } },
      { status: 500 },
    );
  }
}
