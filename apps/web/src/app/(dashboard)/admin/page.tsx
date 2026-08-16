'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  Edit3,
  Lock,
  Search,
  Sparkles,
  Unlock,
  UserX,
  Users,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import {
  CardSkeleton,
  MetricCard,
  PageHeader,
  Panel,
  StatusBadge,
} from '@/components/ui/product';
import { cn } from '@/lib/utils';

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

const planTone: Record<string, 'success' | 'primary' | 'neutral'> = {
  PRO: 'success',
  ENTERPRISE: 'primary',
  FREE: 'neutral',
};

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
      u.email.toLowerCase().includes(search.toLowerCase()),
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
    updateUser.mutate({ id: user.id, isBlocked: !user.isBlocked });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <PageHeader
        eyebrow="Platform operations"
        title="Admin control centre"
        description="Manage users, access state, plan assignments, and weekly publishing limits."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <StatusBadge tone="danger" dot>
              Superadmin
            </StatusBadge>
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or email…"
              icon={<Search className="h-3.5 w-3.5" />}
              className="h-10 w-full text-xs sm:w-64"
            />
          </div>
        }
      />

      <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Total users"
          value={totalUsers}
          accent="info"
          icon={<Users className="h-4 w-4" />}
          hint="Registered accounts"
        />
        <MetricCard
          label="Paid subscribers"
          value={proUsers}
          accent="success"
          icon={<Zap className="h-4 w-4" />}
          hint="Pro & Enterprise"
        />
        <MetricCard
          label="Free plan"
          value={freeUsers}
          accent="warning"
          icon={<Sparkles className="h-4 w-4" />}
          hint="Default: 2 posts / week"
        />
        <MetricCard
          label="Blocked"
          value={blockedUsers}
          accent="danger"
          icon={<UserX className="h-4 w-4" />}
          hint="Access suspended"
        />
      </div>

      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-border/70 bg-muted/25 px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight">
            <Users className="h-4 w-4 text-primary" />
            User access & quota
          </h2>
          <span className="font-mono text-[10px] text-muted-foreground">
            {filteredUsers.length} of {totalUsers}
          </span>
        </div>

        {isLoading ? (
          <div className="p-5">
            <CardSkeleton count={3} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="p-12 text-center text-sm text-muted-foreground">
            No users match “{search}”.
          </p>
        ) : (
          <>
            {/* Table — desktop */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border/70 bg-muted/25">
                  <tr className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">User</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Plan</th>
                    <th className="px-5 py-3 font-semibold">Weekly quota</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="transition-colors hover:bg-muted/25">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-bold">{u.name}</p>
                            <p className="truncate font-mono text-[10px] text-muted-foreground">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge tone={u.role === 'ADMIN' ? 'danger' : 'neutral'}>
                          {u.role || 'USER'}
                        </StatusBadge>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge tone={planTone[u.plan] ?? 'neutral'}>{u.plan || 'FREE'}</StatusBadge>
                      </td>
                      <td className="px-5 py-3.5 font-medium tabular-nums">
                        {u.weeklyPostLimit || 2} / week
                      </td>
                      <td className="px-5 py-3.5">
                        {u.isBlocked ? (
                          <StatusBadge tone="danger">
                            <Lock className="h-3 w-3" /> Blocked
                          </StatusBadge>
                        ) : (
                          <StatusBadge tone="success" dot>
                            Active
                          </StatusBadge>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => handleStartEdit(u)}
                            icon={<Edit3 className="h-3 w-3" />}
                          >
                            Edit
                          </Button>
                          <Button
                            variant={u.isBlocked ? 'success' : 'danger'}
                            size="xs"
                            onClick={() => handleToggleBlock(u)}
                            disabled={updateUser.isPending}
                            icon={
                              u.isBlocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />
                            }
                          >
                            {u.isBlocked ? 'Unblock' : 'Block'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards — mobile */}
            <div className="divide-y divide-border/70 lg:hidden">
              {filteredUsers.map((u) => (
                <div key={u.id} className="space-y-3 p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                      {u.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{u.name}</p>
                      <p className="truncate font-mono text-[10px] text-muted-foreground">{u.email}</p>
                    </div>
                    {u.isBlocked ? (
                      <StatusBadge tone="danger">
                        <Lock className="h-3 w-3" />
                      </StatusBadge>
                    ) : (
                      <StatusBadge tone="success" dot>
                        Active
                      </StatusBadge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={u.role === 'ADMIN' ? 'danger' : 'neutral'}>
                      {u.role || 'USER'}
                    </StatusBadge>
                    <StatusBadge tone={planTone[u.plan] ?? 'neutral'}>{u.plan || 'FREE'}</StatusBadge>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {u.weeklyPostLimit || 2} posts / week
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleStartEdit(u)}
                      icon={<Edit3 className="h-3 w-3" />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant={u.isBlocked ? 'success' : 'danger'}
                      size="sm"
                      onClick={() => handleToggleBlock(u)}
                      disabled={updateUser.isPending}
                      icon={u.isBlocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    >
                      {u.isBlocked ? 'Unblock' : 'Block'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Panel>

      {/* Edit modal */}
      <Modal
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={editingUser ? `Manage ${editingUser.name}` : 'Manage user'}
        description="Role, plan, and weekly publishing allowance."
        icon={<Edit3 className="h-4 w-4" />}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              loading={updateUser.isPending}
              icon={<Check className="h-3.5 w-3.5" />}
            >
              Save settings
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="User name">
            <Input value={editName} onChange={(event) => setEditName(event.target.value)} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role">
              <Select
                value={editRole}
                onChange={(event) => setEditRole(event.target.value)}
                options={[
                  { value: 'USER', label: 'USER' },
                  { value: 'ADMIN', label: 'ADMIN' },
                ]}
              />
            </Field>

            <Field label="Subscription plan">
              <Select
                value={editPlan}
                onChange={(event) => {
                  const val = event.target.value;
                  setEditPlan(val);
                  if (val === 'FREE') setEditLimit(2);
                  else if (val === 'PRO') setEditLimit(25);
                  else if (val === 'ENTERPRISE') setEditLimit(100);
                }}
                options={[
                  { value: 'FREE', label: 'FREE — 2 / week' },
                  { value: 'PRO', label: 'PRO — 25 / week' },
                  { value: 'ENTERPRISE', label: 'ENTERPRISE — 100 / week' },
                ]}
              />
            </Field>
          </div>

          <Field
            label="Weekly post quota"
            help="Defaults: 2 for FREE, 25 for PRO, 100 for ENTERPRISE."
          >
            <Input
              type="number"
              min={1}
              max={500}
              value={editLimit}
              onChange={(event) => setEditLimit(parseInt(event.target.value, 10) || 2)}
            />
          </Field>

          {editingUser?.isBlocked ? (
            <div
              className={cn(
                'flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive',
              )}
            >
              <Lock className="h-4 w-4 shrink-0" />
              This account is currently blocked and cannot sign in.
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
