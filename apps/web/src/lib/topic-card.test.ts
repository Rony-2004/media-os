import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTopicCard, buildTopicCardSvg, escapeXml, hashString, wrapText } from './topic-card';
import * as topicCardModule from './topic-card';

interface TestVisualPlan {
  eyebrow: string;
  headline: string;
  diagram: 'flow' | 'layers' | 'network' | 'cycle';
  nodes: string[];
  caption: string;
}

test('renders the system-design blueprint selected by Claude', () => {
  const renderWithPlan = buildTopicCardSvg as unknown as (
    trend: string,
    category: string,
    plan: TestVisualPlan,
  ) => string;
  const svg = renderWithPlan('Reliable event processing', 'Distributed Systems', {
    eyebrow: 'DELIVERY PATH',
    headline: 'Retries without duplicate writes',
    diagram: 'flow',
    nodes: ['API', 'QUEUE', 'WORKER', 'DB'],
    caption: 'Idempotency closes the loop',
  });

  assert.match(svg, /DELIVERY PATH/);
  assert.match(svg, /QUEUE/);
  assert.match(svg, /WORKER/);
  assert.match(svg, /Idempotency closes the loop/);
});

test('uses Claude only to design a post image and returns a PNG data URI', async () => {
  const generateClaudePostImage = (
    topicCardModule as unknown as {
      generateClaudePostImage?: (
        input: { trend: string; category: string; content: string },
        dependencies: {
          generate: (options: {
            system?: string;
            messages: Array<{ role: 'user' | 'assistant'; content: string }>;
            maxTokens?: number;
          }) => Promise<string>;
          rasterize: (svg: string) => Promise<Uint8Array>;
        },
      ) => Promise<string>;
    }
  ).generateClaudePostImage;

  assert.equal(
    typeof generateClaudePostImage,
    'function',
    'the Claude image generation pipeline must exist',
  );

  let prompt = '';
  const result = await generateClaudePostImage!(
    {
      trend: 'Reliable event processing',
      category: 'Distributed Systems',
      content: 'Use idempotency keys so a retried event cannot create duplicate writes.',
    },
    {
      generate: async (options) => {
        prompt = options.messages[0]?.content ?? '';
        return JSON.stringify({
          eyebrow: 'DELIVERY PATH',
          headline: 'Retries without duplicate writes',
          diagram: 'flow',
          nodes: ['API', 'QUEUE', 'WORKER', 'DB'],
          caption: 'Idempotency closes the loop',
        });
      },
      rasterize: async (svg) => {
        assert.match(svg, /QUEUE/);
        return new Uint8Array([137, 80, 78, 71]);
      },
    },
  );

  assert.match(prompt, /idempotency keys/);
  assert.equal(result, 'data:image/png;base64,iVBORw==');
});

test('the card shows this topic, not a generic stock image', () => {
  const svg = buildTopicCardSvg('Postgres index bloat and MVCC', 'Database');
  assert.match(svg, /Postgres/);
  assert.match(svg, /DATABASE/);
});

test('different topics produce different cards', () => {
  const a = buildTopicCardSvg('Reducing Cold Start Latency', 'AI Infrastructure');
  const b = buildTopicCardSvg('Feature Flag Rollout Strategies', 'Software Engineering');
  assert.notEqual(a, b);
});

test('the same topic always produces the same card', () => {
  const a = buildTopicCardSvg('Zero-downtime migrations', 'Database');
  const b = buildTopicCardSvg('Zero-downtime migrations', 'Database');
  assert.equal(a, b);
});

test('titles wrap instead of overflowing, and truncate past the line limit', () => {
  const lines = wrapText('Reducing Cold Start Latency in Serverless GPU Inference Pipelines', 22, 4);
  assert.ok(lines.length <= 4);
  for (const line of lines) {
    assert.ok(line.length <= 23, `"${line}" is too long`);
  }

  const clipped = wrapText('one two three four five six seven eight nine ten eleven twelve', 10, 2);
  assert.equal(clipped.length, 2);
  assert.match(clipped[1], /…$/);
});

test('a short title is not padded or truncated', () => {
  assert.deepEqual(wrapText('Postgres MVCC', 22, 4), ['Postgres MVCC']);
});

test('markup in a topic title cannot break the SVG', () => {
  const svg = buildTopicCardSvg('Why <script>alert(1)</script> & "quotes" break things', 'Security');
  assert.doesNotMatch(svg, /<script>/);
  assert.match(svg, /&lt;script&gt;/);
  assert.match(svg, /&amp;/);
});

test('escapeXml covers every reserved character', () => {
  assert.equal(escapeXml(`<&>"'`), '&lt;&amp;&gt;&quot;&apos;');
});

test('hash is stable and non-negative', () => {
  assert.equal(hashString('abc'), hashString('abc'));
  assert.ok(hashString('anything') >= 0);
});

test('the data URI is a usable image source', () => {
  const uri = buildTopicCard('Kubernetes pod scheduling', 'Systems');
  assert.match(uri, /^data:image\/svg\+xml;utf8,/);
  assert.doesNotMatch(uri, /[<>"]/, 'the payload must be percent-encoded');
  assert.ok(uri.length < 20000, 'card should stay small enough to inline');
});

test('every subject area renders a motif without throwing', () => {
  for (const [trend, category] of [
    ['Rotating bcrypt hashes', 'Security'],
    ['Postgres replication lag', 'Database'],
    ['LLM inference batching', 'AI Infrastructure'],
    ['Standup notes that work', 'Team'],
  ]) {
    assert.doesNotThrow(() => buildTopicCardSvg(trend, category));
  }
});
