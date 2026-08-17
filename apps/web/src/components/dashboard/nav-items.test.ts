import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adminItem,
  isNavItemActive,
  manageItems,
  primaryItems,
  resolveActiveTab,
} from './nav-items';

const allItems = [...primaryItems, ...manageItems, adminItem];

function activeLabelsFor(pathname: string, tabParam: string | null = null) {
  const activeTab = resolveActiveTab(pathname, tabParam);
  return allItems.filter((item) => isNavItemActive(item, pathname, activeTab)).map((i) => i.label);
}

test('only the matching tab highlights on a shared platform route', () => {
  assert.deepEqual(activeLabelsFor('/platform/linkedin', 'published'), ['Posts']);
  assert.deepEqual(activeLabelsFor('/platform/linkedin', 'drafts'), ['Drafts']);
  assert.deepEqual(activeLabelsFor('/platform/linkedin', 'scheduled'), ['Calendar']);
  assert.deepEqual(activeLabelsFor('/platform/linkedin', 'suggestions'), ['AI Writer']);
});

test('a bare platform URL highlights the tab the page actually opens on', () => {
  assert.deepEqual(activeLabelsFor('/platform/linkedin'), ['AI Writer']);
});

test('at most one item is ever active across every route', () => {
  const locations: [string, string | null][] = [
    ['/dashboard', null],
    ['/platform/linkedin', null],
    ['/platform/linkedin', 'published'],
    ['/platform/linkedin', 'drafts'],
    ['/platform/linkedin', 'scheduled'],
    ['/platform/linkedin', 'comments'],
    ['/ai-settings', null],
    ['/accounts', null],
    ['/quota', null],
    ['/settings', null],
    ['/admin', null],
  ];

  for (const [pathname, tab] of locations) {
    const active = activeLabelsFor(pathname, tab);
    assert.ok(active.length <= 1, `${pathname}?tab=${tab} highlighted ${active.length}: ${active.join(', ')}`);
  }
});

test('in-page anchors never claim the active state', () => {
  // Analytics points at /dashboard#analytics; Dashboard owns that route.
  assert.deepEqual(activeLabelsFor('/dashboard'), ['Dashboard']);
});

test('a tab with no sidebar entry leaves the group unhighlighted', () => {
  assert.deepEqual(activeLabelsFor('/platform/linkedin', 'comments'), []);
});

test('unrelated routes do not highlight by prefix', () => {
  assert.deepEqual(activeLabelsFor('/accounts'), ['Accounts']);
  assert.equal(isNavItemActive(adminItem, '/administration', null), false);
});
