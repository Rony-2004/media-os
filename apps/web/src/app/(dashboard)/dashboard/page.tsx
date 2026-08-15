'use client';

import { useSession } from '@/hooks/use-auth';
import { useConnectedAccounts } from '@/hooks/use-connected-accounts';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowRight,
  Link2,
  TrendingUp,
  Clock,
  Sparkles,
  Zap,
  BarChart3,
  CheckCircle2,
  Share2,
  Plus,
} from 'lucide-react';

const PLATFORM_META: Record<string, { color: string; textColor: string; logo: React.ReactNode }> = {
  linkedin: {
    color: '#0A66C2',
    textColor: '#fff',
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
};

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
    engagementScore: '8.4/10',
    nextScheduled: 'Next: Queue Empty',
  };

  const firstName = user?.name?.split(' ')[0] || 'there';
  const hasAccounts = accounts.length > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Welcome Banner Card (shadcn/ui clean style) */}
      <div className="rounded-2xl p-6 sm:p-7 border border-border bg-card relative overflow-hidden transition-all duration-300 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-muted border border-border text-muted-foreground text-[11px] font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Connected & Active</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome back, {firstName}
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-xl leading-relaxed">
              {hasAccounts
                ? 'Manage your social media pipeline, schedule posts, and monitor automated content recommendations.'
                : 'Connect your LinkedIn account to unlock automated content pipeline management.'}
            </p>
          </div>

          {hasAccounts && (
            <Link
              href="/platform/linkedin"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-foreground text-background hover:opacity-90 rounded-xl text-xs font-semibold transition-all shrink-0"
            >
              <span>Open LinkedIn Pipeline</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* No accounts — Onboarding card */}
      {!isLoading && !hasAccounts && (
        <div className="glass-card rounded-2xl p-8 sm:p-12 text-center border-2 border-dashed flex flex-col items-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white mb-4">
            <Link2 className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold">Connect your primary social account</h2>
          <p className="text-muted-foreground text-xs max-w-md mt-1.5 mb-6 leading-relaxed">
            Link your LinkedIn account to enable automated trend monitoring, post drafting, tone matching, and schedule optimization.
          </p>
          <Link
            href="/accounts"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/90 transition-all"
          >
            <span>Connect Accounts</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Connected Platforms Section */}
      {hasAccounts && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Connected Social Platforms
            </h2>
            <Link
              href="/accounts"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Manage Accounts <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((account) => {
              const meta = PLATFORM_META[account.provider] || {
                color: '#0A66C2',
                textColor: '#fff',
                logo: null,
              };

              return (
                <Link
                  key={account.id}
                  href={`/platform/${account.provider}`}
                  className="group glass-card rounded-2xl p-5 hover:border-primary/40 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: meta.color }}
                      >
                        {meta.logo}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-sm capitalize">{account.provider}</h3>
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {account.providerName || account.providerUsername || 'Connected User'}
                        </p>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1 text-xs font-bold text-primary opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                      <span>View Pipeline</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                    <StatPill icon={<Sparkles className="h-3.5 w-3.5 text-primary" />} label="Suggestions" value="3 Ready" />
                    <StatPill icon={<Clock className="h-3.5 w-3.5 text-blue-500" />} label="Scheduled" value={`${metricsData.scheduledCount} Queued`} />
                    <StatPill icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-500" />} label="Trends" value="Active" />
                  </div>
                </Link>
              );
            })}

            <Link
              href="/accounts"
              className="glass-card rounded-2xl p-5 border-2 border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all min-h-[140px]"
            >
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">Add Social Platform</span>
            </Link>
          </div>
        </div>
      )}

      {/* Overview Analytics Metrics */}
      {hasAccounts && (
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Key Performance Metrics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Posts Published',
                value: metricsData.publishedCount.toString(),
                trend: metricsData.publishedCount > 0 ? `+${metricsData.publishedCount} published` : '0 published yet',
                icon: CheckCircle2,
                color: 'text-emerald-500',
              },
              {
                label: 'AI Drafts Approved',
                value: metricsData.aiApprovedCount.toString(),
                trend: metricsData.acceptanceRate,
                icon: Sparkles,
                color: 'text-primary',
              },
              {
                label: 'Scheduled Queue',
                value: metricsData.scheduledCount.toString(),
                trend: metricsData.nextScheduled,
                icon: Clock,
                color: 'text-blue-500',
              },
              {
                label: 'Engagement Score',
                value: metricsData.engagementScore,
                trend: 'High visibility',
                icon: BarChart3,
                color: 'text-violet-500',
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="glass-card rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-medium">{s.label}</span>
                    <Icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <p className="text-2xl font-extrabold tracking-tight">{s.value}</p>
                  <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {s.trend}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
    <div className="bg-muted/40 rounded-xl px-2.5 py-1.5 border border-border/50">
      <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
      </div>
      <p className="text-xs font-bold">{value}</p>
    </div>
  );
}
