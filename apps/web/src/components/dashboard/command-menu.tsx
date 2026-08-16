'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Bot,
  CalendarDays,
  CornerDownLeft,
  FileText,
  Gauge,
  HelpCircle,
  LayoutDashboard,
  Link2,
  MessageCircle,
  Search,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Command = {
  label: string;
  href: string;
  group: string;
  keywords: string;
  icon: typeof LayoutDashboard;
};

const commands: Command[] = [
  { label: 'Dashboard', href: '/dashboard', group: 'Navigate', keywords: 'home overview metrics', icon: LayoutDashboard },
  { label: 'LinkedIn pipeline', href: '/platform/linkedin', group: 'Navigate', keywords: 'platform posts feed', icon: FileText },
  { label: 'AI suggestions', href: '/platform/linkedin?tab=suggestions', group: 'Create', keywords: 'ideas trends writer generate', icon: Sparkles },
  { label: 'Scheduled queue', href: '/platform/linkedin?tab=scheduled', group: 'Create', keywords: 'calendar queue upcoming', icon: CalendarDays },
  { label: 'Published posts', href: '/platform/linkedin?tab=published', group: 'Create', keywords: 'live engagement analytics', icon: BarChart3 },
  { label: 'Drafts', href: '/platform/linkedin?tab=drafts', group: 'Create', keywords: 'unfinished saved', icon: FileText },
  { label: 'Comments & replies', href: '/platform/linkedin?tab=comments', group: 'Create', keywords: 'reply agent inbox', icon: MessageCircle },
  { label: 'New post', href: '/posts/new', group: 'Create', keywords: 'compose write draft', icon: Bot },
  { label: 'Brand voice', href: '/ai-settings', group: 'Configure', keywords: 'tone style ai settings', icon: SlidersHorizontal },
  { label: 'Social accounts', href: '/accounts', group: 'Configure', keywords: 'connect linkedin oauth', icon: Link2 },
  { label: 'Quota & usage', href: '/quota', group: 'Configure', keywords: 'plan limit billing', icon: Gauge },
  { label: 'Settings', href: '/settings', group: 'Configure', keywords: 'profile security account', icon: Settings },
  { label: 'Admin portal', href: '/admin', group: 'Configure', keywords: 'users roles plans', icon: ShieldAlert },
  { label: 'Help centre', href: '/help', group: 'Support', keywords: 'docs faq guide', icon: HelpCircle },
];

export function CommandMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return commands;
    return commands.filter(
      (command) =>
        command.label.toLowerCase().includes(term) || command.keywords.includes(term),
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 10);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  const run = (command: Command) => {
    onClose();
    router.push(command.href);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => (index + 1) % Math.max(results.length, 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (index - 1 + results.length) % Math.max(results.length, 1));
    }
    if (event.key === 'Enter' && results[active]) {
      event.preventDefault();
      run(results[active]);
    }
  };

  let lastGroup = '';

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]">
      <button
        type="button"
        aria-label="Close command menu"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-background/70 backdrop-blur-md"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command menu"
        onKeyDown={onKeyDown}
        className="surface edge-light relative z-10 w-full max-w-xl animate-fade-in-scale overflow-hidden shadow-pop"
      >
        <div className="flex items-center gap-3 border-b border-border/70 px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages and actions…"
            className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
          <kbd className="kbd">ESC</kbd>
        </div>

        <div className="scrollbar-none max-h-[52vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground">
              Nothing matches “{query}”.
            </p>
          ) : (
            results.map((command, index) => {
              const Icon = command.icon;
              const showGroup = command.group !== lastGroup;
              lastGroup = command.group;

              return (
                <div key={command.href + command.label}>
                  {showGroup ? (
                    <p className="px-3 pb-1.5 pt-3 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                      {command.group}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => run(command)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                      index === active
                        ? 'bg-primary/10 text-foreground'
                        : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', index === active && 'text-primary')} />
                    <span className="flex-1 truncate font-medium">{command.label}</span>
                    {index === active ? (
                      <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    ) : null}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
