import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/* ── Page chrome ─────────────────────────────────────────────────────────── */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'flex animate-fade-in flex-col gap-5 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 max-w-3xl">
        {eyebrow ? <p className="dot-label mb-3">{eyebrow}</p> : null}
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.03em] sm:text-[32px]">{title}</h1>
        {description ? (
          <p className="mt-2.5 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function SectionTitle({
  children,
  icon,
  action,
  className,
}: {
  children: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <h2 className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        {icon ? <span className="text-primary">{icon}</span> : null}
        {children}
      </h2>
      {action}
    </div>
  );
}

/* ── Surfaces ────────────────────────────────────────────────────────────── */

export function Panel({
  className,
  children,
  interactive,
  glow,
  ...props
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean; glow?: boolean }) {
  return (
    <div
      className={cn(
        'surface edge-light',
        interactive && 'transition-all duration-300 ease-spring hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift',
        glow && 'shadow-glow',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Panel with a padded, hairline-separated header strip. */
export function PanelSection({
  title,
  icon,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  icon?: ReactNode;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Panel className={cn('overflow-hidden', className)}>
      <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-muted/25 px-5 py-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight">
            {icon ? <span className="text-primary">{icon}</span> : null}
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </Panel>
  );
}

/* ── Status ──────────────────────────────────────────────────────────────── */

const statusTone = {
  neutral: 'border-border bg-muted text-muted-foreground',
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  danger: 'border-destructive/30 bg-destructive/10 text-destructive',
  info: 'border-info/30 bg-info/10 text-info',
  primary: 'border-primary/30 bg-primary/10 text-primary',
  dark: 'border-transparent bg-foreground text-background',
} as const;

export type StatusTone = keyof typeof statusTone;

export function StatusBadge({
  children,
  tone = 'neutral',
  dot,
  className,
}: {
  children: ReactNode;
  tone?: StatusTone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]',
        statusTone[tone],
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

/** Green dot + label, with a soft pulse when live. */
export function LiveDot({ live = true, label }: { live?: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          live ? 'signal-pulse bg-success' : 'bg-warning',
        )}
      />
      {label}
    </span>
  );
}

export function InlineNotice({
  title,
  children,
  tone = 'neutral',
  icon,
  action,
  className,
}: {
  title: string;
  children?: ReactNode;
  tone?: 'neutral' | 'warning' | 'danger' | 'success' | 'info';
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const toneClass = {
    neutral: 'border-border bg-muted/50 text-foreground',
    warning: 'border-warning/30 bg-warning/10 text-warning',
    danger: 'border-destructive/30 bg-destructive/10 text-destructive',
    success: 'border-success/30 bg-success/10 text-success',
    info: 'border-info/30 bg-info/10 text-info',
  }[tone];

  return (
    <div
      className={cn(
        'flex animate-fade-in items-start gap-3 rounded-xl border p-4',
        toneClass,
        className,
      )}
      role="status"
    >
      {icon ? <div className="mt-0.5 shrink-0">{icon}</div> : null}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{title}</p>
        {children ? (
          <div className="mt-1 text-xs leading-5 text-muted-foreground">{children}</div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Panel
      className={cn(
        'flex min-h-72 flex-col items-center justify-center overflow-hidden p-10 text-center',
        className,
      )}
    >
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-40 mask-fade-b" />
      {icon ? (
        <div className="relative mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-glow">
          {icon}
        </div>
      ) : null}
      <h2 className="relative text-base font-bold tracking-tight">{title}</h2>
      <p className="relative mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="relative mt-6 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </Panel>
  );
}

/* ── Metrics ─────────────────────────────────────────────────────────────── */

const accentRing = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  info: 'text-info',
  danger: 'text-destructive',
  muted: 'text-muted-foreground',
} as const;

export function MetricCard({
  label,
  value,
  hint,
  icon,
  accent = 'primary',
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  accent?: keyof typeof accentRing;
  className?: string;
}) {
  return (
    <Panel
      interactive
      className={cn('group min-w-0 overflow-hidden p-5', className)}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-40"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent 70%)' }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          {label}
        </p>
        {icon ? (
          <div
            className={cn(
              'grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted/70 transition-transform duration-300 group-hover:scale-110',
              accentRing[accent],
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
      <div className="relative mt-4 text-3xl font-bold tracking-[-0.03em] tabular-nums">{value}</div>
      {hint ? <div className="relative mt-2 text-[11px] leading-5 text-muted-foreground">{hint}</div> : null}
    </Panel>
  );
}

/* ── Progress ────────────────────────────────────────────────────────────── */

export function ProgressBar({
  value,
  tone = 'primary',
  className,
}: {
  value: number;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}) {
  const fill = {
    primary: '[background-image:linear-gradient(90deg,hsl(var(--primary)),hsl(var(--brand-2)))]',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-destructive',
  }[tone];

  return (
    <div
      className={cn('h-2.5 w-full overflow-hidden rounded-full border border-border bg-muted', className)}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-700 ease-spring', fill)}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}

/* ── Loading ─────────────────────────────────────────────────────────────── */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="surface space-y-3 p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-2.5 w-1/5" />
            </div>
          </div>
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  );
}
