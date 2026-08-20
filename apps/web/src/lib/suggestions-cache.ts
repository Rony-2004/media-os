/**
 * Cache identity for a user's generated suggestion batch.
 *
 * Lives outside the route because Next.js route modules may only export
 * handlers and its own reserved config keys.
 */
export const SUGGESTIONS_CACHE_KEY = 'ai-suggestions';

export function suggestionsTag(userId: string): string {
  return `${SUGGESTIONS_CACHE_KEY}:${userId}`;
}
