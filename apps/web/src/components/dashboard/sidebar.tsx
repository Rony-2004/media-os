'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLogout, useSession } from '@/hooks/use-auth';
import { useConnectedAccounts } from '@/hooks/use-connected-accounts';
import {
  BarChart3,
  Bot,
  CalendarDays,
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
  Sparkles,
  SlidersHorizontal,
  X,
} from 'lucide-react';

const primaryItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, locked: false },
  { label: 'Posts', href: '/platform/linkedin?tab=published', icon: FileText, locked: true },
  { label: 'Drafts', href: '/platform/linkedin?tab=drafts', icon: MessageSquareText, locked: true },
  { label: 'Calendar', href: '/platform/linkedin?tab=scheduled', icon: CalendarDays, locked: true },
  { label: 'Analytics', href: '/dashboard#analytics', icon: BarChart3, locked: true },
  { label: 'AI Writer', href: '/platform/linkedin?tab=suggestions', icon: Bot, locked: true },
  { label: 'Brand Voice', href: '/ai-settings', icon: SlidersHorizontal, locked: true },
];

const manageItems = [
  { label: 'Accounts', href: '/accounts', icon: Link2 },
  { label: 'Quota', href: '/quota', icon: Gauge },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const { data: user } = useSession();
  const { data: accounts = [] } = useConnectedAccounts();
  const hasConnectedAccount = accounts.some((account) => account.status === 'active');

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.push('/login');
  };

  const navItem = (
    item: { label: string; href: string; icon: typeof LayoutDashboard; locked?: boolean },
  ) => {
    const isLocked = item.locked && !hasConnectedAccount;
    const isActive =
      pathname === item.href.split('?')[0] ||
      (item.href !== '/dashboard' && pathname.startsWith(item.href.split('?')[0]));
    const Icon = item.icon;

    if (isLocked) {
      return (
        <div
          key={item.label}
          title="Connect a social account to unlock this feature."
          className="flex h-11 w-full cursor-not-allowed items-center justify-between border-l-4 border-transparent px-6 text-xs font-semibold text-muted-foreground/55"
          aria-disabled="true"
        >
          <span className="flex items-center gap-3">
            <Icon className="h-4 w-4" />
            {item.label}
          </span>
          <Lock className="h-3 w-3" />
        </div>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={onClose}
        className={cn(
          'group flex h-11 w-full items-center justify-between border-l-4 px-6 text-xs font-semibold transition-colors',
          isActive
            ? 'border-blue-600 bg-blue-50 font-bold text-blue-600 dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-400'
            : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        )}
      >
        <span className="flex items-center gap-3">
          <Icon className="h-4 w-4" />
          {item.label}
        </span>
        {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" /> : null}
      </Link>
    );
  };

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      ) : null}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[278px] flex-col border-r border-border bg-card transition-transform duration-200 lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:w-64 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-[74px] items-center justify-between border-b px-6">
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">ConnectUs</p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
                Social workspace
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="scrollbar-none flex-1 overflow-y-auto py-3" aria-label="Main navigation">
          <p className="px-6 pb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Workspace
          </p>
          <div className="space-y-0.5">{primaryItems.map(navItem)}</div>
          <p className="px-6 pb-2 pt-6 text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Manage
          </p>
          <div className="space-y-0.5">
            {manageItems.map(navItem)}
            {user?.role === 'ADMIN' || user?.email === 'admin@connectus.dev'
              ? navItem({ label: 'Admin Portal', href: '/admin', icon: ShieldAlert })
              : null}
          </div>
        </nav>

        <div className="space-y-3 border-t border-border bg-muted/20 p-4">
          <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-card p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold">{user?.name || 'User'}</p>
              <p className="truncate text-[10px] text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/help" onClick={onClose} className="product-button-secondary min-h-9 px-2 text-xs">
              <HelpCircle className="h-3.5 w-3.5" /> Help
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={logout.isPending}
              className="product-button min-h-9 border border-rose-500/20 bg-card px-2 text-xs text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
            >
              <LogOut className="h-3.5 w-3.5" /> {logout.isPending ? 'Exiting' : 'Logout'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
