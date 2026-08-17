'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { toAuthUser, type AuthUser, type BetterAuthUserLike } from '@/lib/auth-user';

export type { AuthUser } from '@/lib/auth-user';

type BetterAuthError = {
  message?: string;
  code?: string;
};

function getAuthError(error: BetterAuthError | null | undefined, fallback: string): Error {
  return new Error(error?.message || fallback);
}

export function useSession() {
  const session = authClient.useSession();

  return {
    ...session,
    data: session.data?.user ? toAuthUser(session.data.user as BetterAuthUserLike) : null,
    isLoading: session.isPending,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { email: string; password: string }): Promise<{ user: AuthUser }> => {
      const result = await authClient.signIn.email({
        email: input.email,
        password: input.password,
        callbackURL: '/dashboard',
      });

      if (result.error) throw getAuthError(result.error, 'Login failed');
      if (!result.data?.user) throw new Error('Login failed');

      const user = toAuthUser(result.data.user as BetterAuthUserLike);
      if (user.isBlocked) {
        await authClient.signOut();
        throw new Error('Your account has been blocked by an administrator. Please contact support.');
      }
      if (!user.isActive) {
        await authClient.signOut();
        throw new Error('Account is disabled');
      }

      return { user };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['session'], data.user);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (input: { name: string; email: string; password: string }) => {
      const result = await authClient.signUp.email({
        name: input.name,
        email: input.email,
        password: input.password,
        callbackURL: `/verify-email?email=${encodeURIComponent(input.email)}`,
      });

      if (result.error) throw getAuthError(result.error, 'Registration failed');
      return result.data;
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await authClient.signOut();
      if (result.error) throw getAuthError(result.error, 'Logout failed');
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: async (input: { email: string; otp: string }) => {
      const result = await authClient.emailOtp.verifyEmail(input);
      if (result.error) throw getAuthError(result.error, 'Verification failed');
      return result.data;
    },
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: async (email: string) => {
      const result = await authClient.emailOtp.requestPasswordReset({ email });
      if (result.error) throw getAuthError(result.error, 'Password reset request failed');
      return result.data;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (input: { email: string; otp: string; password: string }) => {
      const result = await authClient.emailOtp.resetPassword(input);
      if (result.error) throw getAuthError(result.error, 'Password reset failed');
      return result.data;
    },
  });
}
