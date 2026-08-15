'use client';

import { useConnectedAccounts } from '@/hooks/use-connected-accounts';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  AlertCircle,
  Link2,
  Unlink,
  RefreshCw,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  color: string;
  textColor: string;
  available: boolean;
  logo: React.ReactNode;
}

const platforms: Platform[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    color: '#0A66C2',
    textColor: '#fff',
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
    textColor: '#fff',
    available: false,
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: 'instagram',
    name: 'Instagram',
    color: '#E4405F',
    textColor: '#fff',
    available: false,
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    textColor: '#fff',
    available: false,
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
];

export default function AccountsPage() {
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

  const getConnectedAccount = (providerId: string) =>
    accounts?.find((a) => a.provider === providerId);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30 mb-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>OAuth 2.0 Encrypted Vault</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Social Accounts</h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              Connect your official business social profiles to authorize AI Social OS to publish posts, monitor trends, and analyze analytics on your behalf.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs text-center shrink-0">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Connected Status</span>
            <span className="text-base font-bold text-emerald-400 mt-0.5 block">
              {accounts?.length || 0} / 5 Channels Active
            </span>
          </div>
        </div>
      </div>

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
        {platforms.map((platform) => {
          const account = getConnectedAccount(platform.id);
          const isConnected = !!account;

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
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex items-center gap-3">
                  {account.providerAvatar ? (
                    <img
                      src={account.providerAvatar}
                      alt={account.providerName || ''}
                      className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-primary/20"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
                      {account.providerName?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{account.providerName}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      Connected {formatDate(account.connectedAt)}
                    </p>
                  </div>
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
                    Connect {platform.name} Account
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-muted text-muted-foreground cursor-not-allowed text-center"
                  >
                    Coming Soon in Next Release
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
