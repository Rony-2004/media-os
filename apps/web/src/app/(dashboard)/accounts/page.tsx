'use client';

import { Suspense } from 'react';
import { useConnectedAccounts } from '@/hooks/use-connected-accounts';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Link2,
  Lock,
  RefreshCw,
  ShieldCheck,
  Unlink,
} from 'lucide-react';
import { LinkedInMark, XMark } from '@/components/brand/marks';
import { Button } from '@/components/ui/button';
import {
  CardSkeleton,
  InlineNotice,
  PageHeader,
  Panel,
  StatusBadge,
} from '@/components/ui/product';

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
    description: 'Publish technical posts and updates, and read verified engagement from your audience.',
    available: true,
    logo: <LinkedInMark className="h-5 w-5" />,
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    color: '#0f0f0f',
    description: 'Post threads and short snippets. The provider pipeline is built; auth is in progress.',
    available: false,
    logo: <XMark className="h-5 w-5" />,
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
        description="Authorize the channels ConnectUs can publish to and read engagement from. Tokens remain server-side and are revoked the moment you disconnect."
        actions={
          <StatusBadge tone={accounts?.length ? 'success' : 'neutral'} dot={!!accounts?.length}>
            {accounts?.length || 0} connected
          </StatusBadge>
        }
      />

      {connected ? (
        <InlineNotice
          title={`${connected.charAt(0).toUpperCase()}${connected.slice(1)} connected`}
          tone="success"
          icon={<CheckCircle2 className="h-4 w-4" />}
        >
          Locked navigation features are now unlocked across the workspace.
        </InlineNotice>
      ) : null}

      {error ? (
        <InlineNotice title="Connection failed" tone="danger" icon={<AlertCircle className="h-4 w-4" />}>
          {error.replace(/_/g, ' ')}. Please try connecting again.
        </InlineNotice>
      ) : null}

      {isLoading ? (
        <CardSkeleton count={2} />
      ) : (
        <div className="stagger grid gap-4 md:grid-cols-2">
          {PLATFORMS.map((platform) => {
            const account = (accounts || []).find((item) => item.provider === platform.id);
            const isConnected = !!account;
            const grantedScopes = account?.scopes?.split(/[\s,]+/).filter(Boolean) ?? [];
            const canReadEngagement = grantedScopes.some((scope) =>
              ['r_member_social', 'r_member_social_feed'].includes(scope),
            );

            return (
              <Panel
                key={platform.id}
                interactive={platform.available}
                className="flex flex-col justify-between gap-5 overflow-hidden p-6"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <span
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white shadow-soft"
                        style={{ backgroundColor: platform.color }}
                      >
                        {platform.logo}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold">{platform.name}</h3>
                        {isConnected ? (
                          <span className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-success">
                            <span className="signal-pulse h-1.5 w-1.5 rounded-full bg-success" />
                            Authorized & live
                          </span>
                        ) : platform.available ? (
                          <span className="text-[11px] font-medium text-muted-foreground">
                            Ready to connect
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-muted-foreground">
                            Integration in progress
                          </span>
                        )}
                      </div>
                    </div>

                    {!platform.available ? (
                      <StatusBadge tone="neutral">Soon</StatusBadge>
                    ) : null}
                  </div>

                  <p className="mt-4 text-xs leading-6 text-muted-foreground">{platform.description}</p>

                  {isConnected && account ? (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/40 p-3.5">
                        {account.providerAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={account.providerAvatar}
                            alt={account.providerName || ''}
                            className="h-10 w-10 shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-sm font-bold text-white">
                            {account.providerName?.charAt(0) || '?'}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold">{account.providerName}</p>
                          <p className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" /> Connected {formatDate(account.connectedAt)}
                          </p>
                        </div>
                      </div>

                      {!canReadEngagement ? (
                        <InlineNotice
                          title="Engagement read access required"
                          tone="warning"
                          icon={<ShieldCheck className="h-4 w-4" />}
                        >
                          Reconnect after enabling LinkedIn Community Management access to load real
                          reactions and comments.
                        </InlineNotice>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-border/70 pt-4">
                  {isConnected && account ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleConnect(platform.id)}
                        icon={<RefreshCw className="h-3.5 w-3.5" />}
                      >
                        Reconnect
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDisconnect(account.id)}
                        icon={<Unlink className="h-3.5 w-3.5" />}
                      >
                        Disconnect
                      </Button>
                    </div>
                  ) : platform.available ? (
                    <button
                      type="button"
                      onClick={() => handleConnect(platform.id)}
                      className="btn h-11 w-full text-white shadow-soft transition-all hover:brightness-110"
                      style={{ backgroundColor: platform.color }}
                    >
                      <Link2 className="h-4 w-4" />
                      Connect {platform.name}
                    </button>
                  ) : (
                    <Button variant="secondary" size="md" block disabled icon={<Lock className="h-3.5 w-3.5" />}>
                      Coming soon
                    </Button>
                  )}
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      <Panel className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold">How your tokens are handled</h2>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            Access and refresh tokens are stored server-side and encrypted at rest. The browser never
            receives a provider token, and disconnecting an account removes it immediately along with
            any scheduled posts bound to it.
          </p>
        </div>
      </Panel>
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<CardSkeleton count={2} />}>
      <AccountsContent />
    </Suspense>
  );
}
