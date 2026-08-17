import { cn } from '@/lib/utils';

/**
 * The SocialFlow mark: a 3×3 dot matrix on a solid tile, with the signal dot
 * carried in red. Monochrome by construction — no gradients to drift.
 *
 * `gradientId` is retained only so existing call sites keep type-checking; the
 * mark no longer needs a per-instance definition.
 */
export function Logo({ className, gradientId }: { className?: string; gradientId?: string }) {
  return (
    <span
      aria-hidden="true"
      data-mark={gradientId}
      className={cn(
        'relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md bg-foreground',
        className,
      )}
    >
      <svg viewBox="0 0 40 40" className="h-full w-full">
        {[
          [12, 12], [20, 12], [28, 12],
          [12, 20], [20, 20], [28, 20],
          [12, 28], [20, 28], [28, 28],
        ].map(([cx, cy], index) => (
          <circle
            key={index}
            cx={cx}
            cy={cy}
            r={index === 4 ? 3.6 : 2.6}
            className={index === 4 ? 'fill-primary' : 'fill-background'}
            opacity={index === 4 ? 1 : index % 2 === 0 ? 0.9 : 0.45}
          />
        ))}
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
          Social<span className="gradient-text">Flow</span>
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
