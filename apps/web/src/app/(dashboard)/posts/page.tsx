'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConnectedAccounts } from '@/hooks/use-connected-accounts';

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
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-pulse text-muted-foreground text-sm">Redirecting...</div>
    </div>
  );
}
