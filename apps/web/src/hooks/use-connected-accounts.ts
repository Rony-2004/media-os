'use client';

import { useQuery } from '@tanstack/react-query';

interface SocialAccount {
  id: string;
  provider: string;
  providerUsername: string | null;
  providerName: string | null;
  providerAvatar: string | null;
  status: string;
  connectedAt: string;
  expiresAt: string | null;
}

async function fetchConnectedAccounts(): Promise<SocialAccount[]> {
  const res = await fetch('/api/social-accounts', {
    credentials: 'include',
  });

  if (!res.ok) {
    if (res.status === 401) return [];
    throw new Error('Failed to fetch accounts');
  }

  const data = await res.json();
  return data.data;
}

export function useConnectedAccounts() {
  return useQuery({
    queryKey: ['social-accounts'],
    queryFn: fetchConnectedAccounts,
    retry: false,
  });
}
