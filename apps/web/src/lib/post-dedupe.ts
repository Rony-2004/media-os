import { createHash } from 'node:crypto';

export interface DeduplicatablePost {
  userId: string;
  platform: string;
  content: string;
  contentFingerprint?: string | null;
}

export function normalizePostContent(content: string): string {
  return content.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function fingerprintPostContent(content: string): string {
  return createHash('sha256').update(normalizePostContent(content)).digest('hex');
}

export function postDedupeKey(post: DeduplicatablePost): string {
  const fingerprint = post.contentFingerprint || fingerprintPostContent(post.content);
  return `${post.userId}:${post.platform}:${fingerprint}`;
}

export function deduplicatePosts<T extends DeduplicatablePost>(posts: T[]): T[] {
  const seen = new Set<string>();

  return posts.filter((post) => {
    const key = postDedupeKey(post);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
