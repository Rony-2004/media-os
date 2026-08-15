'use client';

import { Bell, Search } from 'lucide-react';

interface HeaderProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Search Input */}
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search posts, topics..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-muted/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary/40 focus:bg-background transition-all"
          />
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Quick Notification */}
        <button className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative border border-border/50">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-blue-600" />
        </button>

        <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="text-right hidden md:block">
            <p className="text-xs font-semibold leading-tight text-foreground">{user.name}</p>
            <p className="text-[10px] text-muted-foreground font-normal">{user.email}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
