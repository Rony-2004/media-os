'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface BrandVoice {
  formality: number;
  humor: number;
  emojiUsage: string;
  postLength: string;
  imageStyle: string;
  proficiency: string;
  postFrequency: string;
  topics: string[];
  avoidWords: string[];
  samplePosts: string;
  /** true = the agent queues approved drafts itself; false = a human approves each one. */
  autoApprove: boolean;
  autoSchedule: boolean;
}

async function fetchBrandVoice(): Promise<BrandVoice | null> {
  const res = await fetch('/api/ai/config', { credentials: 'include' });
  if (!res.ok) return null;
  return (await res.json()).data;
}

export function useBrandVoice() {
  return useQuery({ queryKey: ['ai-config'], queryFn: fetchBrandVoice });
}

/** Patches a subset of the config, preserving everything else. */
export function useUpdateBrandVoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: Partial<BrandVoice>) => {
      const current = queryClient.getQueryData<BrandVoice | null>(['ai-config']) ?? (await fetchBrandVoice());
      const res = await fetch('/api/ai/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...current, ...patch }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error?.message || 'The setting could not be saved.');
      }
      return (await res.json()).data as BrandVoice;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['ai-config'], data);
    },
  });
}
