import {
  FileText,
  Gauge,
  LayoutDashboard,
  Link2,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  locked?: boolean;
  /**
   * Route this item highlights on. Omit for in-page anchors, which have no
   * distinct route of their own and so never own the active state.
   */
  matchPath?: string;
  /**
   * For routes that multiplex on `?tab=`, the tab this item owns. Several
   * items share `/platform/linkedin`; without this they would all light up
   * together.
   */
  matchTab?: string;
};

export const primaryItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, locked: false, matchPath: '/dashboard' },
  { label: 'Posts', href: '/platform/linkedin', icon: FileText, locked: true, matchPath: '/platform/linkedin' },
  { label: 'Brand Voice', href: '/ai-settings', icon: SlidersHorizontal, locked: true, matchPath: '/ai-settings' },
];

export const manageItems: NavItem[] = [
  { label: 'Accounts', href: '/accounts', icon: Link2, matchPath: '/accounts' },
  { label: 'Quota', href: '/quota', icon: Gauge, matchPath: '/quota' },
  { label: 'Settings', href: '/settings', icon: Settings, matchPath: '/settings' },
];

export const adminItem: NavItem = {
  label: 'Admin Portal',
  href: '/admin',
  icon: ShieldAlert,
  matchPath: '/admin',
};

/**
 * The platform workspace defaults to the suggestions tab when the URL carries
 * no `?tab=`, so resolve that here rather than leaving a bare `/platform/*`
 * URL with nothing highlighted.
 */
export function resolveActiveTab(pathname: string, tabParam: string | null): string | null {
  if (tabParam) return tabParam;
  return pathname.startsWith('/platform/') ? 'suggestions' : null;
}

/** Exactly one item may be active for a given location. */
export function isNavItemActive(item: NavItem, pathname: string, activeTab: string | null): boolean {
  if (!item.matchPath) return false;
  const onPath = pathname === item.matchPath || pathname.startsWith(`${item.matchPath}/`);
  if (!onPath) return false;
  return item.matchTab ? activeTab === item.matchTab : true;
}
