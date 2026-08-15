'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { useVerifyEmail } from '@/hooks/use-auth';

function VerifyEmailForm() {
  const router = useRouter();
  const email = useSearchParams().get('email') || '';
  const verify = useVerifyEmail();
  const [otp, setOtp] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await verify.mutateAsync({ email, otp });
      router.push('/login?verified=true');
    } catch {
      // The mutation exposes the server message below.
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="dot-label mb-3">Identity check</p>
        <h1 className="text-3xl font-black tracking-[-0.04em]">Verify your email.</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Enter the six-digit code sent to <strong className="text-foreground">{email || 'your inbox'}</strong>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {verify.error ? (
          <div className="rounded-xl border border-primary/25 bg-primary/10 p-3 text-sm text-primary" role="alert">
            {verify.error.message}
          </div>
        ) : null}
        {verify.isSuccess ? (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300" role="status">
            Email verified. Redirecting…
          </div>
        ) : null}

        <label className="block" htmlFor="otp">
          <span className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-[0.14em]">
            Verification code
          </span>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            maxLength={6}
            className="product-input py-4 text-center font-mono text-2xl tracking-[0.35em]"
            placeholder="000000"
          />
        </label>

        <button type="submit" disabled={verify.isPending || otp.length !== 6} className="product-button-primary w-full">
          {verify.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {verify.isPending ? 'Verifying…' : 'Verify email'}
        </button>
      </form>

      <p className="mt-5 text-center font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
        Development codes appear in the terminal
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center font-mono text-xs text-muted-foreground">Loading verification…</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
