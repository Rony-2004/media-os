'use client';

import { Bell, Menu, Search } from 'lucide-react';

interface HeaderProps {
  user: {
    name: string;
    email: string;
    avatar?: string | null;
  };
  onMenuClick: () => void;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>
        <label className="relative hidden w-72 md:block">
          <span className="sr-only">Search workspace</span>
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search workspace"
            className="product-input h-9 py-1.5 pl-9 font-mono text-xs"
          />
        </label>
        <span className="text-xs font-bold text-blue-600 md:hidden">Workspace</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:border-blue-300 hover:text-blue-600"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
        </button>
        <div className="hidden h-6 w-px bg-border sm:block" />
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="hidden max-w-48 text-right md:block">
            <p className="truncate text-xs font-bold">{user.name}</p>
            <p className="truncate font-mono text-[10px] text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
