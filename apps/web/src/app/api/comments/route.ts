import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getAuthUser, unauthorizedResponse } from '@/lib/auth-guard';
import { callAI } from '@/lib/ai';
import {
  canonicalizeLinkedInPostUrn,
  createLinkedInComment,
  fetchLinkedInComments,
  fetchLinkedInPosts,
} from '@/lib/linkedin/client';

export interface PostComment {
  id: string;
  linkedInCommentId: string;
  postId: string;
  postUrn: string;
  postTitle: string;
  commenterName: string;
  commenterHeadline: string | null;
  commenterAvatar: string | null;
  commentText: string;
  createdAt: string | null;
  likes: number;
  aiReplyText: string;
  status: 'pending_review' | 'sent';
}

const commentActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('generate_reply'),
    commentText: z.string().trim().min(1).max(3000),
    postText: z.string().trim().max(3000).optional(),
  }),
  z.object({
    action: z.literal('post_reply'),
    postUrn: z.string().trim().min(1),
    replyText: z.string().trim().min(1).max(3000),
  }),
]);

function asMetadata(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function postUrnFrom(
  platformPostId: string | null,
  platformPostUrl: string | null,
  metadata: Record<string, unknown>,
): string | null {
  return [
    platformPostId,
    typeof metadata.linkedInPostId === 'string' ? metadata.linkedInPostId : null,
    platformPostUrl,
    typeof metadata.linkedInUrl === 'string' ? metadata.linkedInUrl : null,
  ]
    .map(canonicalizeLinkedInPostUrn)
    .find((value): value is string => Boolean(value)) ?? null;
}

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const account = await prisma.socialAccount.findFirst({
    where: { userId: authUser.userId, provider: 'linkedin', status: 'active' },
  });

  if (!account?.accessToken) {
    return NextResponse.json({
      data: {
        comments: [],
        sync: {
          status: 'not_connected',
          message: 'Connect LinkedIn to load real comments.',
        },
      },
    });
  }

  const publishedPosts = await prisma.post.findMany({
    where: { userId: authUser.userId, platform: 'linkedin', status: 'published' },
    orderBy: { publishedAt: 'desc' },
    take: 25,
  });

  const sourceMap = new Map<string, { postId: string; postUrn: string; postTitle: string }>();
  let sourceFailure: { status: string; message: string } | null = null;

  for (const post of publishedPosts) {
    const postUrn = postUrnFrom(post.platformPostId, post.platformPostUrl, asMetadata(post.metadata));
    if (!postUrn) {
      sourceFailure ??= {
        status: 'missing_post_urn',
        message: 'A published post is missing its LinkedIn URN.',
      };
      continue;
    }
    sourceMap.set(postUrn, {
      postId: post.id,
      postUrn,
      postTitle: post.content.length > 64 ? `${post.content.slice(0, 64)}…` : post.content,
    });
  }

  const remotePosts = await fetchLinkedInPosts(
    account.accessToken,
    `urn:li:person:${account.providerUserId}`,
  );
  if (remotePosts.ok) {
    for (const post of remotePosts.data) {
      if (sourceMap.has(post.urn)) continue;
      sourceMap.set(post.urn, {
        postId: `linkedin:${post.urn}`,
        postUrn: post.urn,
        postTitle: post.commentary.length > 64 ? `${post.commentary.slice(0, 64)}…` : post.commentary,
      });
    }
  } else {
    sourceFailure ??= { status: remotePosts.status, message: remotePosts.message };
  }

  const sources = Array.from(sourceMap.values());
  if (sources.length === 0) {
    return NextResponse.json({
      data: {
        comments: [],
        sync: sourceFailure ?? { status: 'ok', message: 'No published LinkedIn posts yet.' },
      },
    });
  }

  const results = await Promise.all(
    sources.map(async (source) => {
      const result = await fetchLinkedInComments(account.accessToken, source.postUrn);
      if (!result.ok) {
        return {
          comments: [] as PostComment[],
          failure: { status: result.status, message: result.message },
        };
      }

      return {
        comments: result.data.map<PostComment>((comment) => ({
          id: comment.urn,
          linkedInCommentId: comment.id,
          postId: source.postId,
          postUrn: source.postUrn,
          postTitle: source.postTitle,
          commenterName: 'LinkedIn member',
          commenterHeadline: null,
          commenterAvatar: null,
          commentText: comment.text,
          createdAt: comment.createdAt,
          likes: comment.likes,
          aiReplyText: '',
          status: 'pending_review',
        })),
        failure: null,
      };
    }),
  );

  const comments = results
    .flatMap((result) => result.comments)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  const failure = sourceFailure ?? results.find((result) => result.failure)?.failure;

  return NextResponse.json({
    data: {
      comments,
      sync: failure
        ? {
            status: failure.status,
            message: failure.message,
            partial: comments.length > 0,
          }
        : { status: 'ok', partial: false },
    },
  });
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) return unauthorizedResponse();

  const parsed = commentActionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid comment action.',
          details: parsed.error.issues,
        },
      },
      { status: 400 },
    );
  }

  if (parsed.data.action === 'generate_reply') {
    const context = parsed.data.postText ? `\nPost: "${parsed.data.postText}"` : '';
    const aiReply = await callAI({
      system:
        'You are a thoughtful software professional replying to a real LinkedIn comment. Be concise, specific, and human.',
      messages: [
        {
          role: 'user',
          content: `Write a one or two sentence reply.${context}\nComment: "${parsed.data.commentText}"`,
        },
      ],
      maxTokens: 200,
    });

    return NextResponse.json({ data: { replyText: aiReply } });
  }

  const account = await prisma.socialAccount.findFirst({
    where: { userId: authUser.userId, provider: 'linkedin', status: 'active' },
  });

  if (!account?.accessToken) {
    return NextResponse.json(
      { error: { code: 'LINKEDIN_NOT_CONNECTED', message: 'Connect LinkedIn before posting a reply.' } },
      { status: 400 },
    );
  }

  const postUrn = canonicalizeLinkedInPostUrn(parsed.data.postUrn);
  if (!postUrn) {
    return NextResponse.json(
      { error: { code: 'INVALID_POST_URN', message: 'The LinkedIn post reference is invalid.' } },
      { status: 400 },
    );
  }

  const actorUrn = `urn:li:person:${account.providerUserId}`;
  const result = await createLinkedInComment(
    account.accessToken,
    postUrn,
    actorUrn,
    parsed.data.replyText,
  );

  if (!result.ok) {
    const status =
      result.status === 'token_expired'
        ? 401
        : result.status === 'permission_required'
          ? 403
          : result.status === 'rate_limited'
            ? 429
            : 502;
    return NextResponse.json(
      {
        error: {
          code: `LINKEDIN_${result.status.toUpperCase()}`,
          message: result.message,
        },
      },
      { status },
    );
  }

  return NextResponse.json({
    data: {
      success: true,
      status: 'sent',
      commentId: result.data.id,
      message: 'Reply published to LinkedIn.',
    },
  });
}
