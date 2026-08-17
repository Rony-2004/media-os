import test from 'node:test';
import assert from 'node:assert/strict';
import {
  brandVoiceDefaults,
  brandVoiceSchema,
  buildSystemPrompt,
  buildVoiceDirectives,
  normalizeBrandVoice,
  postIntervalDays,
} from './brand-voice';

test('every configured field reaches the prompt', () => {
  const directives = buildVoiceDirectives({
    ...brandVoiceDefaults,
    formality: 5,
    humor: 4,
    emojiUsage: 'none',
    postLength: 'long',
    proficiency: 'beginner',
    topics: ['Postgres', 'Observability'],
    avoidWords: ['synergy', 'game-changer'],
  });

  assert.match(directives, /corporate and authoritative/);
  assert.match(directives, /playful and personable/);
  assert.match(directives, /Do not use emoji at all/);
  assert.match(directives, /between 800 and 1500 characters/);
  assert.match(directives, /beginner reader/);
  assert.match(directives, /Postgres, Observability/);
  assert.match(directives, /synergy, game-changer/);
});

test('banned words are stated as a hard prohibition', () => {
  const directives = buildVoiceDirectives({ ...brandVoiceDefaults, avoidWords: ['leverage'] });
  assert.match(directives, /never use any of these/i);
  assert.match(directives, /leverage/);
});

test('empty topic and banned lists produce no empty directives', () => {
  const directives = buildVoiceDirectives({
    ...brandVoiceDefaults,
    topics: [],
    avoidWords: [],
    samplePosts: '',
  });
  assert.doesNotMatch(directives, /Subject areas/);
  assert.doesNotMatch(directives, /Banned words/);
  assert.doesNotMatch(directives, /Match the voice/);
});

test('sample posts are included when provided', () => {
  const directives = buildVoiceDirectives({
    ...brandVoiceDefaults,
    samplePosts: 'Shipped a thing today. It broke. Fixed it.',
  });
  assert.match(directives, /Shipped a thing today/);
});

test('length changes with the configured post length', () => {
  const short = buildVoiceDirectives({ ...brandVoiceDefaults, postLength: 'short' });
  const long = buildVoiceDirectives({ ...brandVoiceDefaults, postLength: 'long' });
  assert.match(short, /between 100 and 300 characters/);
  assert.match(long, /between 800 and 1500 characters/);
});

test('the system prompt forbids fabricated sources', () => {
  const prompt = buildSystemPrompt(brandVoiceDefaults);
  assert.match(prompt, /Never fabricate statistics, benchmarks, quotes, or sources/);
});

test('cadence maps to slot spacing', () => {
  assert.equal(postIntervalDays('7_week'), 1);
  assert.equal(postIntervalDays('3_week'), 2);
  assert.equal(postIntervalDays('1_week'), 7);
});

test('partial and legacy payloads are filled from defaults', () => {
  const config = normalizeBrandVoice({ formality: 5, topics: ['Rust'] });
  assert.equal(config.formality, 5);
  assert.deepEqual(config.topics, ['Rust']);
  assert.equal(config.emojiUsage, brandVoiceDefaults.emojiUsage);
  assert.equal(config.autoSchedule, brandVoiceDefaults.autoSchedule);
});

test('null config falls back entirely to defaults', () => {
  assert.deepEqual(normalizeBrandVoice(null), brandVoiceDefaults);
});

test('out-of-range and unknown values are rejected', () => {
  assert.throws(() => normalizeBrandVoice({ formality: 9 }));
  assert.throws(() => normalizeBrandVoice({ emojiUsage: 'excessive' }));
  assert.throws(() => normalizeBrandVoice({ postFrequency: 'hourly' }));
});

test('defaults satisfy their own schema', () => {
  assert.doesNotThrow(() => brandVoiceSchema.parse(brandVoiceDefaults));
});
