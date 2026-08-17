'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, MessageCircle, Sparkles, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LinkedInMark } from '@/components/brand/marks';

const tabs = ['Suggestions', 'Queue', 'Published'] as const;

const suggestions = [
  { trend: 'Postgres connection pooling', category: 'Backend', velocity: '+240%' },
  { trend: 'Shipping AI features safely', category: 'Practice', velocity: '+118%' },
  { trend: 'The cost of a rewrite', category: 'Opinion', velocity: '+96%' },
];

const bars = [38, 52, 44, 68, 57, 82, 71, 94, 78, 88];

/**
 * A stylised product shot for the landing hero. Everything is CSS — no
 * screenshot to go stale when the real UI moves.
 */
export function AppPreview() {
  const [tab, setTab] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTab((current) => (current + 1) % tabs.length), 3200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="surface edge-light overflow-hidden rounded-3xl shadow-pop">
      {/* Window chrome */}
      <div className="flex items-center gap-3 border-b border-border/70 bg-muted/40 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
        </div>
        <div className="mx-auto flex items-center gap-2 rounded-md border border-border bg-background/60 px-3 py-1 font-mono text-[10px] text-muted-foreground">
          app.socialflow.dev/platform/linkedin
        </div>
      </div>

      <div className="grid gap-0 sm:grid-cols-[168px_1fr]">
        {/* Mini sidebar */}
        <div className="hidden flex-col gap-1 border-r border-border/70 bg-muted/20 p-3 sm:flex">
          {['Dashboard', 'Posts', 'Calendar', 'Analytics', 'AI Writer', 'Brand Voice'].map(
            (label, index) => (
              <div
                key={label}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[10px] font-medium',
                  index === 4 ? 'bg-primary/10 text-foreground' : 'text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    index === 4 ? 'bg-primary' : 'bg-muted-foreground/40',
                  )}
                />
                {label}
              </div>
            ),
          )}
        </div>

        {/* Body */}
        <div className="min-w-0 space-y-3.5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className="grid h-8 w-8 place-items-center rounded-lg text-white"
                style={{ backgroundColor: '#0A66C2' }}
              >
                <LinkedInMark className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold leading-tight">LinkedIn pipeline</p>
                <p className="font-mono text-[9px] text-muted-foreground">connected · synced 2m ago</p>
              </div>
            </div>
            <span className="chip border-success/30 bg-success/10 text-[9px] text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Live
            </span>
          </div>

          {/* Metric row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Published', value: '128', icon: CheckCircle2, tone: 'text-success' },
              { label: 'Queued', value: '6', icon: Clock, tone: 'text-warning' },
              { label: 'Replies', value: '31', icon: MessageCircle, tone: 'text-info' },
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="rounded-lg border border-border bg-muted/30 p-2.5">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[9px] font-medium">{metric.label}</span>
                    <Icon className={cn('h-3 w-3', metric.tone)} />
                  </div>
                  <p className="mt-1 text-base font-bold tabular-nums">{metric.value}</p>
                </div>
              );
            })}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
            {tabs.map((label, index) => (
              <span
                key={label}
                className={cn(
                  'flex-1 rounded-md px-2 py-1 text-center text-[9px] font-semibold transition-all duration-500',
                  index === tab ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Rotating panel */}
          <div className="min-h-[132px]">
            {tab === 0 ? (
              <div key="s" className="space-y-2">
                {suggestions.map((item, index) => (
                  <div
                    key={item.trend}
                    className="flex animate-fade-in items-center gap-2.5 rounded-lg border border-border bg-muted/20 p-2.5"
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-semibold">{item.trend}</p>
                      <p className="font-mono text-[9px] text-muted-foreground">
                        {item.category} · {item.velocity}
                      </p>
                    </div>
                    <span className="chip border-success/25 bg-success/10 px-2 py-0.5 text-[9px] text-success">
                      Approve
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {tab === 1 ? (
              <div key="q" className="space-y-2">
                {['Tue 09:00', 'Wed 14:30', 'Fri 08:15'].map((slot, index) => (
                  <div
                    key={slot}
                    className="animate-fade-in rounded-lg border border-border bg-muted/20 p-2.5"
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="chip border-warning/25 bg-warning/10 px-2 py-0.5 text-[9px] text-warning">
                        Scheduled
                      </span>
                      <span className="font-mono text-[9px] text-muted-foreground">{slot}</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <span className="block h-1.5 w-full rounded-full bg-muted" />
                      <span className="block h-1.5 w-4/5 rounded-full bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {tab === 2 ? (
              <div key="p" className="animate-fade-in space-y-3 rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex items-end justify-between gap-1">
                  {bars.map((height, index) => (
                    <span
                      key={index}
                      className="w-full origin-bottom animate-bar-grow rounded-t-sm bg-brand-gradient"
                      style={{ height: `${height * 0.6}px`, animationDelay: `${index * 45}ms` }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-4 border-t border-border pt-2 text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3 text-success" /> 1,284 reactions
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3 text-info" /> 216 comments
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
