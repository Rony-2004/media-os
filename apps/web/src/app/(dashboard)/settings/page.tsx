'use client';

import { useSession } from '@/hooks/use-auth';
import { User, Shield, Bell, Key, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const { data: user } = useSession();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold text-lg">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Account & Platform Settings</h1>
            <p className="text-slate-300 text-xs mt-0.5">
              Manage your personal credentials, active sessions, security preferences, and data privacy.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="glass-card rounded-2xl p-6 border space-y-4">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            User Profile Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">Full Name</label>
              <input
                type="text"
                defaultValue={user?.name || ''}
                readOnly
                className="w-full px-3 py-2 text-xs rounded-xl bg-muted/50 border border-border text-foreground font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">Email Address</label>
              <input
                type="email"
                defaultValue={user?.email || ''}
                readOnly
                className="w-full px-3 py-2 text-xs rounded-xl bg-muted/50 border border-border text-foreground font-medium"
              />
            </div>
          </div>
        </div>

        {/* Security & Authentication */}
        <div className="glass-card rounded-2xl p-6 border space-y-4">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Security & Authentication
          </h2>

          <div className="p-4 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-foreground">Password & Sessions</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Protected by SHA-256 JWT refresh token rotation and bcrypt encryption.
              </p>
            </div>
            <button className="px-3.5 py-1.5 bg-muted hover:bg-accent text-foreground text-xs font-semibold rounded-xl transition-colors">
              Change Password
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass-card rounded-2xl p-6 border border-rose-500/30 space-y-3 bg-rose-500/5">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Danger Zone
          </h2>
          <p className="text-xs text-muted-foreground">
            Permanently delete your user account, connected social accounts, AI voice profiles, and all scheduled posts.
          </p>
          <button className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all">
            Delete Account Data
          </button>
        </div>
      </div>
    </div>
  );
}
