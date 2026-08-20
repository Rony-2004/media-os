import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('uses app UI for delete confirmation, calendar selection, and new-post AI polish', async () => {
  const source = await readFile(new URL('./page.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /window\.confirm/);
  assert.match(source, /<DatePicker/);
  assert.match(source, /buildNewPostPolishRequest/);
});
