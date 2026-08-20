'use client';

import { useQuery } from '@tanstack/react-query';
import { Clock, Info, TrendingUp } from 'lucide-react';
import { Panel, ProgressBar, SectionTitle, StatusBadge } from '@/components/ui/product';
import { cn } from '@/lib/utils';

interface TraitStat {
  value: string;
  samples: number;
  average: number;
  lift: number;
}

interface GrowthInsightsResponse {
  sampleSize: number;
  baseline: number | null;
  confident: boolean;
  reason: string | null;
  summary: string;
  topics: TraitStat[];
  lengths: TraitStat[];
  hooks: TraitStat[];
  hashtags: TraitStat[];
  closingQuestion: TraitStat[];
  bestHours: number[];
}

const MIN_POSTS = 5;

function TraitRow({ stat }: { stat: TraitStat }) {
  const positive = stat.lift >= 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 truncate text-xs font-medium">{stat.value}</span>
      <div className="min-w-0 flex-1">
        <ProgressBar
          value={Math.min(Math.abs(stat.lift) * 100, 100)}
          tone={positive ? 'success' : 'danger'}
          className="h-1.5"
        />
      </div>
      <span
        className={cn(
          'w-14 shrink-0 text-right font-mono text-[11px] font-bold tabular-nums',
          positive ? 'text-success' : 'text-destructive',
        )}
      >
        {positive ? '+' : ''}
        {Math.round(stat.lift * 100)}%
      </span>
      <span className="w-10 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
        n={stat.samples}
      </span>
    </div>
  );
}

function Group({ title, stats }: { title: string; stats: TraitStat[] }) {
  if (stats.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1.5">
        {stats.map((stat) => (
          <TraitRow key={stat.value} stat={stat} />
        ))}
      </div>
    </div>
  );
}

export function GrowthPanel() {
  const { data, isLoading } = useQuery<GrowthInsightsResponse | null>({
    queryKey: ['growth-insights'],
    queryFn: async () => {
      const res = await fetch('/api/growth/insights', { credentials: 'include' });
      if (!res.ok) return null;
      return (await res.json()).data;
    },
  });

  if (isLoading || !data) return null;

  return (
    <section className="space-y-4">
      <SectionTitle
        icon={<TrendingUp className="h-3.5 w-3.5" />}
        action={
          <StatusBadge tone={data.confident ? 'success' : 'neutral'} dot={data.confident}>
            {data.confident ? 'Learning active' : 'Gathering data'}
          </StatusBadge>
        }
      >
        What is working
      </SectionTitle>

      <Panel className="space-y-5 p-5">
        <p className="text-sm leading-6">{data.summary}</p>

        {!data.confident ? (
          <div className="space-y-2">
            <ProgressBar value={(data.sampleSize / MIN_POSTS) * 100} className="h-1.5" />
            <p className="font-mono text-[10px] text-muted-foreground">
              {data.sampleSize} / {MIN_POSTS} posts with verified engagement
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <Group title="Opening style" stats={data.hooks} />
              <Group title="Topic" stats={data.topics} />
              <Group title="Length" stats={data.lengths} />
              <Group title="Hashtags" stats={data.hashtags} />
            </div>

            {data.bestHours.length > 0 ? (
              <div className="flex items-center gap-2 border-t border-border/70 pt-4">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">
                  Drafts are now scheduled for{' '}
                  <strong className="font-semibold text-foreground">
                    {data.bestHours.map((h) => `${String(h).padStart(2, '0')}:00`).join(', ')}
                  </strong>{' '}
                  — the hours that have performed for you.
                </span>
              </div>
            ) : null}
          </>
        )}

        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <p className="text-[11px] leading-5 text-muted-foreground">
            Ranked by reactions + comments. LinkedIn does not expose impressions to this app, so
            reach is approximated rather than measured. Patterns are only shown once a trait has at
            least 3 posts behind it.
          </p>
        </div>
      </Panel>
    </section>
  );
}
