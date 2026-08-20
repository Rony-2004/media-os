import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyHook, closesWithQuestion, countEmoji, countHashtags, extractTraits, lengthBucket } from './traits';
import { analyzeGrowth, MIN_POSTS_FOR_INSIGHTS, type AnalyzedPost } from './analyze';
import { buildGrowthDirectives, pickSlots, summarizeInsights } from './apply';

/* ── Traits ─────────────────────────────────────────────────────────────── */

test('hooks are classified from the opening line', () => {
  assert.equal(classifyHook('Is your queue lying to you?\n\nMore text'), 'question');
  assert.equal(classifyHook('3 things that broke in production'), 'number');
  assert.equal(classifyHook("A queue that grows forever isn't buffering"), 'contrarian');
  assert.equal(classifyHook('I spent a week chasing a memory leak'), 'story');
  assert.equal(classifyHook('Backpressure is a contract problem'), 'statement');
});

test('hashtags, emoji and length are measured', () => {
  assert.equal(countHashtags('text #SystemDesign #Backend'), 2);
  assert.equal(countHashtags('no tags here'), 0);
  assert.equal(countEmoji('ship it 🚀 now 🔧'), 2);
  assert.equal(lengthBucket(120), 'short');
  assert.equal(lengthBucket(500), 'medium');
  assert.equal(lengthBucket(1200), 'long');
});

test('a closing question is detected past trailing hashtags', () => {
  assert.equal(closesWithQuestion('Body text\n\nWhat do you use?\n\n#SystemDesign'), true);
  assert.equal(closesWithQuestion('Body text\n\nThat is all.\n\n#SystemDesign'), false);
});

test('traits capture the publish weekday and hour', () => {
  const traits = extractTraits({
    content: 'Hello world',
    publishedAt: new Date(2026, 7, 17, 14, 30),
    topic: 'Backend',
  });
  assert.equal(traits.hour, 14);
  assert.equal(traits.weekday, new Date(2026, 7, 17).getDay());
  assert.equal(traits.topic, 'Backend');
});

/* ── Analysis ───────────────────────────────────────────────────────────── */

function post(engagement: number, overrides: Partial<AnalyzedPost['traits']> = {}): AnalyzedPost {
  return {
    engagement,
    traits: {
      topic: 'Backend',
      length: 'medium',
      charCount: 500,
      hook: 'statement',
      hashtagCount: 2,
      hashtags: 'few',
      emojiCount: 0,
      closesWithQuestion: true,
      paragraphs: 3,
      weekday: 2,
      hour: 9,
      ...overrides,
    },
  };
}

test('withholds insights below the sample threshold, and says why', () => {
  const insights = analyzeGrowth([post(10), post(20)]);
  assert.equal(insights.confident, false);
  assert.equal(insights.sampleSize, 2);
  assert.match(insights.reason ?? '', /2 available/);
  assert.deepEqual(insights.topics, []);
  assert.equal(insights.baseline, null);
});

test('a single lucky post cannot become a pattern', () => {
  // Five posts, but only one uses the 'question' hook.
  const posts = [
    post(5),
    post(5),
    post(5),
    post(5),
    post(500, { hook: 'question' }),
  ];
  const insights = analyzeGrowth(posts);
  assert.equal(insights.confident, true);
  assert.equal(
    insights.hooks.find((h) => h.value === 'question'),
    undefined,
    'a 1-sample hook must not be reported',
  );
});

test('identifies the winning trait once enough samples exist', () => {
  const posts = [
    post(100, { hook: 'question' }),
    post(120, { hook: 'question' }),
    post(110, { hook: 'question' }),
    post(10, { hook: 'statement' }),
    post(12, { hook: 'statement' }),
    post(8, { hook: 'statement' }),
  ];
  const insights = analyzeGrowth(posts);
  assert.equal(insights.hooks[0].value, 'question');
  assert.ok(insights.hooks[0].lift > 0);
  assert.ok(insights.hooks[insights.hooks.length - 1].lift < 0);
  assert.equal(insights.sampleSize, 6);
});

test('best hours require repeat evidence', () => {
  const posts = [
    post(100, { hour: 8 }),
    post(110, { hour: 8 }),
    post(10, { hour: 20 }),
    post(12, { hour: 20 }),
    post(50, { hour: 15 }),
  ];
  const insights = analyzeGrowth(posts);
  assert.equal(insights.bestHours[0], 8);
  assert.ok(!insights.bestHours.includes(15), 'a single-sample hour must not rank');
});

/* ── Feedback ───────────────────────────────────────────────────────────── */

test('no directives are emitted without confidence', () => {
  const insights = analyzeGrowth([post(10)]);
  assert.equal(buildGrowthDirectives(insights), '');
});

test('directives describe measured wins only', () => {
  const posts = [
    post(100, { hook: 'question' }),
    post(120, { hook: 'question' }),
    post(110, { hook: 'question' }),
    post(10, { hook: 'statement' }),
    post(12, { hook: 'statement' }),
    post(8, { hook: 'statement' }),
  ];
  const directives = buildGrowthDirectives(analyzeGrowth(posts));
  assert.match(directives, /question/);
  assert.match(directives, /6 published posts/);
});

test('a flat account produces no directives rather than invented ones', () => {
  const flat = Array.from({ length: 6 }, () => post(50));
  assert.equal(buildGrowthDirectives(analyzeGrowth(flat)), '');
});

test('slots use proven hours, and fall back cleanly when there are none', () => {
  const learned = analyzeGrowth([
    post(100, { hour: 8 }),
    post(110, { hour: 8 }),
    post(10, { hour: 20 }),
    post(12, { hour: 20 }),
    post(50, { hour: 8 }),
  ]);
  const from = new Date(2026, 7, 17, 12, 0);
  const slots = pickSlots(learned, 3, 2, { from });
  assert.equal(slots[0].getHours(), 8);
  assert.equal(slots[0].getDate(), 19);
  assert.equal(slots[1].getDate(), 21);

  const cold = analyzeGrowth([post(10)]);
  const fallback = pickSlots(cold, 2, 1, { from, fallbackHour: 9 });
  assert.equal(fallback[0].getHours(), 9);
});

test('the summary never claims a pattern it does not have', () => {
  assert.match(summarizeInsights(analyzeGrowth([post(1)])), /Needs 5 published posts/);
  const flat = Array.from({ length: MIN_POSTS_FOR_INSIGHTS + 1 }, () => post(50));
  assert.match(summarizeInsights(analyzeGrowth(flat)), /no pattern is yet strong enough/);
});
