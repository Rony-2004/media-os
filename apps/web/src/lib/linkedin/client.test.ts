import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canonicalizeLinkedInPostUrn,
  createLinkedInComment,
  fetchLinkedInComments,
  fetchLinkedInPosts,
  fetchLinkedInSocialMetadata,
} from './client';

test('keeps canonical post URNs and extracts them from feed URLs', () => {
  assert.equal(canonicalizeLinkedInPostUrn('urn:li:ugcPost:123'), 'urn:li:ugcPost:123');
  assert.equal(canonicalizeLinkedInPostUrn('urn:li:share:456'), 'urn:li:share:456');
  assert.equal(
    canonicalizeLinkedInPostUrn('https://www.linkedin.com/feed/update/urn:li:activity:789/'),
    'urn:li:activity:789',
  );
  assert.equal(canonicalizeLinkedInPostUrn(''), null);
});

test('reads real reaction and comment totals from social metadata', async () => {
  const request = async () =>
    new Response(
      JSON.stringify({
        reactionSummaries: {
          LIKE: { count: 7 },
          PRAISE: { count: 2 },
          EMPATHY: { count: 1 },
        },
        commentSummary: { count: 4, topLevelCount: 3 },
      }),
      { status: 200 },
    );

  const result = await fetchLinkedInSocialMetadata('token', 'urn:li:ugcPost:123', request);

  assert.deepEqual(result, {
    ok: true,
    data: { reactions: 10, comments: 4 },
  });
});

test('treats missing successful summaries as real zero totals', async () => {
  const result = await fetchLinkedInSocialMetadata(
    'token',
    'urn:li:ugcPost:123',
    async () => new Response('{}', { status: 200 }),
  );

  assert.deepEqual(result, { ok: true, data: { reactions: 0, comments: 0 } });
});

test('maps LinkedIn authorization failures without returning fake zeroes', async () => {
  const forbidden = await fetchLinkedInSocialMetadata(
    'token',
    'urn:li:ugcPost:123',
    async () => new Response(JSON.stringify({ message: 'Not enough permissions' }), { status: 403 }),
  );
  const expired = await fetchLinkedInSocialMetadata(
    'token',
    'urn:li:ugcPost:123',
    async () => new Response(JSON.stringify({ message: 'Expired token' }), { status: 401 }),
  );
  const throttled = await fetchLinkedInSocialMetadata(
    'token',
    'urn:li:ugcPost:123',
    async () => new Response(JSON.stringify({ message: 'Slow down' }), { status: 429 }),
  );

  assert.equal(forbidden.ok, false);
  if (!forbidden.ok) assert.equal(forbidden.status, 'permission_required');
  assert.equal(expired.ok, false);
  if (!expired.ok) assert.equal(expired.status, 'token_expired');
  assert.equal(throttled.ok, false);
  if (!throttled.ok) assert.equal(throttled.status, 'rate_limited');
});

test('parses real LinkedIn comments without inventing profile fields', async () => {
  const result = await fetchLinkedInComments(
    'token',
    'urn:li:ugcPost:123',
    async () =>
      new Response(
        JSON.stringify({
          elements: [
            {
              id: '991',
              commentUrn: 'urn:li:comment:(urn:li:ugcPost:123,991)',
              actor: 'urn:li:person:abc',
              message: { text: 'This is the real comment.' },
              created: { time: 1720000000000 },
              likesSummary: { totalLikes: 5 },
            },
          ],
        }),
        { status: 200 },
      ),
  );

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.data[0], {
      id: '991',
      urn: 'urn:li:comment:(urn:li:ugcPost:123,991)',
      actorUrn: 'urn:li:person:abc',
      text: 'This is the real comment.',
      createdAt: '2024-07-03T09:46:40.000Z',
      likes: 5,
    });
  }
});

test('returns an upstream failure when LinkedIn rejects a comment reply', async () => {
  const result = await createLinkedInComment(
    'token',
    'urn:li:ugcPost:123',
    'urn:li:person:me',
    'Thanks!',
    async () => new Response(JSON.stringify({ message: 'Rejected' }), { status: 400 }),
  );

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 'upstream_error');
});

test('accepts LinkedIn comment creation responses with an empty body', async () => {
  const result = await createLinkedInComment(
    'token',
    'urn:li:ugcPost:123',
    'urn:li:person:me',
    'Thanks!',
    async () => new Response(null, { status: 201 }),
  );

  assert.deepEqual(result, { ok: true, data: { id: 'created' } });
});

test('parses posts created directly on LinkedIn', async () => {
  const result = await fetchLinkedInPosts(
    'token',
    'urn:li:person:abc',
    async () =>
      new Response(
        JSON.stringify({
          elements: [
            {
              id: 'urn:li:ugcPost:777',
              commentary: 'A real LinkedIn post',
              publishedAt: 1720000000000,
            },
          ],
        }),
        { status: 200 },
      ),
  );

  assert.deepEqual(result, {
    ok: true,
    data: [
      {
        urn: 'urn:li:ugcPost:777',
        commentary: 'A real LinkedIn post',
        publishedAt: '2024-07-03T09:46:40.000Z',
        url: 'https://www.linkedin.com/feed/update/urn:li:ugcPost:777',
      },
    ],
  });
});
