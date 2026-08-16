'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useLogin } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await login.mutateAsync({ email, password });
      router.push(response?.user?.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch {
      // The mutation exposes the server message below.
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="dot-label mb-3">Member access</p>
        <h1 className="text-[32px] font-bold leading-tight tracking-[-0.04em]">Welcome back.</h1>
        <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
          Sign in to continue to your content workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {login.error ? (
          <div
            className="flex animate-fade-in items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{login.error.message}</span>
          </div>
        ) : null}

        <Field label="Email address">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="you@example.com"
            icon={<Mail className="h-4 w-4" />}
          />
        </Field>

        <Field label="Password">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            placeholder="Enter your password"
            icon={<Lock className="h-4 w-4" />}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                onMouseDown={(event) => event.preventDefault()}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
        </Field>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-primary"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          block
          size="lg"
          loading={login.isPending}
          trailingIcon={<ArrowRight className="h-4 w-4" />}
        >
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="my-7 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <p className="text-center text-xs text-muted-foreground">
        New to ConnectUs?{' '}
        <Link
          href="/register"
          className="font-bold text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-primary"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
