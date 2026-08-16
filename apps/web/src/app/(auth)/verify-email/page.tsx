'use client';

import { Suspense, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Check, CheckCircle2, MailCheck } from 'lucide-react';
import { useVerifyEmail } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LENGTH = 6;

function VerifyEmailForm() {
  const router = useRouter();
  const email = useSearchParams().get('email') || '';
  const verify = useVerifyEmail();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(''));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const otp = digits.join('');

  const setDigit = (index: number, value: string) => {
    setDigits((previous) => {
      const next = [...previous];
      next[index] = value;
      return next;
    });
  };

  const handleChange = (index: number, raw: string) => {
    const value = raw.replace(/\D/g, '');
    if (!value) {
      setDigit(index, '');
      return;
    }

    if (value.length > 1) {
      // Pasted or typed several digits — spread them across the boxes.
      setDigits((previous) => {
        const next = [...previous];
        value
          .slice(0, LENGTH - index)
          .split('')
          .forEach((digit, offset) => {
            next[index + offset] = digit;
          });
        return next;
      });
      inputs.current[Math.min(index + value.length, LENGTH - 1)]?.focus();
      return;
    }

    setDigit(index, value);
    if (index < LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < LENGTH - 1) inputs.current[index + 1]?.focus();
  };

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
        <span className="mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-glow">
          <MailCheck className="h-5 w-5" />
        </span>
        <p className="dot-label mb-3">Identity check</p>
        <h1 className="text-[32px] font-bold leading-tight tracking-[-0.04em]">Verify your email.</h1>
        <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
          Enter the six-digit code sent to{' '}
          <strong className="font-semibold text-foreground">{email || 'your inbox'}</strong>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {verify.error ? (
          <div
            className="flex animate-fade-in items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{verify.error.message}</span>
          </div>
        ) : null}

        {verify.isSuccess ? (
          <div
            className="flex animate-fade-in items-center gap-2.5 rounded-xl border border-success/30 bg-success/10 p-3.5 text-sm text-success"
            role="status"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Email verified. Redirecting…
          </div>
        ) : null}

        <fieldset>
          <legend className="mb-3 text-xs font-semibold text-foreground">Verification code</legend>
          <div className="flex gap-2 sm:gap-2.5">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputs.current[index] = element;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                aria-label={`Digit ${index + 1}`}
                value={digit}
                onChange={(event) => handleChange(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onFocus={(event) => event.target.select()}
                className={cn(
                  'field h-14 flex-1 px-0 text-center font-mono text-xl font-bold sm:h-16 sm:text-2xl',
                  digit && 'border-primary/50 bg-primary/5',
                )}
              />
            ))}
          </div>
        </fieldset>

        <Button
          type="submit"
          block
          size="lg"
          disabled={otp.length !== LENGTH}
          loading={verify.isPending}
          icon={<Check className="h-4 w-4" />}
        >
          {verify.isPending ? 'Verifying…' : 'Verify email'}
        </Button>
      </form>

      <p className="mt-6 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
        Development codes appear in the terminal
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 py-12">
          <div className="skeleton h-8 w-2/3" />
          <div className="skeleton h-14 w-full" />
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
