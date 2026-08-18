import { NextRequest, NextResponse } from 'next/server';
import { createScheduledPostRepository } from '@/lib/scheduled-posts';
import { processDuePosts, PublishError } from '@/lib/scheduler';
import { publishLinkedInPost } from '@/lib/linkedin/publish';

export const dynamic = 'force-dynamic';

/**
 * Publishes every scheduled post whose time has come.
 *
 * Point a scheduler at this route (Vercel Cron, GitHub Actions, systemd timer,
 * anything that can issue an HTTP request) — for example every five minutes.
 * Without such a trigger nothing publishes on its own.
 *
 * Auth: requires `CRON_SECRET` via `Authorization: Bearer <secret>`. The route
 * refuses to run when the secret is unset rather than defaulting to open, so a
 * missing env var cannot silently expose it.
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      {
        error: {
          code: 'CRON_NOT_CONFIGURED',
          message: 'CRON_SECRET is not set, so the publishing job is disabled.',
        },
      },
      { status: 503 },
    );
  }

  const provided = req.headers.get('authorization');
  if (provided !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid cron credentials.' } },
      { status: 401 },
    );
  }

  const summary = await processDuePosts(createScheduledPostRepository(), {
    publish: async (post) => {
      if (!post.accessToken) {
        throw new PublishError('No active LinkedIn account is connected for this post.', false);
      }
      return publishLinkedInPost(post.accessToken, post.content, { image: post.image });
    },
  });

  return NextResponse.json({ data: summary });
}

export const GET = handle;
export const POST = handle;
