'use client';

import { useEffect, useState } from 'react';
import {
  FileSearch,
  Image as ImageIcon,
  ListChecks,
  PenLine,
  Radar,
  Sparkles,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/product';
import { advanceLoadingStage } from '@/lib/loading-stages';
import { cn } from '@/lib/utils';

const STAGES = [
  {
    label: 'Finding high-signal engineering topics',
    detail: 'Scanning for useful ideas that match your focus areas.',
    icon: Radar,
  },
  {
    label: 'Comparing the strongest content angles',
    detail: 'Filtering repetitive ideas and selecting practical perspectives.',
    icon: FileSearch,
  },
  {
    label: 'Drafting LinkedIn posts',
    detail: 'Applying your tone, preferred length, and writing style.',
    icon: PenLine,
  },
  {
    label: 'Designing post visuals',
    detail: 'Building a clear technical image for each selected topic.',
    icon: ImageIcon,
  },
  {
    label: 'Preparing suggestions for review',
    detail: 'Running final content and scheduling checks.',
    icon: ListChecks,
  },
] as const;

export function AiGenerationLoader() {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStageIndex((current) => advanceLoadingStage(current, STAGES.length));
    }, 1800);
    return () => window.clearInterval(interval);
  }, []);

  const stage = STAGES[stageIndex];
  const StageIcon = stage.icon;

  return (
    <div role="status" aria-live="polite" aria-label={stage.label} className="space-y-3">
      <div className="surface relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute inset-y-0 -left-1/3 w-1/3 animate-shimmer bg-primary/10 motion-reduce:animate-none" />
        </div>

        <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
            <div className="absolute inset-[-5px] animate-pulse rounded-2xl border border-primary/15 motion-reduce:animate-none" />
            <StageIcon className="relative h-6 w-6 animate-pulse motion-reduce:animate-none" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-primary">
              <Sparkles className="h-3 w-3" />
              AI research in progress
            </div>
            <div key={stage.label} className="animate-fade-in">
              <h3 className="text-sm font-bold tracking-tight sm:text-base">{stage.label}</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{stage.detail}</p>
            </div>
          </div>

          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
            {String(stageIndex + 1).padStart(2, '0')} / {String(STAGES.length).padStart(2, '0')}
          </span>
        </div>

        <div className="relative mt-6 grid grid-cols-5 gap-1.5" aria-hidden="true">
          {STAGES.map((item, index) => (
            <span
              key={item.label}
              className={cn(
                'h-1 rounded-full transition-colors duration-500',
                index === stageIndex
                  ? 'bg-primary'
                  : index < stageIndex
                    ? 'bg-primary/35'
                    : 'bg-muted',
              )}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-3 opacity-55 sm:grid-cols-2" aria-hidden="true">
        {[0, 1].map((item) => (
          <div key={item} className="surface space-y-3 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-2.5 w-2/3" />
                <Skeleton className="h-2 w-1/3" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
