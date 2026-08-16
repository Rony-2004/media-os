'use client';

import { KeyRound, Mail, Palette, Shield, Trash2, User } from 'lucide-react';
import { useSession } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { ThemeToggle } from '@/components/theme-toggle';
import { PageHeader, Panel, PanelSection, StatusBadge } from '@/components/ui/product';

export default function SettingsPage() {
  const { data: user } = useSession();

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Manage your account profile, appearance, session security, and data controls."
        actions={<StatusBadge tone="success" dot>Active session</StatusBadge>}
      />

      {/* Profile summary */}
      <Panel className="flex flex-col items-start gap-5 overflow-hidden p-6 sm:flex-row sm:items-center">
        <div className="aurora">
          <span className="left-[-4%] top-[-100%] h-48 w-48 animate-drift bg-primary/25" />
        </div>
        <span className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-2xl font-bold text-white shadow-glow">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </span>
        <div className="relative min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold tracking-tight">{user?.name || 'User'}</h2>
          <p className="truncate font-mono text-xs text-muted-foreground">{user?.email}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge tone="dark">{user?.plan || 'FREE'} plan</StatusBadge>
            <StatusBadge tone={user?.role === 'ADMIN' ? 'danger' : 'neutral'}>
              {user?.role || 'USER'}
            </StatusBadge>
            {user?.emailVerified ? <StatusBadge tone="success">Verified</StatusBadge> : null}
          </div>
        </div>
      </Panel>

      <div className="stagger space-y-5">
        <PanelSection
          title="Profile information"
          icon={<User className="h-4 w-4" />}
          description="Read-only for now — profile editing arrives with the account API."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <Input defaultValue={user?.name || ''} readOnly className="bg-muted/40" />
            </Field>
            <Field label="Email address">
              <Input
                type="email"
                defaultValue={user?.email || ''}
                readOnly
                className="bg-muted/40"
                icon={<Mail className="h-4 w-4" />}
              />
            </Field>
          </div>
        </PanelSection>

        <PanelSection
          title="Appearance"
          icon={<Palette className="h-4 w-4" />}
          description="Applies instantly and is remembered on this device."
        >
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4">
            <div>
              <p className="text-xs font-bold">Colour theme</p>
              <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">
                Light, dark, or follow your operating system.
              </p>
            </div>
            <ThemeToggle />
          </div>
        </PanelSection>

        <PanelSection
          title="Security & authentication"
          icon={<Shield className="h-4 w-4" />}
          description="How your session is protected."
        >
          <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <KeyRound className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold">Password & sessions</p>
                <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">
                  Protected by bcrypt hashing and rotating JWT refresh tokens.
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" className="w-full sm:w-auto">
              Change password
            </Button>
          </div>
        </PanelSection>

        {/* Danger zone */}
        <Panel className="overflow-hidden border-destructive/30">
          <div className="flex items-center gap-2 border-b border-destructive/25 bg-destructive/5 px-5 py-4">
            <Trash2 className="h-4 w-4 text-destructive" />
            <h2 className="text-sm font-bold text-destructive">Danger zone</h2>
          </div>
          <div className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
            <p className="max-w-xl text-xs leading-6 text-muted-foreground">
              Permanently delete your user account, connected social accounts, AI voice profiles, and
              all scheduled posts. This cannot be undone.
            </p>
            <Button variant="danger" size="sm" className="w-full shrink-0 sm:w-auto">
              Delete account data
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
