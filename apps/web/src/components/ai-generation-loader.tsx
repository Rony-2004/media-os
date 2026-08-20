'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Loading state for suggestion generation.
 *
 * No staged checklist: the route reports no intermediate progress, so any
 * step-by-step display would be invented. This shows the one true signal —
 * elapsed time — over placeholders shaped like the rows they become.
 */
export function AiGenerationLoader({ count = 3 }: { count?: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const clock = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(clock);
  }, []);

  return (
    <div role="status" aria-live="polite" aria-label="Generating suggestions" className="space-y-2">
      <div className="flex items-center gap-2.5 px-1 pb-1">
        <Sparkles className="h-3.5 w-3.5 shrink-0 animate-pulse text-primary motion-reduce:animate-none" />
        <span className="text-xs font-medium text-muted-foreground">
          Writing drafts in your voice
        </span>
        <span className="ml-auto font-mono text-[10px] tabular-nums text-muted-foreground/70">
          {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
        </span>
      </div>

      {Array.from({ length: count }).map((_, row) => (
        <div key={row} className="surface overflow-hidden p-4" aria-hidden="true">
          <div className="flex items-start gap-3">
            <div className="skeleton mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm" />
            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="skeleton h-3 w-2/5" />
                <div className="skeleton h-4 w-20 rounded" />
              </div>
              <div className="skeleton h-2 w-full" />
              <div className="skeleton h-2 w-3/4" />
            </div>
            <div className="skeleton hidden h-7 w-24 shrink-0 rounded sm:block" />
          </div>
        </div>
      ))}
    </div>
  );
}
