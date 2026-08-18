import test from 'node:test';
import assert from 'node:assert/strict';
import { getTopicImageUrl, matchTopicImage, TOPIC_IMAGES, tokenize } from './topic-image';

test('substring collisions no longer pick the AI image', () => {
  // The old matcher used includes('ai'), so all of these matched "ai".
  for (const phrase of ['Email deliverability', 'Attention to detail', 'Available capacity']) {
    assert.equal(matchTopicImage(phrase, 'General')?.key, undefined, `"${phrase}" should not match`);
  }
});

test('picks the topic with the most keyword hits', () => {
  assert.equal(
    matchTopicImage('Reducing Cold Start Latency in Serverless GPU Inference', 'AI Infrastructure')?.key,
    'ai',
  );
  assert.equal(matchTopicImage('Postgres index bloat and MVCC', 'Database')?.key, 'database');
  assert.equal(matchTopicImage('Rotating bcrypt password hashes', 'Security')?.key, 'security');
  assert.equal(matchTopicImage('Kubernetes pod scheduling latency', 'Systems')?.key, 'systems');
});

test('returns null rather than an unrelated image', () => {
  assert.equal(matchTopicImage('Writing better standup updates', 'Team'), null);
  assert.equal(getTopicImageUrl('Writing better standup updates', 'Team'), null);
});

test('the category alone can carry the match', () => {
  assert.equal(matchTopicImage('Cold starts explained', 'Serverless')?.key, 'systems');
});

test('tokenizer splits on punctuation and keeps hyphenated words', () => {
  assert.deepEqual(tokenize('Zero-trust auth: why?'), ['zero-trust', 'auth', 'why']);
});

test('every library entry has a usable https url and keywords', () => {
  for (const image of TOPIC_IMAGES) {
    assert.match(image.url, /^https:\/\/images\.unsplash\.com\//);
    assert.ok(image.keywords.length > 0, `${image.key} has no keywords`);
  }
});

test('keywords are unique across the library so scores stay meaningful', () => {
  const seen = new Map<string, string>();
  for (const image of TOPIC_IMAGES) {
    for (const keyword of image.keywords) {
      const owner = seen.get(keyword);
      assert.equal(owner, undefined, `"${keyword}" is claimed by both ${owner} and ${image.key}`);
      seen.set(keyword, image.key);
    }
  }
});
