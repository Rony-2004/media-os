'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  emailVerified: boolean;
}

/**
 * Fetch current session from /api/auth/me.
 * The server will auto-refresh the access token using the refresh token cookie if needed.
 */
async function fetchSession(): Promise<AuthUser | null> {
  const res = await fetch('/api/auth/me', {
    credentials: 'include',
    cache: 'no-store',
  });

  if (res.status === 401) return null;
  if (!res.ok) return null;

  const data = await res.json();
  return data.data.user;
}

export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000,   // 5 minutes — don't refetch if fresh
    gcTime: 10 * 60 * 1000,     // 10 minutes cache
    retry: false,
    refetchOnWindowFocus: true,  // Refresh session when user returns to tab
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Login failed');
      return data.data;
    },
    onSuccess: (data) => {
      // Set session data immediately without refetching
      queryClient.setQueryData(['session'], data.user);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (input: { name: string; email: string; password: string }) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Registration failed');
      return data.data;
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: async (input: { email: string; otp: string }) => {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Verification failed');
      return data.data;
    },
  });
}
