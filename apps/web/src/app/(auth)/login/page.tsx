'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useLogin } from '@/hooks/use-auth';

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
        <h1 className="text-3xl font-black tracking-[-0.04em]">Welcome back.</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Sign in to continue to your content workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {login.error ? (
          <div className="rounded-xl border border-primary/25 bg-primary/10 p-3 text-sm text-primary" role="alert">
            {login.error.message}
          </div>
        ) : null}

        <label className="block" htmlFor="email">
          <span className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-[0.14em]">
            Email address
          </span>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="product-input"
            placeholder="you@example.com"
          />
        </label>

        <label className="block" htmlFor="password">
          <span className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-[0.14em]">
            Password
          </span>
          <span className="relative block">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="product-input pr-12"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              onMouseDown={(event) => event.preventDefault()}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </span>
        </label>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs font-bold underline decoration-border underline-offset-4 hover:decoration-primary">
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={login.isPending} className="product-button-primary w-full">
          {login.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-7 text-center text-xs text-muted-foreground">
        New to ConnectUs?{' '}
        <Link href="/register" className="font-bold text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">
          Create an account
        </Link>
      </p>
    </div>
  );
}
