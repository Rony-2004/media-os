'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useRegister } from '@/hooks/use-auth';

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
        <h1 className="text-3xl font-black tracking-[-0.04em]">Create your account.</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Set up a focused home for your social content.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {register.error ? (
          <div className="rounded-xl border border-primary/25 bg-primary/10 p-3 text-sm text-primary" role="alert">
            {register.error.message}
          </div>
        ) : null}

        {[
          { id: 'name', label: 'Full name', type: 'text', value: name, setValue: setName, autoComplete: 'name', placeholder: 'Your name' },
          { id: 'email', label: 'Email address', type: 'email', value: email, setValue: setEmail, autoComplete: 'email', placeholder: 'you@example.com' },
          { id: 'password', label: 'Password', type: 'password', value: password, setValue: setPassword, autoComplete: 'new-password', placeholder: 'Minimum 8 characters' },
        ].map((field) => (
          <label key={field.id} className="block" htmlFor={field.id}>
            <span className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-[0.14em]">
              {field.label}
            </span>
            <input
              id={field.id}
              type={field.type}
              value={field.value}
              onChange={(event) => field.setValue(event.target.value)}
              autoComplete={field.autoComplete}
              minLength={field.id === 'password' ? 8 : undefined}
              required
              className="product-input"
              placeholder={field.placeholder}
            />
          </label>
        ))}

        <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
          Password: 8+ characters · 1 uppercase · 1 number
        </p>

        <button type="submit" disabled={register.isPending} className="product-button-primary mt-2 w-full">
          {register.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {register.isPending ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-7 text-center text-xs text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">
          Sign in
        </Link>
      </p>
    </div>
  );
}
