import assert from 'node:assert/strict';
import test from 'node:test';
import { readApiResponse } from './api-response';

test('returns the API JSON payload when the response is JSON', async () => {
  const payload = await readApiResponse(
    new Response(JSON.stringify({ error: { message: 'Invalid email or password' } }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

  assert.deepEqual(payload, { error: { message: 'Invalid email or password' } });
});

test('rejects HTML server responses with a safe user-facing message', async () => {
  await assert.rejects(
    () =>
      readApiResponse(
        new Response('<!DOCTYPE html><html><body>Framework error</body></html>', {
          status: 500,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }),
      ),
    new Error('The server is temporarily unavailable. Please try again.'),
  );
});
