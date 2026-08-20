import test from 'node:test';
import assert from 'node:assert/strict';

test('new post scheduling preserves typed content and produces a scheduled payload', async () => {
  const module = await import('./post-workspace').catch(() => ({}));
  const buildScheduledPostPayload = (
    module as { buildScheduledPostPayload?: (content: string, platform: string, date: string) => unknown }
  ).buildScheduledPostPayload;

  assert.equal(typeof buildScheduledPostPayload, 'function');
  assert.deepEqual(
    buildScheduledPostPayload!(
      '  First line\n\nSecond line  ',
      'linkedin',
      '2026-08-21T14:30:00+05:30',
    ),
    {
      content: 'First line\n\nSecond line',
      platform: 'linkedin',
      status: 'scheduled',
      scheduledAt: '2026-08-21T09:00:00.000Z',
    },
  );
});

test('post updates accept schedule changes but reject arbitrary database fields', async () => {
  const module = await import('./post-workspace').catch(() => ({}));
  const parsePostUpdate = (
    module as { parsePostUpdate?: (input: unknown) => Record<string, unknown> }
  ).parsePostUpdate;

  assert.equal(typeof parsePostUpdate, 'function');
  assert.deepEqual(parsePostUpdate!({ scheduledAt: '2026-08-21T09:00:00.000Z' }), {
    scheduledAt: '2026-08-21T09:00:00.000Z',
  });
  assert.throws(() => parsePostUpdate!({ userId: 'another-user' }));
});

test('separate date and time controls preserve one datetime-local value', async () => {
  const module = await import('./post-workspace').catch(() => ({}));
  const splitScheduleDateTime = (
    module as { splitScheduleDateTime?: (value: string) => { date: string; time: string } }
  ).splitScheduleDateTime;
  const combineScheduleDateTime = (
    module as { combineScheduleDateTime?: (date: string, time: string) => string }
  ).combineScheduleDateTime;

  assert.equal(typeof splitScheduleDateTime, 'function');
  assert.equal(typeof combineScheduleDateTime, 'function');
  assert.deepEqual(splitScheduleDateTime!('2026-08-28T14:30'), {
    date: '2026-08-28',
    time: '14:30',
  });
  assert.equal(combineScheduleDateTime!('2026-08-28', '14:30'), '2026-08-28T14:30');
});
