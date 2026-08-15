'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useVerifyEmail } from '@/hooks/use-auth';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const verify = useVerifyEmail();
  const [otp, setOtp] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verify.mutateAsync({ email, otp });
      router.push('/login?verified=true');
    } catch {
      // error handled by mutation
    }
  };

  return (
    <div className="bg-card rounded-lg border p-8 shadow-sm">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Verify your email</h1>
        <p className="text-muted-foreground mt-1">
          We sent a 6-digit code to <strong>{email}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {verify.error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {verify.error.message}
          </div>
        )}

        {verify.isSuccess && (
          <div className="bg-green-50 text-green-800 text-sm p-3 rounded-md">
            Email verified! Redirecting to login...
          </div>
        )}

        <div>
          <label htmlFor="otp" className="block text-sm font-medium mb-1">
            Verification Code
          </label>
          <input
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            maxLength={6}
            className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest"
            placeholder="000000"
          />
        </div>

        <button
          type="submit"
          disabled={verify.isPending || otp.length !== 6}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {verify.isPending ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Check your terminal if running in development mode.
      </p>
    </div>
  );
}
