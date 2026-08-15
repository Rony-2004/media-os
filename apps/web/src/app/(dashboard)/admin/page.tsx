'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserCheck,
  UserX,
  Zap,
  Edit3,
  Check,
  X,
  Search,
  Sliders,
  Sparkles,
  Loader2,
  Lock,
  Unlock,
  Shield,
  ArrowUpRight,
} from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/ui/product';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  isBlocked: boolean;
  plan: string;
  weeklyPostLimit: number;
  isActive: boolean;
  createdAt: string;
  _count?: {
    posts: number;
    socialAccounts: number;
  };
}

async function fetchAdminUsers(): Promise<ManagedUser[]> {
  const res = await fetch('/api/admin/users', { credentials: 'include' });
  if (!res.ok) return [];
  return (await res.json()).data || [];
}

async function updateAdminUser(payload: {
  id: string;
  name?: string;
  role?: string;
  isBlocked?: boolean;
  plan?: string;
  weeklyPostLimit?: number;
}) {
  const res = await fetch(`/api/admin/users/${payload.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update user');
  return (await res.json()).data;
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('USER');
  const [editPlan, setEditPlan] = useState('FREE');
  const [editLimit, setEditLimit] = useState(2);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchAdminUsers,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const updateUser = useMutation({
    mutationFn: updateAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingUser(null);
    },
  });

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = users.length;
  const blockedUsers = users.filter((u) => u.isBlocked).length;
  const proUsers = users.filter((u) => u.plan === 'PRO' || u.plan === 'ENTERPRISE').length;
  const freeUsers = users.filter((u) => u.plan === 'FREE').length;

  const handleStartEdit = (user: ManagedUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role || 'USER');
    setEditPlan(user.plan || 'FREE');
    setEditLimit(user.weeklyPostLimit || 2);
  };

  const handleSaveEdit = () => {
    if (!editingUser) return;
    updateUser.mutate({
      id: editingUser.id,
      name: editName,
      role: editRole,
      plan: editPlan,
      weeklyPostLimit: editLimit,
    });
  };

  const handleToggleBlock = (user: ManagedUser) => {
    updateUser.mutate({
      id: user.id,
      isBlocked: !user.isBlocked,
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <PageHeader
        eyebrow="Platform operations"
        title="Admin control centre"
        description="Manage users, access state, plan assignments, and weekly publishing limits."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <StatusBadge tone="danger">Superadmin</StatusBadge>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users by name or email..."
                className="product-input h-10 w-full pl-9 text-xs sm:w-64"
              />
            </div>
          </div>
        }
      />

      {/* Admin Analytics Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="glass-card rounded-xl p-4 border border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">Total Users</span>
            <Users className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <span className="text-xl font-bold text-foreground block">{totalUsers} Registered</span>
        </div>

        <div className="glass-card rounded-xl p-4 border border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">Pro Subscribers</span>
            <Zap className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <span className="text-xl font-bold text-foreground block">{proUsers} Paid Users</span>
        </div>

        <div className="glass-card rounded-xl p-4 border border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">Free Plan Users</span>
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <span className="text-xl font-bold text-foreground block">{freeUsers} Users</span>
          <span className="text-[10px] text-muted-foreground font-medium mt-1 block">Default: 2 posts/week</span>
        </div>

        <div className="glass-card rounded-xl p-4 border border-border bg-card">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">Blocked Accounts</span>
            <UserX className="h-3.5 w-3.5 text-rose-500" />
          </div>
          <span className="text-xl font-bold text-foreground block">{blockedUsers} Blocked</span>
        </div>
      </div>

      {/* User Management Table */}
      <div className="glass-card rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Users className="h-4 w-4 text-rose-500" />
            User Access & Quota Table ({filteredUsers.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading registered users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">No users found matching your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-[11px] font-bold text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3">User Profile</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Subscription Plan</th>
                  <th className="px-4 py-3">Weekly Quota</th>
                  <th className="px-4 py-3">Account Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-500/20">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{u.name}</p>
                          <p className="text-[11px] text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-semibold">
                      {u.role === 'ADMIN' ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold text-[10px]">
                          ADMIN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px]">
                          USER
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                          u.plan === 'PRO'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : u.plan === 'ENTERPRISE'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {u.plan || 'FREE'}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-medium text-foreground">
                      {u.weeklyPostLimit || 2} posts / week
                    </td>

                    <td className="px-4 py-3">
                      {u.isBlocked ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-bold flex items-center gap-1 w-fit">
                          <Lock className="h-3 w-3" />
                          Blocked
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1 w-fit">
                          <Check className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleStartEdit(u)}
                          className="px-2.5 py-1 bg-muted hover:bg-accent text-foreground rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1"
                        >
                          <Edit3 className="h-3 w-3" />
                          Edit / Plan
                        </button>

                        <button
                          onClick={() => handleToggleBlock(u)}
                          disabled={updateUser.isPending}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                            u.isBlocked
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {u.isBlocked ? (
                            <>
                              <Unlock className="h-3 w-3" /> Unblock
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3" /> Block
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT USER & PLAN MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl max-w-md w-full p-6 space-y-5 border border-border shadow-2xl animate-fade-in relative">
            <div className="flex items-center justify-between border-b border-border pb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                  <Edit3 className="h-3.5 w-3.5" />
                </div>
                <h3 className="font-bold text-sm text-foreground">
                  Manage User: {editingUser.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">User Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground block">User Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-xs font-medium cursor-pointer"
                  >
                    <option value="USER" className="bg-background text-foreground">USER</option>
                    <option value="ADMIN" className="bg-background text-foreground">ADMIN</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground block">Subscription Plan</label>
                  <select
                    value={editPlan}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditPlan(val);
                      if (val === 'FREE') setEditLimit(2);
                      else if (val === 'PRO') setEditLimit(25);
                      else if (val === 'ENTERPRISE') setEditLimit(100);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-xs font-semibold cursor-pointer"
                  >
                    <option value="FREE" className="bg-background text-foreground">FREE (2 posts/wk)</option>
                    <option value="PRO" className="bg-background text-foreground">PRO (25 posts/wk)</option>
                    <option value="ENTERPRISE" className="bg-background text-foreground">ENTERPRISE (100 posts/wk)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">Weekly Post Quota Allowance</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={editLimit}
                  onChange={(e) => setEditLimit(parseInt(e.target.value) || 2)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-xs font-medium"
                />
                <span className="text-[10px] text-muted-foreground block pt-0.5">
                  Default: 2 posts/week for FREE, 25 for PRO, 100 for ENTERPRISE.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={updateUser.isPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {updateUser.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Save User Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
