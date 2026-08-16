'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarClock, FileCheck2, Gauge, Info, Link2, Sparkles } from 'lucide-react';
import { useSession } from '@/hooks/use-auth';
import { useConnectedAccounts } from '@/hooks/use-connected-accounts';
import { ButtonLink } from '@/components/ui/button';
import {
  MetricCard,
  PageHeader,
  Panel,
  ProgressBar,
  StatusBadge,
} from '@/components/ui/product';

interface QuotaPost {
  status: string;
  publishedAt: string | null;
}

export default function QuotaPage() {
  const { data: user } = useSession();
  const { data: accounts = [] } = useConnectedAccounts();
  const { data: posts = [] } = useQuery<QuotaPost[]>({
    queryKey: ['posts', 'quota'],
    queryFn: async () => {
      const response = await fetch('/api/posts', { credentials: 'include' });
      if (!response.ok) return [];
      return (await response.json()).data ?? [];
    },
  });

  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const publishedThisWeek = posts.filter(
    (post) =>
      post.status === 'published' &&
      post.publishedAt &&
      new Date(post.publishedAt).getTime() >= weekStart,
  ).length;
  const scheduled = posts.filter((post) => post.status === 'scheduled').length;
  const weeklyLimit = user?.weeklyPostLimit ?? 0;
  const remaining = Math.max(weeklyLimit - publishedThisWeek, 0);
  const usage = weeklyLimit > 0 ? Math.min((publishedThisWeek / weeklyLimit) * 100, 100) : 0;
  const tone = usage >= 100 ? 'danger' : usage >= 75 ? 'warning' : 'primary';

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <PageHeader
        eyebrow="Plan & usage"
        title="Quota"
        description="A clear view of the limits currently enforced by your ConnectUs plan."
        actions={<StatusBadge tone="dark">{user?.plan || 'FREE'} plan</StatusBadge>}
      />

      <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Published / 7 days"
          value={publishedThisWeek}
          hint={`${remaining} remaining`}
          accent="success"
          icon={<FileCheck2 className="h-4 w-4" />}
        />
        <MetricCard
          label="Weekly limit"
          value={weeklyLimit || '—'}
          hint="Posts per rolling week"
          accent="primary"
          icon={<CalendarClock className="h-4 w-4" />}
        />
        <MetricCard
          label="Scheduled"
          value={scheduled}
          hint="Currently queued"
          accent="warning"
          icon={<Sparkles className="h-4 w-4" />}
        />
        <MetricCard
          label="Connections"
          value={accounts.length}
          hint="Active social accounts"
          accent="info"
          icon={<Link2 className="h-4 w-4" />}
        />
      </div>

      <Panel className="overflow-hidden p-6 sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="dot-label">Weekly publishing</p>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em]">
              <span className="tabular-nums">{publishedThisWeek}</span>
              <span className="text-muted-foreground"> of {weeklyLimit || '—'} posts used</span>
            </h2>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Rolling seven-day window
          </span>
        </div>

        <ProgressBar value={usage} tone={tone} className="relative mt-6 h-3" />

        <div className="relative mt-3 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
          <span>0</span>
          <span>{Math.round(usage)}% used</span>
          <span>{weeklyLimit || '—'}</span>
        </div>

        <div className="relative mt-6 flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-3.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-6 text-muted-foreground">
            AI generation and trend-monitoring meters stay hidden until server-side usage tracking is
            available. This page never estimates a number it cannot read.
          </p>
        </div>
      </Panel>

      {user?.plan === 'FREE' ? (
        <Panel className="flex flex-col items-start justify-between gap-4 overflow-hidden p-6 sm:flex-row sm:items-center">
          <div className="aurora">
            <span className="left-[-5%] top-[-90%] h-48 w-48 animate-drift bg-primary/25" />
          </div>
          <div className="relative flex items-start gap-3.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Gauge className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold">Need a higher cadence?</h2>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                Pro raises the weekly limit to 25 posts and unlocks unlimited drafts and brand voice
                profiles.
              </p>
            </div>
          </div>
          <ButtonLink href="/settings" className="relative w-full shrink-0 sm:w-auto">
            View plans
          </ButtonLink>
        </Panel>
      ) : null}
    </div>
  );
}
