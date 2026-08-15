// Shared in-memory state store for LinkedIn OAuth flow (use Redis in production)
export const linkedinStateStore = new Map<string, { userId: string; expiresAt: number }>();
