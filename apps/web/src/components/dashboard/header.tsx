'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, ChevronDown, LogOut, Menu, Search, Settings, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLogout } from '@/hooks/use-auth';
import { ThemeSwitchButton } from '@/components/theme-toggle';
import { CommandMenu } from '@/components/dashboard/command-menu';

interface HeaderProps {
  user: {
    name: string;
    email: string;
    avatar?: string | null;
  };
  onMenuClick: () => void;
}

const titles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/accounts': 'Social accounts',
  '/quota': 'Quota & usage',
  '/settings': 'Settings',
  '/ai-settings': 'Brand voice',
  '/admin': 'Admin portal',
  '/help': 'Help centre',
  '/posts/new': 'Compose',
};

export function Header({ user, onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const [commandOpen, setCommandOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const title =
    titles[pathname] ??
    (pathname.startsWith('/platform/')
      ? `${pathname.split('/')[2]?.replace(/^\w/, (c) => c.toUpperCase())} pipeline`
      : 'Workspace');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [menuOpen]);

  useEffect(() => setMenuOpen(false), [pathname]);

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.push('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-card text-foreground transition-colors hover:border-primary/35 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="min-w-0">
            <p className="hidden font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:block">
              SocialFlow
            </p>
            <h2 className="truncate text-sm font-bold tracking-tight sm:text-[15px]">{title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="group hidden h-9 items-center gap-2.5 rounded-xl border border-border bg-card pl-3 pr-2 text-xs text-muted-foreground transition-all duration-200 hover:border-primary/35 hover:text-foreground md:flex md:w-64 lg:w-72"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 text-left">Search workspace…</span>
            <kbd className="kbd">⌘K</kbd>
          </button>

          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            aria-label="Search"
            className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary md:hidden"
          >
            <Search className="h-4 w-4" />
          </button>

          <ThemeSwitchButton />

          <button
            type="button"
            className="relative grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-destructive ring-2 ring-card" />
          </button>

          <div className="hidden h-6 w-px bg-border sm:block" />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className={cn(
                'flex items-center gap-2 rounded-xl border p-1 pr-1.5 transition-all duration-200 sm:pr-2',
                menuOpen ? 'border-primary/35 bg-muted/60' : 'border-transparent hover:bg-muted/60',
              )}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
              <span className="hidden max-w-36 text-left lg:block">
                <span className="block truncate text-xs font-bold leading-tight">{user.name}</span>
                <span className="block truncate font-mono text-[10px] leading-tight text-muted-foreground">
                  {user.email}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
                  menuOpen && 'rotate-180',
                )}
              />
            </button>

            {menuOpen ? (
              <div
                role="menu"
                className="surface edge-light absolute right-0 top-[calc(100%+0.5rem)] w-60 animate-slide-down overflow-hidden p-1.5 shadow-pop"
              >
                <div className="border-b border-border/70 px-3 py-2.5">
                  <p className="truncate text-xs font-bold">{user.name}</p>
                  <p className="truncate font-mono text-[10px] text-muted-foreground">{user.email}</p>
                </div>

                {[
                  { label: 'Settings', href: '/settings', icon: Settings },
                  { label: 'Brand voice', href: '/ai-settings', icon: Sparkles },
                  { label: 'Social accounts', href: '/accounts', icon: User },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </Link>
                  );
                })}

                <div className="my-1 h-px bg-border" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  disabled={logout.isPending}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {logout.isPending ? 'Signing out…' : 'Log out'}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <CommandMenu open={commandOpen} onClose={() => setCommandOpen(false)} />
    </>
  );
}
