import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeSuccessfulEngagement, readCachedEngagement, sumStoredEngagement } from './sync';

test('does not expose legacy placeholder engagement as cached LinkedIn data', () => {
  assert.deepEqual(readCachedEngagement({ likes: 2, comments: 0, views: 18 }), {
    likes: null,
    comments: null,
    views: null,
    hasRealStats: false,
    lastSyncedAt: null,
  });
});

test('preserves engagement only when it was previously synced from LinkedIn', () => {
  assert.deepEqual(
    readCachedEngagement({
      likes: 9,
      comments: 3,
      views: 120,
      hasRealStats: true,
      lastSyncedAt: '2026-08-10T10:00:00.000Z',
    }),
    {
      likes: 9,
      comments: 3,
      views: 120,
      hasRealStats: true,
      lastSyncedAt: '2026-08-10T10:00:00.000Z',
    },
  );
});

test('stores a successful LinkedIn zero as a real value', () => {
  const syncedAt = '2026-08-11T10:00:00.000Z';
  assert.deepEqual(
    mergeSuccessfulEngagement({ campaign: 'launch' }, { reactions: 0, comments: 0 }, syncedAt),
    {
      campaign: 'launch',
      likes: 0,
      comments: 0,
      views: null,
      hasRealStats: true,
      lastSyncedAt: syncedAt,
    },
  );
});

test('totals only engagement that was successfully synced from LinkedIn', () => {
  assert.deepEqual(
    sumStoredEngagement([
      { likes: 8, comments: 2, hasRealStats: true },
      { likes: 99, comments: 99, hasRealStats: false },
      null,
      { likes: 4, comments: 1, hasRealStats: true },
    ]),
    { reactions: 12, comments: 3, syncedPosts: 2 },
  );
});
