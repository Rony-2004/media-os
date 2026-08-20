import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('typing in a modal does not rerun the focus effect when onClose identity changes', async () => {
  const source = await readFile(new URL('./modal.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /\[open, onClose\]/);
  assert.match(source, /onCloseRef\.current\(\)/);
  assert.match(source, /contains\(document\.activeElement\)/);
});
