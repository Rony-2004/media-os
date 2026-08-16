'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConnectedAccounts } from '@/hooks/use-connected-accounts';
import { Logo } from '@/components/brand/marks';

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
    <div className="flex min-h-[360px] flex-col items-center justify-center gap-5">
      <div className="relative">
        <span className="absolute -inset-4 animate-pulse rounded-full bg-primary/20 blur-2xl" />
        <Logo className="relative h-12 w-12 animate-float" gradientId="posts-redirect-mark" />
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        Opening workspace
      </p>
      <div className="skeleton h-1 w-32 rounded-full" />
    </div>
  );
}
