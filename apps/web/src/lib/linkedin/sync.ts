import type { EngagementMetrics } from './types';

export interface StoredEngagement {
  likes: number | null;
  comments: number | null;
  views: number | null;
  hasRealStats: boolean;
  lastSyncedAt: string | null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function readCachedEngagement(metadata: Record<string, unknown>): StoredEngagement {
  if (metadata.hasRealStats !== true) {
    return {
      likes: null,
      comments: null,
      views: null,
      hasRealStats: false,
      lastSyncedAt: null,
    };
  }

  return {
    likes: finiteNumber(metadata.likes),
    comments: finiteNumber(metadata.comments),
    views: finiteNumber(metadata.views),
    hasRealStats: true,
    lastSyncedAt: typeof metadata.lastSyncedAt === 'string' ? metadata.lastSyncedAt : null,
  };
}

export function mergeSuccessfulEngagement(
  metadata: Record<string, unknown>,
  metrics: EngagementMetrics,
  syncedAt: string,
): Record<string, unknown> & StoredEngagement {
  const cached = readCachedEngagement(metadata);

  return {
    ...metadata,
    likes: metrics.reactions,
    comments: metrics.comments,
    views: cached.views,
    hasRealStats: true,
    lastSyncedAt: syncedAt,
  };
}

export function sumStoredEngagement(values: unknown[]): {
  reactions: number;
  comments: number;
  syncedPosts: number;
} {
  return values.reduce<{ reactions: number; comments: number; syncedPosts: number }>(
    (totals, value) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return totals;
      const cached = readCachedEngagement(value as Record<string, unknown>);
      if (!cached.hasRealStats) return totals;

      totals.reactions += cached.likes ?? 0;
      totals.comments += cached.comments ?? 0;
      totals.syncedPosts += 1;
      return totals;
    },
    { reactions: 0, comments: 0, syncedPosts: 0 },
  );
}
