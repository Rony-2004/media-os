'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConnectedAccounts } from '@/hooks/use-connected-accounts';
import { NothingMark } from '@/components/brand/marks';

export default function PostsRedirectPage() {
  const router = useRouter();
  const { data: accounts = [], isLoading } = useConnectedAccounts();

  useEffect(() => {
    if (isLoading) return;
    if (accounts.length > 0) {
      router.replace(`/platform/${accounts[0].provider}`);
    } else {
      router.replace('/accounts');
    }
  }, [accounts, isLoading, router]);

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
      <NothingMark className="animate-pulse" />
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Opening workspace…</div>
    </div>
  );
}
