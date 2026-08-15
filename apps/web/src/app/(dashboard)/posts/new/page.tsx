'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Sparkles, Save, Send, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';

const PLATFORM_LIMITS: Record<string, number> = {
  linkedin: 3000,
  twitter: 280,
  instagram: 2200,
};

async function fetchAccounts() {
  const res = await fetch('/api/social-accounts', { credentials: 'include' });
  if (!res.ok) return [];
  return (await res.json()).data || [];
}

async function createPost(data: any) {
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
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState('linkedin');
  const [accountId, setAccountId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);

  const { data: accounts = [] } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: fetchAccounts,
  });

  // Load AI draft content if coming from AI Writer
  useEffect(() => {
    const draft = sessionStorage.getItem('ai_draft_content');
    if (draft) {
      setContent(draft);
      sessionStorage.removeItem('ai_draft_content');
    }
  }, []);

  useEffect(() => {
    const linkedIn = accounts.find((a: any) => a.provider === 'linkedin');
    if (linkedIn) setAccountId(linkedIn.id);
  }, [accounts]);

  const save = useMutation({
    mutationFn: (status: 'draft' | 'scheduled') =>
      createPost({
        content,
        platform,
        socialAccountId: accountId || undefined,
        status,
        scheduledAt: status === 'scheduled' && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      }),
    onSuccess: (_, status) => {
      router.push(status === 'draft' ? '/drafts' : '/posts');
    },
  });

  const limit = PLATFORM_LIMITS[platform] || 3000;
  const charCount = content.length;
  const overLimit = charCount > limit;

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <Link
        href="/posts"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Posts
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create Post</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Write or paste your content below</p>
      </div>

      <div className="space-y-4">
        {/* Platform + Account */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="linkedin">LinkedIn</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {accounts.filter((a: any) => a.provider === platform).map((a: any) => (
                <option key={a.id} value={a.id}>{a.providerName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content editor */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Content</label>
          <textarea
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Write your post here..."
            className="w-full px-4 py-3 border rounded-xl bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex items-center justify-between mt-1.5">
            <Link
              href="/ai-writer"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Generate with AI
            </Link>
            <span className={`text-xs font-medium ${overLimit ? 'text-red-500' : 'text-muted-foreground'}`}>
              {charCount} / {limit}
            </span>
          </div>
        </div>

        {/* Schedule date */}
        {showSchedule && (
          <div>
            <label className="block text-sm font-medium mb-1.5">Schedule Date & Time</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        {/* Error */}
        {save.error && (
          <div className="text-sm text-red-500 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            {(save.error as Error).message}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => save.mutate('draft')}
            disabled={!content.trim() || save.isPending || overLimit}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-accent disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </button>

          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-accent"
          >
            <Clock className="h-4 w-4" />
            {showSchedule ? 'Hide Schedule' : 'Schedule'}
          </button>

          {showSchedule && scheduledAt ? (
            <button
              onClick={() => save.mutate('scheduled')}
              disabled={!content.trim() || save.isPending || overLimit}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
              Schedule Post
            </button>
          ) : (
            <button
              onClick={() => save.mutate('draft')}
              disabled={!content.trim() || save.isPending || overLimit}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 ml-auto"
            >
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publish Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
