'use client';

import { Gauge, Sparkles, Zap, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export default function QuotaPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30 mb-3">
              <Zap className="h-3.5 w-3.5" />
              <span>Pro Plan Subscriber</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Usage & Quota Limits</h1>
            <p className="text-blue-200 text-xs sm:text-sm mt-1 max-w-xl">
              Track monthly AI generation limits, platform connection allowances, and scheduled post limits.
            </p>
          </div>

          <button className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shrink-0">
            <span>Upgrade Plan</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Quota Progress Items */}
      <div className="space-y-4">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
          Monthly Quota Breakdown
        </h2>

        <div className="grid grid-cols-1 gap-4">
          <QuotaItem label="AI Content Generations" used={42} limit={500} unit="generations this month" color="bg-primary" />
          <QuotaItem label="Posts Published Across Platforms" used={12} limit={100} unit="published posts" color="bg-emerald-500" />
          <QuotaItem label="Connected Social Platforms" used={1} limit={5} unit="accounts linked" color="bg-violet-500" />
          <QuotaItem label="Trend Monitoring Keywords" used={8} limit={25} unit="topics tracked" color="bg-amber-500" />
        </div>
      </div>
    </div>
  );
}

function QuotaItem({
  label,
  used,
  limit,
  unit,
  color,
}: {
  label: string;
  used: number;
  limit: number;
  unit: string;
  color: string;
}) {
  const percentage = Math.min((used / limit) * 100, 100);

  return (
    <div className="glass-card rounded-2xl p-5 border space-y-3">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-foreground">{label}</span>
        <span className="font-bold text-muted-foreground">
          <strong className="text-foreground">{used}</strong> / {limit} {unit}
        </span>
      </div>

      <div className="h-2.5 bg-muted rounded-full overflow-hidden p-0.5 border border-border/40">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-[11px] text-muted-foreground font-medium pt-1">
        <span>{percentage.toFixed(0)}% utilized</span>
        <span>{(limit - used)} remaining</span>
      </div>
    </div>
  );
}
