import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PublishError,
  processDuePosts,
  type DuePost,
  type ScheduledPostRepository,
} from './scheduler';

function makeRepository(posts: DuePost[], claimedIds = new Set(posts.map((post) => post.id))) {
  const calls: string[] = [];
  const repository: ScheduledPostRepository = {
    findDuePosts: async () => posts,
    claim: async (id) => {
      calls.push(`claim:${id}`);
      return claimedIds.has(id);
    },
    markPublished: async (id) => {
      calls.push(`published:${id}`);
    },
    markRetry: async (id, message) => {
      calls.push(`retry:${id}:${message}`);
    },
    markFailed: async (id, message) => {
      calls.push(`failed:${id}:${message}`);
    },
  };

  return { repository, calls };
}

test('publishes every due post that this scheduler run claims', async () => {
  const posts: DuePost[] = [
    { id: 'post-1', content: 'First post', retryCount: 0, accessToken: 'token-1' },
    { id: 'post-2', content: 'Second post', retryCount: 0, accessToken: 'token-2' },
  ];
  const { repository, calls } = makeRepository(posts);
  const published: string[] = [];

  const summary = await processDuePosts(repository, {
    publish: async (post) => {
      published.push(post.id);
      return { platformPostId: `urn:${post.id}`, platformPostUrl: `https://example.test/${post.id}` };
    },
  });

  assert.deepEqual(summary, { found: 2, claimed: 2, published: 2, retried: 0, failed: 0, skipped: 0 });
  assert.deepEqual(published, ['post-1', 'post-2']);
  assert.deepEqual(calls, ['claim:post-1', 'published:post-1', 'claim:post-2', 'published:post-2']);
});

test('skips a post another cron invocation already claimed', async () => {
  const post: DuePost = { id: 'post-1', content: 'Post', retryCount: 0, accessToken: 'token' };
  const { repository, calls } = makeRepository([post], new Set());
  let publishCalls = 0;

  const summary = await processDuePosts(repository, {
    publish: async () => {
      publishCalls += 1;
      return { platformPostId: null, platformPostUrl: null };
    },
  });

  assert.deepEqual(summary, { found: 1, claimed: 0, published: 0, retried: 0, failed: 0, skipped: 1 });
  assert.equal(publishCalls, 0);
  assert.deepEqual(calls, ['claim:post-1']);
});

test('retries transient publish failures and permanently fails after max retries', async () => {
  const retryablePost: DuePost = { id: 'retry-post', content: 'Retry me', retryCount: 0, accessToken: 'token' };
  const terminalPost: DuePost = { id: 'terminal-post', content: 'Stop retrying', retryCount: 3, accessToken: 'token' };
  const { repository, calls } = makeRepository([retryablePost, terminalPost]);

  const summary = await processDuePosts(repository, {
    publish: async (post) => {
      throw new PublishError(`Failed ${post.id}`, true);
    },
  });

  assert.deepEqual(summary, { found: 2, claimed: 2, published: 0, retried: 1, failed: 1, skipped: 0 });
  assert.deepEqual(calls, [
    'claim:retry-post',
    'retry:retry-post:Failed retry-post',
    'claim:terminal-post',
    'failed:terminal-post:Failed terminal-post',
  ]);
});

test('does not retry permanent publish failures', async () => {
  const post: DuePost = { id: 'post-1', content: 'Post', retryCount: 0, accessToken: null };
  const { repository, calls } = makeRepository([post]);

  const summary = await processDuePosts(repository, {
    publish: async () => {
      throw new PublishError('LinkedIn account is not connected', false);
    },
  });

  assert.deepEqual(summary, { found: 1, claimed: 1, published: 0, retried: 0, failed: 1, skipped: 0 });
  assert.deepEqual(calls, ['claim:post-1', 'failed:post-1:LinkedIn account is not connected']);
});
