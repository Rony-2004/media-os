import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildNewPostPolishRequest,
  buildSuggestionPolishPrompt,
  polishSuggestionRequestSchema,
} from './suggestion-polish';

test('accepts a bounded polish request and includes the user instruction verbatim', () => {
  const request = polishSuggestionRequestSchema.parse({
    action: 'polish',
    suggestion: {
      trend: 'Designing idempotent APIs',
      content: 'Retries can create duplicate payments.',
    },
    prompt: 'Make the opening sharper and add one practical example.',
  });

  const result = buildSuggestionPolishPrompt(request);

  assert.match(result, /Make the opening sharper and add one practical example\./);
  assert.match(result, /Retries can create duplicate payments\./);
  assert.match(result, /Return only the revised post text/i);
});

test('rejects an empty polish instruction', () => {
  const result = polishSuggestionRequestSchema.safeParse({
    action: 'polish',
    suggestion: { trend: 'API design', content: 'Original post.' },
    prompt: '   ',
  });

  assert.equal(result.success, false);
});

test('builds a real AI polish request for a user-written new post', () => {
  const request = buildNewPostPolishRequest('  A useful draft.  ');

  assert.equal(request.action, 'polish');
  assert.equal(request.suggestion.content, 'A useful draft.');
  assert.match(request.prompt, /clarity/i);
  assert.equal(polishSuggestionRequestSchema.safeParse(request).success, true);
});
