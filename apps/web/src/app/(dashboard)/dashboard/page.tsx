'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock,
  Link2,
  Plus,
  Settings2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useSession } from '@/hooks/use-auth';
import { useConnectedAccounts } from '@/hooks/use-connected-accounts';
import { LinkedInMark } from '@/components/brand/marks';
import { Button, ButtonLink } from '@/components/ui/button';
import {
  EmptyState,
  MetricCard,
  Panel,
  SectionTitle,
  Skeleton,
  StatusBadge,
} from '@/components/ui/product';
import { GrowthPanel } from '@/components/dashboard/growth-panel';
import { cn } from '@/lib/utils';

const PLATFORM_META: Record<string, { color: string; label: string; logo: React.ReactNode }> = {
  linkedin: {
    color: '#0A66C2',
    label: 'LinkedIn',
    logo: <LinkedInMark className="h-5 w-5" />,
  },
};

const quickActions = [
  { label: 'Draft a post', description: 'Compose or paste content', href: '/posts/new', icon: Plus },
  { label: 'AI suggestions', description: 'Review trend-based drafts', href: '/platform/linkedin?tab=suggestions', icon: Sparkles },
  { label: 'Scheduled queue', description: 'See what ships next', href: '/platform/linkedin?tab=scheduled', icon: CalendarDays },
  { label: 'Brand voice', description: 'Tune tone and topics', href: '/ai-settings', icon: Settings2 },
];

export default function DashboardPage() {
  const { data: user } = useSession();
  const { data: accounts = [], isLoading } = useConnectedAccounts();

  const { data: analyticsRes } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/overview', { credentials: 'include' });
      if (!res.ok) return null;
      return (await res.json()).data;
    },
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const metricsData = analyticsRes || {
    publishedCount: 0,
    scheduledCount: 0,
    aiApprovedCount: 0,
    acceptanceRate: '94% acceptance',
    totalReactions: 0,
    totalComments: 0,
    engagementSyncedPosts: 0,
    nextScheduled: 'Next: Queue Empty',
  };

  const firstName = user?.name?.split(' ')[0] || 'there';
  const hasAccounts = accounts.length > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      {/* ── Welcome band ─────────────────────────────────────────────── */}
      <Panel className="animate-fade-in overflow-hidden p-0">
        <div className="relative">
          <div className="aurora">
            <span className="left-[-4%] top-[-60%] h-64 w-64 animate-drift bg-primary/30" />
            <span
              className="right-[6%] top-[-40%] h-56 w-56 animate-drift bg-accent/25"
              style={{ animationDelay: '-8s' }}
            />
          </div>
          <div className="dot-grid pointer-events-none absolute inset-0 opacity-40 mask-fade-b" />

          <div className="relative flex flex-col items-start justify-between gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
            <div className="min-w-0 space-y-3">
              <StatusBadge tone={hasAccounts ? 'success' : 'warning'} dot>
                {hasAccounts ? 'Connected & active' : 'Setup required'}
              </StatusBadge>
              <h1 className="text-[28px] font-bold leading-tight tracking-[-0.035em] sm:text-[34px]">
                Welcome back, <span className="gradient-text">{firstName}</span>
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {hasAccounts
                  ? 'Manage your content pipeline, publish with control, and monitor verified engagement from one workspace.'
                  : 'Connect LinkedIn to unlock your publishing workspace and live engagement signals.'}
              </p>
            </div>

            <ButtonLink
              href={hasAccounts ? '/platform/linkedin' : '/accounts'}
              size="lg"
              className="w-full shrink-0 sm:w-auto"
              trailingIcon={<ArrowRight className="h-4 w-4" />}
            >
              {hasAccounts ? 'Open LinkedIn pipeline' : 'Connect account'}
            </ButtonLink>
          </div>
        </div>
      </Panel>

      {/* ── Loading ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : null}

      {/* ── Onboarding ───────────────────────────────────────────────── */}
      {!isLoading && !hasAccounts ? (
        <EmptyState
          icon={<Link2 className="h-6 w-6" />}
          title="Connect your primary social account"
          description="Link LinkedIn to enable trend monitoring, post drafting, tone matching, and schedule optimisation. Tokens stay server-side and can be revoked at any time."
          action={
            <ButtonLink href="/accounts" size="lg" trailingIcon={<ArrowRight className="h-4 w-4" />}>
              Connect accounts
            </ButtonLink>
          }
        />
      ) : null}

      {/* ── Connected platforms ──────────────────────────────────────── */}
      {hasAccounts ? (
        <section className="space-y-4">
          <SectionTitle
            icon={<Link2 className="h-3.5 w-3.5" />}
            action={
              <Link
                href="/accounts"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-foreground"
              >
                Manage accounts <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            Connected platforms
          </SectionTitle>

          <div className="stagger grid gap-4 md:grid-cols-2">
            {accounts.map((account) => {
              const meta = PLATFORM_META[account.provider] || {
                color: '#0A66C2',
                label: account.provider,
                logo: null,
              };

              return (
                <Link key={account.id} href={`/platform/${account.provider}`} className="group">
                  <Panel interactive className="h-full overflow-hidden p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white shadow-soft transition-transform duration-300 group-hover:scale-105"
                          style={{ backgroundColor: meta.color }}
                        >
                          {meta.logo}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-bold capitalize">{account.provider}</h3>
                            <span className="signal-pulse h-2 w-2 shrink-0 rounded-full bg-success" />
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {account.providerName || account.providerUsername || 'Connected user'}
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-primary opacity-70 transition-all group-hover:translate-x-0.5 group-hover:opacity-100">
                        <span className="hidden sm:inline">Pipeline</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t border-border/70 pt-4">
                      <StatPill
                        icon={<Sparkles className="h-3.5 w-3.5 text-primary" />}
                        label="Suggestions"
                        value="Ready"
                      />
                      <StatPill
                        icon={<Clock className="h-3.5 w-3.5 text-warning" />}
                        label="Scheduled"
                        value={`${metricsData.scheduledCount} queued`}
                      />
                      <StatPill
                        icon={<TrendingUp className="h-3.5 w-3.5 text-success" />}
                        label="Trends"
                        value="Active"
                      />
                    </div>
                  </Panel>
                </Link>
              );
            })}

            <Link href="/accounts" className="group">
              <div className="flex h-full min-h-[168px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border p-5 text-muted-foreground transition-all duration-300 ease-spring hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-muted transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/10">
                  <Plus className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold">Add social platform</span>
              </div>
            </Link>
          </div>
        </section>
      ) : null}

      {/* ── Metrics ──────────────────────────────────────────────────── */}
      {hasAccounts ? (
        <section id="analytics" className="scroll-mt-24 space-y-4">
          <SectionTitle icon={<BarChart3 className="h-3.5 w-3.5" />}>
            Key performance metrics
          </SectionTitle>

          <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard
              label="Posts published"
              value={metricsData.publishedCount}
              accent="success"
              icon={<CheckCircle2 className="h-4 w-4" />}
              hint={
                metricsData.publishedCount > 0
                  ? `${metricsData.publishedCount} live on platform`
                  : 'Nothing published yet'
              }
            />
            <MetricCard
              label="AI drafts approved"
              value={metricsData.aiApprovedCount}
              accent="primary"
              icon={<Sparkles className="h-4 w-4" />}
              hint={metricsData.acceptanceRate}
            />
            <MetricCard
              label="Scheduled queue"
              value={metricsData.scheduledCount}
              accent="warning"
              icon={<Clock className="h-4 w-4" />}
              hint={metricsData.nextScheduled}
            />
            <MetricCard
              label="Real engagement"
              value={
                metricsData.engagementSyncedPosts > 0
                  ? metricsData.totalReactions + metricsData.totalComments
                  : '—'
              }
              accent="info"
              icon={<BarChart3 className="h-4 w-4" />}
              hint={
                metricsData.engagementSyncedPosts > 0
                  ? `${metricsData.totalReactions} reactions · ${metricsData.totalComments} comments`
                  : 'Sync access required'
              }
            />
          </div>
        </section>
      ) : null}

      {hasAccounts ? <GrowthPanel /> : null}

      {/* ── Quick actions ────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionTitle icon={<Bot className="h-3.5 w-3.5" />}>Quick actions</SectionTitle>
        <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href} className="group">
                <Panel interactive className="h-full p-4">
                  <span className="grid h-9 w-9 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="mt-3.5 text-sm font-bold tracking-tight">{action.label}</p>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                    {action.description}
                  </p>
                </Panel>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className={cn('rounded-xl border border-border/70 bg-muted/40 px-2.5 py-2')}>
      <div className="mb-0.5 flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="truncate text-[10px] font-medium">{label}</span>
      </div>
      <p className="truncate text-xs font-bold">{value}</p>
    </div>
  );
}
