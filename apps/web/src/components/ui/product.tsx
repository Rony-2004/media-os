import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

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
    <header className={cn('flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0 max-w-3xl">
        {eyebrow ? <p className="dot-label mb-3">{eyebrow}</p> : null}
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Panel({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('product-panel rounded-xl', className)} {...props}>
      {children}
    </div>
  );
}

const statusTone = {
  neutral: 'border-border bg-muted text-muted-foreground',
  success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  warning: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  danger: 'border-destructive/25 bg-destructive/10 text-destructive',
  dark: 'border-primary/20 bg-primary text-primary-foreground',
} as const;

export function StatusBadge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof statusTone;
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
      {children}
    </span>
  );
}

export function InlineNotice({
  title,
  children,
  tone = 'neutral',
  icon,
  className,
}: {
  title: string;
  children?: ReactNode;
  tone?: 'neutral' | 'warning' | 'danger' | 'success';
  icon?: ReactNode;
  className?: string;
}) {
  const toneClass = {
    neutral: 'border-border bg-muted/50',
    warning: 'border-amber-500/25 bg-amber-500/10',
    danger: 'border-destructive/25 bg-destructive/10',
    success: 'border-emerald-500/25 bg-emerald-500/10',
  }[tone];

  return (
    <div className={cn('flex items-start gap-3 rounded-xl border p-4', toneClass, className)} role="status">
      {icon ? <div className="mt-0.5 shrink-0">{icon}</div> : null}
      <div className="min-w-0">
        <p className="text-sm font-bold">{title}</p>
        {children ? <div className="mt-1 text-xs leading-5 text-muted-foreground">{children}</div> : null}
      </div>
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
    <Panel className={cn('flex min-h-64 flex-col items-center justify-center p-8 text-center', className)}>
      {icon ? <div className="mb-4 text-muted-foreground">{icon}</div> : null}
      <h2 className="text-base font-bold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Panel>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <Panel className={cn('min-w-0 p-4 sm:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          {label}
        </p>
        {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      </div>
      <div className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{value}</div>
      {hint ? <div className="mt-2 text-xs text-muted-foreground">{hint}</div> : null}
    </Panel>
  );
}
