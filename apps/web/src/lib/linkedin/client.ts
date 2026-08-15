import type {
  EngagementMetrics,
  LinkedInComment,
  LinkedInFailureStatus,
  LinkedInPost,
  LinkedInRequest,
  LinkedInResult,
} from './types';

const LINKEDIN_REST_BASE = 'https://api.linkedin.com/rest';
export const LINKEDIN_API_VERSION = '202607';

const postUrnPattern = /urn:li:(?:activity|share|ugcPost):[A-Za-z0-9_-]+/;

export function canonicalizeLinkedInPostUrn(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;

  let decoded = value.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // A malformed percent escape cannot hide an otherwise valid literal URN.
  }

  return decoded.match(postUrnPattern)?.[0] ?? null;
}

function linkedinHeaders(accessToken: string, json = false): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Linkedin-Version': LINKEDIN_API_VERSION,
    'X-Restli-Protocol-Version': '2.0.0',
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}

function mapFailureStatus(status: number): LinkedInFailureStatus {
  if (status === 401) return 'token_expired';
  if (status === 403) return 'permission_required';
  if (status === 429) return 'rate_limited';
  return 'upstream_error';
}

async function parseFailure(response: Response): Promise<LinkedInResult<never>> {
  let message = `LinkedIn request failed with status ${response.status}.`;

  try {
    const body = (await response.json()) as { message?: unknown; error_description?: unknown };
    const upstreamMessage =
      typeof body.message === 'string'
        ? body.message
        : typeof body.error_description === 'string'
          ? body.error_description
          : null;
    if (upstreamMessage) message = upstreamMessage.slice(0, 500);
  } catch {
    // Keep the safe status-only message when LinkedIn does not return JSON.
  }

  return {
    ok: false,
    status: mapFailureStatus(response.status),
    message,
    httpStatus: response.status,
  };
}

async function requestLinkedIn<T>(
  url: string,
  init: RequestInit,
  request: LinkedInRequest,
): Promise<LinkedInResult<T>> {
  try {
    const response = await request(url, init);
    if (!response.ok) return parseFailure(response);
    const rawBody = await response.text();
    return {
      ok: true,
      data: (rawBody ? JSON.parse(rawBody) : {}) as T,
    };
  } catch {
    return {
      ok: false,
      status: 'upstream_error',
      message: 'LinkedIn could not be reached. Try syncing again shortly.',
    };
  }
}

function totalReactions(value: unknown): number {
  if (Array.isArray(value)) {
    return value.reduce((total, item) => {
      if (!item || typeof item !== 'object') return total;
      const count = (item as { count?: unknown }).count;
      return total + (typeof count === 'number' && Number.isFinite(count) ? count : 0);
    }, 0);
  }

  if (!value || typeof value !== 'object') return 0;
  return Object.values(value).reduce<number>((total, item) => {
    if (!item || typeof item !== 'object') return total;
    const count = (item as { count?: unknown }).count;
    return total + (typeof count === 'number' && Number.isFinite(count) ? count : 0);
  }, 0);
}

export async function fetchLinkedInSocialMetadata(
  accessToken: string,
  postUrn: string,
  request: LinkedInRequest = fetch,
): Promise<LinkedInResult<EngagementMetrics>> {
  const result = await requestLinkedIn<{
    reactionSummaries?: unknown;
    commentSummary?: { count?: unknown };
  }>(
    `${LINKEDIN_REST_BASE}/socialMetadata/${encodeURIComponent(postUrn)}`,
    { headers: linkedinHeaders(accessToken), cache: 'no-store' },
    request,
  );

  if (!result.ok) return result;

  return {
    ok: true,
    data: {
      reactions: totalReactions(result.data.reactionSummaries),
      comments:
        typeof result.data.commentSummary?.count === 'number' &&
        Number.isFinite(result.data.commentSummary.count)
          ? result.data.commentSummary.count
          : 0,
    },
  };
}

export async function fetchLinkedInPosts(
  accessToken: string,
  authorUrn: string,
  request: LinkedInRequest = fetch,
): Promise<LinkedInResult<LinkedInPost[]>> {
  const params = new URLSearchParams({
    q: 'author',
    author: authorUrn,
    count: '100',
    sortBy: 'LAST_MODIFIED',
  });
  const result = await requestLinkedIn<{
    elements?: Array<{ id?: unknown; commentary?: unknown; publishedAt?: unknown; createdAt?: unknown }>;
  }>(
    `${LINKEDIN_REST_BASE}/posts?${params.toString()}`,
    { headers: linkedinHeaders(accessToken), cache: 'no-store' },
    request,
  );

  if (!result.ok) return result;

  const posts = (result.data.elements ?? []).flatMap<LinkedInPost>((element) => {
    const urn = typeof element.id === 'string' ? canonicalizeLinkedInPostUrn(element.id) : null;
    if (!urn) return [];
    const timestamp = element.publishedAt ?? element.createdAt;
    const publishedAt =
      typeof timestamp === 'number' && Number.isFinite(timestamp)
        ? new Date(timestamp).toISOString()
        : typeof timestamp === 'string' && !Number.isNaN(Date.parse(timestamp))
          ? new Date(timestamp).toISOString()
          : null;

    return [
      {
        urn,
        commentary: typeof element.commentary === 'string' ? element.commentary : '',
        publishedAt,
        url: `https://www.linkedin.com/feed/update/${urn}`,
      },
    ];
  });

  return { ok: true, data: posts };
}

interface LinkedInCommentResponse {
  elements?: Array<{
    id?: unknown;
    commentUrn?: unknown;
    actor?: unknown;
    message?: { text?: unknown } | unknown;
    created?: { time?: unknown };
    likesSummary?: { totalLikes?: unknown; aggregatedTotalLikes?: unknown };
  }>;
}

export async function fetchLinkedInComments(
  accessToken: string,
  postUrn: string,
  request: LinkedInRequest = fetch,
): Promise<LinkedInResult<LinkedInComment[]>> {
  const result = await requestLinkedIn<LinkedInCommentResponse>(
    `${LINKEDIN_REST_BASE}/socialActions/${encodeURIComponent(postUrn)}/comments?count=100`,
    { headers: linkedinHeaders(accessToken), cache: 'no-store' },
    request,
  );

  if (!result.ok) return result;

  const comments = (result.data.elements ?? []).flatMap<LinkedInComment>((element) => {
    const id = typeof element.id === 'string' || typeof element.id === 'number' ? String(element.id) : null;
    const message =
      element.message && typeof element.message === 'object'
        ? (element.message as { text?: unknown }).text
        : null;
    if (!id || typeof message !== 'string' || !message.trim()) return [];

    const createdTime = element.created?.time;
    const createdAt =
      typeof createdTime === 'number' && Number.isFinite(createdTime)
        ? new Date(createdTime).toISOString()
        : null;
    const totalLikes = element.likesSummary?.totalLikes ?? element.likesSummary?.aggregatedTotalLikes;

    return [
      {
        id,
        urn:
          typeof element.commentUrn === 'string'
            ? element.commentUrn
            : `urn:li:comment:(${postUrn},${id})`,
        actorUrn: typeof element.actor === 'string' ? element.actor : null,
        text: message,
        createdAt,
        likes: typeof totalLikes === 'number' && Number.isFinite(totalLikes) ? totalLikes : 0,
      },
    ];
  });

  return { ok: true, data: comments };
}

export async function createLinkedInComment(
  accessToken: string,
  postUrn: string,
  actorUrn: string,
  message: string,
  request: LinkedInRequest = fetch,
): Promise<LinkedInResult<{ id: string }>> {
  const result = await requestLinkedIn<{ id?: unknown; commentUrn?: unknown }>(
    `${LINKEDIN_REST_BASE}/socialActions/${encodeURIComponent(postUrn)}/comments`,
    {
      method: 'POST',
      headers: linkedinHeaders(accessToken, true),
      body: JSON.stringify({ actor: actorUrn, message: { text: message, attributes: [] } }),
    },
    request,
  );

  if (!result.ok) return result;
  const id =
    typeof result.data.id === 'string' || typeof result.data.id === 'number'
      ? String(result.data.id)
      : typeof result.data.commentUrn === 'string'
        ? result.data.commentUrn
        : 'created';
  return { ok: true, data: { id } };
}
