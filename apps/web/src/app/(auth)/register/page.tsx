'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useRegister } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { cn } from '@/lib/utils';

const rules = [
  { label: '8+ characters', test: (value: string) => value.length >= 8 },
  { label: '1 uppercase', test: (value: string) => /[A-Z]/.test(value) },
  { label: '1 number', test: (value: string) => /\d/.test(value) },
];

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const passed = useMemo(() => rules.filter((rule) => rule.test(password)).length, [password]);
  const strengthTone = ['bg-muted', 'bg-destructive', 'bg-warning', 'bg-success'][passed];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await register.mutateAsync({ name, email, password });
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch {
      // The mutation exposes the server message below.
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <p className="dot-label mb-3">New workspace</p>
        <h1 className="text-[32px] font-bold leading-tight tracking-[-0.04em]">Create your account.</h1>
        <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
          Set up a focused home for your social content.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {register.error ? (
          <div
            className="flex animate-fade-in items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{register.error.message}</span>
          </div>
        ) : null}

        <Field label="Full name">
          <Input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder="Your name"
            icon={<User className="h-4 w-4" />}
          />
        </Field>

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
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
            placeholder="Minimum 8 characters"
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

        {/* Strength meter */}
        <div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors duration-300',
                  index < passed ? strengthTone : 'bg-muted',
                )}
              />
            ))}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
            {rules.map((rule) => {
              const ok = rule.test(password);
              return (
                <span
                  key={rule.label}
                  className={cn(
                    'flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors',
                    ok ? 'text-success' : 'text-muted-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full transition-colors',
                      ok ? 'bg-success' : 'bg-muted-foreground/40',
                    )}
                  />
                  {rule.label}
                </span>
              );
            })}
          </div>
        </div>

        <Button
          type="submit"
          block
          size="lg"
          loading={register.isPending}
          trailingIcon={<ArrowRight className="h-4 w-4" />}
        >
          {register.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-7 text-center text-xs text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-bold text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-primary"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
