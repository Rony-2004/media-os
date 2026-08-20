import test from 'node:test';
import assert from 'node:assert/strict';
import { deduplicatePosts, fingerprintPostContent } from './post-dedupe';

test('fingerprint treats case and whitespace-only differences as duplicates', () => {
  assert.equal(
    fingerprintPostContent('  Build   better APIs\nwith confidence. '),
    fingerprintPostContent('build better APIs with confidence.'),
  );
});

test('deduplicatePosts keeps the first post for matching user and platform content', () => {
  const posts = [
    { id: 'newest', userId: 'user-1', platform: 'linkedin', content: 'Same post' },
    { id: 'other-platform', userId: 'user-1', platform: 'twitter', content: 'Same post' },
    { id: 'other-user', userId: 'user-2', platform: 'linkedin', content: 'Same post' },
    { id: 'duplicate', userId: 'user-1', platform: 'linkedin', content: ' same   post ' },
  ];

  assert.deepEqual(
    deduplicatePosts(posts).map((post) => post.id),
    ['newest', 'other-platform', 'other-user'],
  );
});
