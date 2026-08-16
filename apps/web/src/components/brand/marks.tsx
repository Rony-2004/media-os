import { cn } from '@/lib/utils';

/**
 * The ConnectUs mark: two nodes joined by a link, set in a gradient tile.
 * `gradientId` keeps multiple instances on one page from colliding.
 */
export function Logo({ className, gradientId = 'cu-mark' }: { className?: string; gradientId?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl shadow-soft',
        className,
      )}
    >
      <svg viewBox="0 0 40 40" className="h-full w-full">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="55%" stopColor="hsl(var(--brand-2))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill={`url(#${gradientId})`} />
        <g stroke="white" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity="0.95">
          <path d="M16.5 23.5 23.5 16.5" />
        </g>
        <circle cx="14" cy="26" r="4.4" fill="white" opacity="0.95" />
        <circle cx="26" cy="14" r="4.4" fill="white" opacity="0.6" />
      </svg>
    </span>
  );
}

/** Wordmark + mark, used in navigation and auth screens. */
export function Wordmark({
  className,
  subtitle,
  gradientId,
}: {
  className?: string;
  subtitle?: string;
  gradientId?: string;
}) {
  return (
    <span className={cn('flex items-center gap-3', className)}>
      <Logo gradientId={gradientId} />
      <span className="min-w-0">
        <span className="block text-[15px] font-bold leading-none tracking-[-0.02em]">
          Connect<span className="gradient-text">Us</span>
        </span>
        {subtitle ? (
          <span className="mt-1 block font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );
}

/** Legacy alias — kept so older imports keep resolving. */
export const NothingMark = Logo;

export function LinkedInMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={cn('h-5 w-5', className)}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45C23.2 24 24 23.23 24 22.27V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

export function XMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={cn('h-5 w-5', className)}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
