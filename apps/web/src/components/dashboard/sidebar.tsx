'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLogout, useSession } from '@/hooks/use-auth';
import { useConnectedAccounts } from '@/hooks/use-connected-accounts';
import { Logo } from '@/components/brand/marks';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  BarChart3,
  Bot,
  CalendarDays,
  ChevronsLeft,
  FileText,
  Gauge,
  HelpCircle,
  LayoutDashboard,
  Link2,
  Lock,
  LogOut,
  MessageSquareText,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  locked?: boolean;
};

const primaryItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, locked: false },
  { label: 'Posts', href: '/platform/linkedin?tab=published', icon: FileText, locked: true },
  { label: 'Drafts', href: '/platform/linkedin?tab=drafts', icon: MessageSquareText, locked: true },
  { label: 'Calendar', href: '/platform/linkedin?tab=scheduled', icon: CalendarDays, locked: true },
  { label: 'Analytics', href: '/dashboard#analytics', icon: BarChart3, locked: true },
  { label: 'AI Writer', href: '/platform/linkedin?tab=suggestions', icon: Bot, locked: true },
  { label: 'Brand Voice', href: '/ai-settings', icon: SlidersHorizontal, locked: true },
];

const manageItems: NavItem[] = [
  { label: 'Accounts', href: '/accounts', icon: Link2 },
  { label: 'Quota', href: '/quota', icon: Gauge },
  { label: 'Settings', href: '/settings', icon: Settings },
];

const COLLAPSE_KEY = 'connectus:sidebar-collapsed';

export function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const { data: user } = useSession();
  const { data: accounts = [] } = useConnectedAccounts();
  const [collapsed, setCollapsed] = useState(false);

  const hasConnectedAccount = accounts.some((account) => account.status === 'active');

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === '1');
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((previous) => {
      const next = !previous;
      window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      return next;
    });
  };

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.push('/login');
  };

  const renderItem = (item: NavItem) => {
    const isLocked = item.locked && !hasConnectedAccount;
    const base = item.href.split('?')[0];
    const isActive = pathname === base || (base !== '/dashboard' && pathname.startsWith(base));
    const Icon = item.icon;

    if (isLocked) {
      return (
        <div
          key={item.label}
          title="Connect a social account to unlock this feature."
          aria-disabled="true"
          className={cn(
            'group relative flex h-10 cursor-not-allowed items-center gap-3 rounded-xl px-3 text-[13px] font-medium text-muted-foreground/50',
            collapsed && 'justify-center px-0',
          )}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" />
          {!collapsed ? (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              <Lock className="h-3 w-3 shrink-0" />
            </>
          ) : null}
        </div>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={onClose}
        title={collapsed ? item.label : undefined}
        className={cn(
          'group relative flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-all duration-200 ease-spring',
          collapsed && 'justify-center px-0',
          isActive
            ? 'bg-primary/10 font-semibold text-foreground shadow-inset'
            : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
        )}
      >
        {isActive ? (
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-gradient" />
        ) : null}
        <Icon
          className={cn(
            'h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110',
            isActive && 'text-primary',
          )}
        />
        {!collapsed ? <span className="flex-1 truncate">{item.label}</span> : null}
      </Link>
    );
  };

  const sectionLabel = (label: string) =>
    collapsed ? (
      <div className="my-3 h-px bg-border" />
    ) : (
      <p className="px-3 pb-2 pt-6 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
        {label}
      </p>
    );

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 animate-fade-in bg-background/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card/95 backdrop-blur-xl transition-[transform,width] duration-300 ease-spring',
          'lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:translate-x-0',
          collapsed ? 'w-[272px] lg:w-[76px]' : 'w-[272px]',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            'flex h-[68px] shrink-0 items-center border-b border-border/70 px-4',
            collapsed ? 'lg:justify-center lg:px-0' : 'justify-between',
          )}
        >
          <Link href="/dashboard" onClick={onClose} className="flex min-w-0 items-center gap-3">
            <Logo gradientId="sidebar-mark" />
            <span className={cn('min-w-0', collapsed && 'lg:hidden')}>
              <span className="block text-[15px] font-bold leading-none tracking-[-0.02em]">
                Connect<span className="gradient-text">Us</span>
              </span>
              <span className="mt-1 block font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Social OS
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'hidden h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:grid',
              collapsed && 'lg:hidden',
            )}
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="scrollbar-none flex-1 overflow-y-auto px-3 py-3" aria-label="Main navigation">
          {!collapsed ? (
            <p className="px-3 pb-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
              Workspace
            </p>
          ) : null}
          <div className="space-y-1">{primaryItems.map(renderItem)}</div>

          {sectionLabel('Manage')}
          <div className="space-y-1">
            {manageItems.map(renderItem)}
            {user?.role === 'ADMIN' || user?.email === 'admin@connectus.dev'
              ? renderItem({ label: 'Admin Portal', href: '/admin', icon: ShieldAlert })
              : null}
          </div>

          {!collapsed && !hasConnectedAccount ? (
            <div className="relative mt-6 overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full bg-primary/25 blur-2xl" />
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="mt-2.5 text-xs font-bold leading-snug">Unlock the full workspace</p>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                Connect LinkedIn to enable drafting, scheduling, and engagement reads.
              </p>
              <Link
                href="/accounts"
                onClick={onClose}
                className="btn-primary mt-3 h-8 w-full px-3 text-[11px]"
              >
                Connect account
              </Link>
            </div>
          ) : null}
        </nav>

        {/* Footer */}
        <div className="shrink-0 space-y-3 border-t border-border/70 p-3">
          {collapsed ? (
            <div className="hidden flex-col items-center gap-2 lg:flex">
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label="Expand sidebar"
                className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronsLeft className="h-4 w-4 rotate-180" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={logout.isPending}
                aria-label="Log out"
                className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <div className={cn('space-y-3', collapsed && 'lg:hidden')}>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-2.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">{user?.name || 'User'}</p>
                <p className="truncate font-mono text-[10px] text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <ThemeToggle />
              <div className="flex items-center gap-1">
                <Link
                  href="/help"
                  onClick={onClose}
                  aria-label="Help centre"
                  title="Help centre"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <HelpCircle className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={logout.isPending}
                  aria-label="Log out"
                  title="Log out"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
