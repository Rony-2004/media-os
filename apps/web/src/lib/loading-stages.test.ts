import assert from 'node:assert/strict';
import test from 'node:test';

import { advanceLoadingStage } from './loading-stages';

test('advances through AI loading stages and wraps to the beginning', () => {
  assert.equal(advanceLoadingStage(0, 5), 1);
  assert.equal(advanceLoadingStage(3, 5), 4);
  assert.equal(advanceLoadingStage(4, 5), 0);
});

test('keeps the first stage when no stages are available', () => {
  assert.equal(advanceLoadingStage(2, 0), 0);
});
