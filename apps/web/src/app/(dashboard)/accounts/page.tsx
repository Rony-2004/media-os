'use client';

import { Suspense } from 'react';
import { useConnectedAccounts } from '@/hooks/use-connected-accounts';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { InlineNotice, PageHeader, StatusBadge } from '@/components/ui/product';
import {
  CheckCircle2,
  AlertCircle,
  Link2,
  Unlink,
  RefreshCw,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  color: string;
  description: string;
  available: boolean;
  logo: React.ReactNode;
}

const PLATFORMS: Platform[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    color: '#0A66C2',
    description: 'Share technical posts, updates, and engage with your developer audience.',
    available: true,
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    color: '#000000',
    description: 'Post tech threads and short snippets.',
    available: false,
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

function AccountsContent() {
  const { data: accounts, isLoading } = useConnectedAccounts();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const connected = searchParams.get('connected');
  const error = searchParams.get('error');

  const handleConnect = (provider: string) => {
    window.location.href = `/api/social-accounts/${provider}/auth`;
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Disconnect this account? Scheduled posts for this account will be cancelled.')) return;

    const res = await fetch(`/api/social-accounts/${accountId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <PageHeader
        eyebrow="Connections"
        title="Social accounts"
        description="Authorize the channels ConnectUs can publish to and read engagement from. Tokens remain server-side."
        actions={<StatusBadge tone={accounts?.length ? 'success' : 'neutral'}>{accounts?.length || 0} connected</StatusBadge>}
      />

      {/* Notifications / Alerts */}
      {connected && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl text-xs font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>
            <strong className="capitalize">{connected}</strong> account linked successfully! Locked navigation features are now unlocked.
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-xl text-xs font-medium">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>Failed to connect account: {error.replace(/_/g, ' ')}. Please try again.</span>
        </div>
      )}

      {/* Platforms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLATFORMS.map((platform) => {
          const account = (accounts || []).find((item) => item.provider === platform.id);
          const isConnected = !!account;
          const grantedScopes = account?.scopes?.split(/[\s,]+/).filter(Boolean) ?? [];
          const canReadEngagement = grantedScopes.some((scope) =>
            ['r_member_social', 'r_member_social_feed'].includes(scope),
          );

          return (
            <div
              key={platform.id}
              className="glass-card rounded-2xl p-6 flex flex-col justify-between gap-5 border transition-all duration-200 hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: platform.color }}
                  >
                    {platform.logo}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{platform.name}</h3>
                    {isConnected ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Authorized & Live
                      </span>
                    ) : platform.available ? (
                      <span className="text-[11px] text-muted-foreground font-medium">Ready to connect</span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground font-medium">Integration in progress</span>
                    )}
                  </div>
                </div>

                {!platform.available && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-muted text-muted-foreground uppercase tracking-wider">
                    Beta
                  </span>
                )}
              </div>

              {/* Connected Profile Details */}
              {isConnected && account && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-3.5">
                    {account.providerAvatar ? (
                      <img
                        src={account.providerAvatar}
                        alt={account.providerName || ''}
                        className="h-10 w-10 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-sm font-black text-background">
                        {account.providerName?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-foreground">{account.providerName}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" /> Connected {formatDate(account.connectedAt)}
                      </p>
                    </div>
                  </div>
                  {!canReadEngagement ? (
                    <InlineNotice title="Engagement read access required" tone="warning" icon={<ShieldCheck className="h-4 w-4" />}>
                      Reconnect after enabling LinkedIn Community Management access to load real reactions and comments.
                    </InlineNotice>
                  ) : null}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-border/40">
                {isConnected ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleConnect(platform.id)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-accent text-foreground transition-colors"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Reconnect
                    </button>
                    <button
                      onClick={() => handleDisconnect(account.id)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
                    >
                      <Unlink className="h-3.5 w-3.5" />
                      Disconnect
                    </button>
                  </div>
                ) : platform.available ? (
                  <button
                    onClick={() => handleConnect(platform.id)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: platform.color }}
                  >
                    <Link2 className="h-4 w-4" />
                    Connect {platform.name}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-muted text-muted-foreground cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading accounts...</div>}>
      <AccountsContent />
    </Suspense>
  );
}
