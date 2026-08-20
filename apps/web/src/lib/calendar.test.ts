import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCalendarMonth,
  buildTimeOptions,
  calculateFloatingPosition,
  formatDateLabel,
} from './calendar';

test('builds a six-week Sunday-first calendar grid', () => {
  const days = buildCalendarMonth(2026, 7);

  assert.equal(days.length, 42);
  assert.equal(days[0]?.date, '2026-07-26');
  assert.equal(days[6]?.date, '2026-08-01');
  assert.equal(days[41]?.date, '2026-09-05');
  assert.equal(days[6]?.inCurrentMonth, true);
});

test('formats stored dates without changing their local calendar day', () => {
  assert.equal(formatDateLabel('2026-08-30'), '30-08-2026');
});

test('builds five-minute time choices with two-digit labels', () => {
  assert.deepEqual(buildTimeOptions(5), {
    hours: [
      '00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11',
      '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23',
    ],
    minutes: ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'],
  });
});

test('places a floating picker above its trigger when there is not enough room below', () => {
  assert.deepEqual(
    calculateFloatingPosition(
      { top: 500, bottom: 544, left: 900, width: 200 },
      { width: 1024, height: 700 },
      320,
    ),
    { left: 720, top: 172, width: 288, placement: 'top' },
  );
});

test('places a floating picker below its trigger when space is available', () => {
  assert.deepEqual(
    calculateFloatingPosition(
      { top: 56, bottom: 100, left: 20, width: 300 },
      { width: 1024, height: 800 },
      320,
    ),
    { left: 20, top: 108, width: 300, placement: 'bottom' },
  );
});
