'use client';

import type { ComponentType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
  icon?: ComponentType<{ className?: string }>;
}

/**
 * Scrollable tab bar. The active tab carries a filled pill so the current
 * position stays readable when the bar overflows on narrow screens.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'scrollbar-none flex gap-1 overflow-x-auto rounded-2xl border border-border bg-muted/40 p-1.5',
        className,
      )}
      role="tablist"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === value;

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={cn(
              'group relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 ease-spring',
              isActive
                ? 'bg-card text-foreground shadow-soft'
                : 'text-muted-foreground hover:bg-card/60 hover:text-foreground',
            )}
          >
            {Icon ? (
              <Icon className={cn('h-4 w-4 transition-colors', isActive ? 'text-primary' : '')} />
            ) : null}
            <span>{item.label}</span>
            {typeof item.count === 'number' ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums transition-colors',
                  isActive ? 'bg-primary/[0.12] text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('animate-fade-in', className)}>{children}</div>;
}
