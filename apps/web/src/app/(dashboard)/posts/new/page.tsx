'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Eye,
  MessageSquare,
  Save,
  Send,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';
import type { SocialAccount } from '@/hooks/use-connected-accounts';
import { useSession } from '@/hooks/use-auth';
import { LinkedInMark } from '@/components/brand/marks';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { InlineNotice, PageHeader, Panel, ProgressBar } from '@/components/ui/product';
import { cn } from '@/lib/utils';

type SocialPlatform = 'linkedin' | 'twitter' | 'instagram' | 'facebook' | 'threads';

const PLATFORM_LIMITS: Record<SocialPlatform, number> = {
  linkedin: 3000,
  twitter: 280,
  instagram: 2200,
  facebook: 63206,
  threads: 500,
};

interface CreatePostInput {
  content: string;
  platform: SocialPlatform;
  socialAccountId?: string;
  status: 'draft' | 'scheduled';
  scheduledAt?: string;
}

async function fetchAccounts(): Promise<SocialAccount[]> {
  const res = await fetch('/api/social-accounts', { credentials: 'include' });
  if (!res.ok) return [];
  return (await res.json()).data || [];
}

async function createPost(data: CreatePostInput) {
  const res = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Failed to create post');
  return json.data;
}

export default function NewPostPage() {
  const router = useRouter();
  const { data: user } = useSession();
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState<SocialPlatform>('linkedin');
  const [accountId, setAccountId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);

  const { data: accounts = [] } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: fetchAccounts,
  });

  // Load AI draft content if coming from the AI writer.
  useEffect(() => {
    const draft = sessionStorage.getItem('ai_draft_content');
    if (draft) {
      setContent(draft);
      sessionStorage.removeItem('ai_draft_content');
    }
  }, []);

  useEffect(() => {
    const linkedIn = accounts.find((account) => account.provider === 'linkedin');
    if (linkedIn) setAccountId(linkedIn.id);
  }, [accounts]);

  const save = useMutation({
    mutationFn: (status: 'draft' | 'scheduled') =>
      createPost({
        content,
        platform,
        socialAccountId: accountId || undefined,
        status,
        scheduledAt:
          status === 'scheduled' && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      }),
    onSuccess: (_, status) => {
      router.push(
        status === 'draft' ? '/platform/linkedin?tab=drafts' : '/platform/linkedin?tab=scheduled',
      );
    },
  });

  const limit = PLATFORM_LIMITS[platform] || 3000;
  const charCount = content.length;
  const overLimit = charCount > limit;
  const usage = (charCount / limit) * 100;

  const activeAccount = accounts.find((account) => account.id === accountId);
  const displayName = activeAccount?.providerName || user?.name || 'Your name';

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <Link
        href="/posts"
        className="group inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Back to pipeline
      </Link>

      <PageHeader
        eyebrow="Compose"
        title="Create post"
        description="Write or paste your content, preview how it lands, then save it as a draft or schedule it."
        actions={
          <Link
            href="/platform/linkedin?tab=suggestions"
            className="btn-secondary h-9 px-3.5 text-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Generate with AI
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        {/* ── Editor ───────────────────────────────────────────────────── */}
        <div className="space-y-5">
          <Panel className="space-y-5 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Platform">
                <Select
                  value={platform}
                  onChange={(event) => setPlatform(event.target.value as SocialPlatform)}
                  options={[{ value: 'linkedin', label: 'LinkedIn' }]}
                />
              </Field>
              <Field label="Account">
                <Select
                  value={accountId}
                  onChange={(event) => setAccountId(event.target.value)}
                  options={accounts
                    .filter((account) => account.provider === platform)
                    .map((account) => ({
                      value: account.id,
                      label: account.providerName || account.providerUsername || 'Connected account',
                    }))}
                />
              </Field>
            </div>

            <Field
              label="Content"
              hint={
                <span className={cn(overLimit && 'text-destructive')}>
                  {charCount} / {limit}
                </span>
              }
            >
              <Textarea
                rows={12}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="What's on your mind? Write your post here…"
                className={cn('min-h-64 text-[13px]', overLimit && 'border-destructive/60')}
              />
            </Field>

            <ProgressBar
              value={Math.min(usage, 100)}
              tone={overLimit ? 'danger' : usage > 85 ? 'warning' : 'primary'}
              className="h-1.5"
            />

            {showSchedule ? (
              <Field label="Schedule date & time" className="animate-fade-in">
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </Field>
            ) : null}

            {save.error ? (
              <InlineNotice
                title="Could not save this post"
                tone="danger"
                icon={<AlertCircle className="h-4 w-4" />}
              >
                {(save.error as Error).message}
              </InlineNotice>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 border-t border-border/70 pt-4">
              <Button
                variant="secondary"
                onClick={() => save.mutate('draft')}
                disabled={!content.trim() || save.isPending || overLimit}
                icon={<Save className="h-4 w-4" />}
              >
                Save draft
              </Button>

              <Button
                variant="secondary"
                onClick={() => setShowSchedule((open) => !open)}
                icon={<Clock className="h-4 w-4" />}
              >
                {showSchedule ? 'Hide schedule' : 'Schedule'}
              </Button>

              <div className="ml-auto">
                {showSchedule && scheduledAt ? (
                  <Button
                    onClick={() => save.mutate('scheduled')}
                    disabled={!content.trim() || overLimit}
                    loading={save.isPending}
                    icon={<Clock className="h-4 w-4" />}
                  >
                    Schedule post
                  </Button>
                ) : (
                  <Button
                    onClick={() => save.mutate('draft')}
                    disabled={!content.trim() || overLimit}
                    loading={save.isPending}
                    icon={<Send className="h-4 w-4" />}
                  >
                    Save & continue
                  </Button>
                )}
              </div>
            </div>
          </Panel>
        </div>

        {/* ── Live preview ─────────────────────────────────────────────── */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-muted/25 px-5 py-3.5">
              <h2 className="flex items-center gap-2 text-xs font-bold">
                <Eye className="h-3.5 w-3.5 text-primary" />
                Live preview
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {platform}
              </span>
            </div>

            <div className="p-5">
              <div className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-center gap-3">
                  {activeAccount?.providerAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeAccount.providerAvatar}
                      alt={displayName}
                      className="h-11 w-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{displayName}</p>
                    <p className="truncate font-mono text-[10px] text-muted-foreground">
                      Now · Visible to anyone
                    </p>
                  </div>
                  <span
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-white"
                    style={{ backgroundColor: '#0A66C2' }}
                  >
                    <LinkedInMark className="h-3.5 w-3.5" />
                  </span>
                </div>

                <div className="mt-4 min-h-24">
                  {content.trim() ? (
                    <p className="whitespace-pre-wrap text-[13px] leading-6">{content}</p>
                  ) : (
                    <p className="text-[13px] leading-6 text-muted-foreground/60">
                      Your post appears here as you type. Line breaks and hashtags render exactly as
                      they will on the feed.
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-5 border-t border-border pt-3 text-muted-foreground">
                  {[
                    { icon: ThumbsUp, label: 'Like' },
                    { icon: MessageSquare, label: 'Comment' },
                    { icon: Send, label: 'Share' },
                  ].map((action) => {
                    const Icon = action.icon;
                    return (
                      <span key={action.label} className="flex items-center gap-1.5 text-[11px] font-medium">
                        <Icon className="h-3.5 w-3.5" />
                        {action.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <p className="mt-4 text-[11px] leading-6 text-muted-foreground">
                This is a rendering preview only. Engagement numbers appear once the post is
                published and the platform returns verified values.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
