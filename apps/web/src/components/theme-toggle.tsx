'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

const options = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

/** Segmented light / dark / system switch. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/50 p-0.5',
        className,
      )}
      role="radiogroup"
      aria-label="Colour theme"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = mounted && theme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${option.label} theme`}
            title={`${option.label} theme`}
            onClick={() => setTheme(option.value)}
            className={cn(
              'grid h-7 w-7 place-items-center rounded-full transition-all duration-200 ease-spring',
              isActive
                ? 'bg-card text-primary shadow-soft'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}

/** Single-button variant that flips between light and dark. */
export function ThemeSwitchButton({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cn(
        'relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl border border-border bg-card text-muted-foreground transition-all duration-200 hover:border-primary/35 hover:text-primary',
        className,
      )}
    >
      <Sun
        className={cn(
          'absolute h-4 w-4 transition-all duration-300 ease-spring',
          isDark ? 'translate-y-6 rotate-90 opacity-0' : 'translate-y-0 rotate-0 opacity-100',
        )}
      />
      <Moon
        className={cn(
          'absolute h-4 w-4 transition-all duration-300 ease-spring',
          isDark ? 'translate-y-0 rotate-0 opacity-100' : '-translate-y-6 -rotate-90 opacity-0',
        )}
      />
    </button>
  );
}
