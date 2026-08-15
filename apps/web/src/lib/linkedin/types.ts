export type LinkedInSyncStatus =
  | 'ok'
  | 'permission_required'
  | 'token_expired'
  | 'rate_limited'
  | 'upstream_error';

export type LinkedInFailureStatus = Exclude<LinkedInSyncStatus, 'ok'>;

export type LinkedInResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      status: LinkedInFailureStatus;
      message: string;
      httpStatus?: number;
    };

export interface EngagementMetrics {
  reactions: number;
  comments: number;
}

export interface LinkedInComment {
  id: string;
  urn: string;
  actorUrn: string | null;
  text: string;
  createdAt: string | null;
  likes: number;
}

export interface LinkedInPost {
  urn: string;
  commentary: string;
  publishedAt: string | null;
  url: string;
}

export type LinkedInRequest = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;
