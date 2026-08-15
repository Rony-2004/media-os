'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarClock, FileCheck2, Link2, Sparkles } from 'lucide-react';
import { useSession } from '@/hooks/use-auth';
import { useConnectedAccounts } from '@/hooks/use-connected-accounts';
import { MetricCard, PageHeader, Panel, StatusBadge } from '@/components/ui/product';

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
    (post) => post.status === 'published' && post.publishedAt && new Date(post.publishedAt).getTime() >= weekStart,
  ).length;
  const scheduled = posts.filter((post) => post.status === 'scheduled').length;
  const weeklyLimit = user?.weeklyPostLimit ?? 0;
  const remaining = Math.max(weeklyLimit - publishedThisWeek, 0);
  const usage = weeklyLimit > 0 ? Math.min((publishedThisWeek / weeklyLimit) * 100, 100) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <PageHeader
        eyebrow="Plan & usage"
        title="Quota"
        description="A clear view of the limits currently enforced by your ConnectUs plan."
        actions={<StatusBadge tone="dark">{user?.plan || 'FREE'} plan</StatusBadge>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Published / 7 days" value={publishedThisWeek} hint={`${remaining} remaining`} icon={<FileCheck2 className="h-4 w-4" />} />
        <MetricCard label="Weekly limit" value={weeklyLimit || '—'} hint="Posts per rolling week" icon={<CalendarClock className="h-4 w-4" />} />
        <MetricCard label="Scheduled" value={scheduled} hint="Currently queued" icon={<Sparkles className="h-4 w-4" />} />
        <MetricCard label="Connections" value={accounts.length} hint="Active social accounts" icon={<Link2 className="h-4 w-4" />} />
      </div>

      <Panel className="p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="dot-label">Weekly publishing</p>
            <h2 className="mt-3 text-lg font-black tracking-tight">{publishedThisWeek} of {weeklyLimit || '—'} posts used</h2>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Rolling seven-day window</p>
        </div>
        <div className="mt-6 h-3 overflow-hidden rounded-full border border-border bg-muted p-0.5">
          <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${usage}%` }} />
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          AI generation and trend-monitoring meters are hidden until server-side usage tracking is available; this page does not estimate usage.
        </p>
      </Panel>
    </div>
  );
}
