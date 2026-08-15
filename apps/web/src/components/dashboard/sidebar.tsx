'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLogout, useSession } from '@/hooks/use-auth';
import {
  LayoutDashboard,
  Link2,
  Gauge,
  Settings,
  HelpCircle,
  LogOut,
  BrainCircuit,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard',   href: '/dashboard',    icon: LayoutDashboard },
  { label: 'AI Settings', href: '/ai-settings',  icon: BrainCircuit    },
  { label: 'Accounts',    href: '/accounts',     icon: Link2           },
  { label: 'Quota',       href: '/quota',        icon: Gauge           },
  { label: 'Settings',    href: '/settings',     icon: Settings        },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const { data: user } = useSession();

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.push('/login');
  };

  return (
    <aside className="w-64 border-r bg-card flex flex-col h-screen sticky top-0 shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="px-6 py-5 border-b flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              AI Social OS
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Enterprise AI
            </span>
          </div>
        </Link>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80">
          v1.0
        </span>
      </div>

      {/* Edge-to-Edge Rectangular Navigation */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto w-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group w-full flex items-center justify-between px-6 py-3 text-xs font-semibold rounded-none transition-all duration-150 border-l-4',
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-600 font-bold'
                  : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
            >
              <div className="flex items-center gap-3.5">
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground group-hover:text-foreground')} />
                <span>{item.label}</span>
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer User & Actions */}
      <div className="p-4 border-t bg-muted/20 space-y-3">
        {user && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/80">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate leading-tight">{user.name || 'User'}</p>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{user.email || 'user@example.com'}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          <Link
            href="/help"
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors font-medium border border-border/60 bg-card"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Help</span>
          </Link>
          <button
            onClick={handleLogout}
            disabled={logout.isPending}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50 font-medium border border-rose-500/20 bg-card"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{logout.isPending ? 'Exit...' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
