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

test('the platform route highlights exactly one item, whatever the tab', () => {
  // The nav now carries a single entry for the whole platform workspace, so
  // every tab resolves to it rather than lighting up several siblings.
  for (const tab of [null, 'published', 'drafts', 'scheduled', 'suggestions', 'comments']) {
    assert.deepEqual(activeLabelsFor('/platform/linkedin', tab), ['Posts'], `tab=${tab}`);
  }
});

test('matchTab still discriminates when an item declares one', () => {
  // No shipped item uses matchTab today, but the mechanism is what stops a
  // future tab-per-item nav from highlighting all of them at once.
  const draftsItem = { ...primaryItems[1], label: 'Drafts', matchTab: 'drafts' };
  assert.equal(isNavItemActive(draftsItem, '/platform/linkedin', 'drafts'), true);
  assert.equal(isNavItemActive(draftsItem, '/platform/linkedin', 'published'), false);
  assert.equal(isNavItemActive(draftsItem, '/platform/linkedin', null), false);
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

test('an unknown tab still resolves to the platform item', () => {
  assert.deepEqual(activeLabelsFor('/platform/linkedin', 'not-a-real-tab'), ['Posts']);
});

test('unrelated routes do not highlight by prefix', () => {
  assert.deepEqual(activeLabelsFor('/accounts'), ['Accounts']);
  assert.equal(isNavItemActive(adminItem, '/administration', null), false);
});
