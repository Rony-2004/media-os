'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Calendar as CalendarIcon,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Hash,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  ThumbsUp,
  UserCheck,
  Wand2,
  X,
} from 'lucide-react';
import { readApiResponse } from '@/lib/api-response';
import { useBrandVoice, useUpdateBrandVoice } from '@/hooks/use-brand-voice';
import { LinkedInMark } from '@/components/brand/marks';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Tabs, TabPanel } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/field';
import {
  CardSkeleton,
  EmptyState,
  InlineNotice,
  LiveDot,
  MetricCard,
  Panel,
  StatusBadge,
} from '@/components/ui/product';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Suggestion {
  id: string;
  trend: string;
  category: string;
  velocity: string;
  source: string;
  content: string;
  platform: string;
  scheduledAt: string;
  characterCount: number;
  imageUrl?: string;
}

interface Post {
  id: string;
  content: string;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  aiGenerated: boolean;
  createdAt: string;
  platformPostId?: string | null;
  platformPostUrl?: string | null;
  metadata?: {
    linkedInUrl?: string | null;
    linkedInPostId?: string | null;
    likes?: number | null;
    comments?: number | null;
    views?: number | null;
    hasRealStats?: boolean;
    lastSyncedAt?: string | null;
  };
  engagementSync?: {
    status: string;
    message?: string;
    cached?: boolean;
    syncedAt?: string | null;
  };
}

interface PostComment {
  id: string;
  linkedInCommentId: string;
  postId: string;
  postUrn: string;
  postTitle: string;
  commenterName: string;
  commenterHeadline: string | null;
  commenterAvatar: string | null;
  commentText: string;
  createdAt: string | null;
  likes: number;
  aiReplyText: string;
  status: 'pending_review' | 'sent';
}

interface CommentsResponse {
  comments: PostComment[];
  sync: { status: string; message?: string; partial?: boolean };
}

type TabId = 'suggestions' | 'scheduled' | 'published' | 'drafts' | 'comments';

// ─── API calls ───────────────────────────────────────────────────────────────

async function fetchSuggestions(): Promise<Suggestion[]> {
  const res = await fetch('/api/ai/suggestions', { credentials: 'include' });
  const payload = await readApiResponse<{
    data?: { suggestions?: Suggestion[] };
    error?: { message?: string };
  }>(res);
  if (!res.ok) {
    throw new Error(payload.error?.message || 'AI suggestions could not be generated.');
  }
  return payload.data?.suggestions || [];
}

async function fetchPosts(platform: string): Promise<Post[]> {
  const res = await fetch(`/api/posts?platform=${platform}`, { credentials: 'include' });
  if (!res.ok) return [];
  return (await res.json()).data || [];
}

async function approveSuggestions(payload: {
  action: 'approve_all' | 'approve_one' | 'reject_one';
  suggestions: Suggestion[];
}) {
  const res = await fetch('/api/ai/suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed');
  return (await res.json()).data;
}

// ─── Platform meta ───────────────────────────────────────────────────────────

const PLATFORM_META: Record<string, { name: string; color: string; logo: React.ReactNode }> = {
  linkedin: {
    name: 'LinkedIn',
    color: '#0A66C2',
    logo: <LinkedInMark className="h-5 w-5" />,
  },
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PlatformPage() {
  const { provider } = useParams<{ provider: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('suggestions');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<Record<string, string>>({});
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);
  const [editingReply, setEditingReply] = useState<Record<string, string>>({});
  const [sendingReplyId, setSendingReplyId] = useState<string | null>(null);
  const [sentReplies, setSentReplies] = useState<Set<string>>(new Set());
  const [replyError, setReplyError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const { data: brandVoice } = useBrandVoice();
  const updateVoice = useUpdateBrandVoice();
  const autoApprove = brandVoice?.autoApprove ?? false;
  // Suggestion ids already handed to the agent, so a re-render never queues twice.
  const autoApproved = useRef<Set<string>>(new Set());

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get('tab');
    if (['suggestions', 'scheduled', 'published', 'drafts', 'comments'].includes(requestedTab || '')) {
      setActiveTab(requestedTab as TabId);
    }
  }, []);

  const meta = PLATFORM_META[provider] || {
    name: provider,
    color: 'hsl(var(--muted-foreground))',
    logo: null,
  };

  const {
    data: suggestions = [],
    isLoading: suggestionsLoading,
    isError: suggestionsFailed,
    error: suggestionsError,
    refetch: refetchSuggestions,
    isFetching: suggestionsFetching,
  } = useQuery({
    queryKey: ['suggestions'],
    queryFn: fetchSuggestions,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['posts', provider],
    queryFn: () => fetchPosts(provider),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 60000,
  });

  const { data: commentsData } = useQuery<CommentsResponse>({
    queryKey: ['comments', provider],
    queryFn: async () => {
      const res = await fetch('/api/comments', { credentials: 'include' });
      if (!res.ok) throw new Error('Comments could not be loaded.');
      return (await res.json()).data;
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 60000,
  });
  const commentsList = commentsData?.comments ?? [];

  const approve = useMutation({
    mutationFn: approveSuggestions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (postId: string) => {
      setPublishError(null);
      const res = await fetch(`/api/posts/${postId}/publish`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to publish to LinkedIn');
      }
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
    },
    onError: (err: any) => {
      setPublishError(err.message);
    },
  });

  const convertDraftMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: 'scheduled',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Failed to schedule draft');
      return (await res.json()).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
    },
  });

  const visibleSuggestions = suggestions.filter((s) => !dismissed.has(s.id));
  const scheduledPosts = posts.filter((p) => p.status === 'scheduled');
  const publishedPosts = posts.filter((p) => p.status === 'published');
  const draftPosts = posts.filter((p) => p.status === 'draft');
  const syncFailures = publishedPosts.filter(
    (post) => post.engagementSync && post.engagementSync.status !== 'ok',
  );
  const syncIsLive = publishedPosts.length > 0 && syncFailures.length === 0;

  // In agent mode the queue is filled without a review step. Publishing itself
  // still requires an explicit action — nothing reaches LinkedIn unattended.
  useEffect(() => {
    if (!autoApprove || approve.isPending) return;

    const pending = visibleSuggestions.filter((s) => !autoApproved.current.has(s.id));
    if (pending.length === 0) return;

    pending.forEach((s) => autoApproved.current.add(s.id));
    approve.mutate({
      action: 'approve_all',
      suggestions: pending.map((s) => ({ ...s, content: editingContent[s.id] || s.content })),
    });
    setDismissed((prev) => {
      const next = new Set(prev);
      pending.forEach((s) => next.add(s.id));
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoApprove, visibleSuggestions, approve.isPending]);

  const handleApproveAll = () => {
    approve.mutate({
      action: 'approve_all',
      suggestions: visibleSuggestions.map((s) => ({
        ...s,
        content: editingContent[s.id] || s.content,
      })),
    });
    setDismissed(new Set(visibleSuggestions.map((s) => s.id)));
  };

  const handleApproveOne = (s: Suggestion) => {
    const finalContent = editingContent[s.id] || s.content;
    approve.mutate({
      action: 'approve_one',
      suggestions: [{ ...s, content: finalContent }],
    });
    setDismissed((prev) => new Set(prev).add(s.id));
  };

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  const handleSendCommentReply = async (comment: PostComment, currentText: string) => {
    setSendingReplyId(comment.id);
    setReplyError(null);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'post_reply',
          postUrn: comment.postUrn,
          replyText: currentText,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error?.message || 'LinkedIn rejected the reply.');
      setSentReplies((prev) => new Set(prev).add(comment.id));
      queryClient.invalidateQueries({ queryKey: ['comments', provider] });
      queryClient.invalidateQueries({ queryKey: ['posts', provider] });
    } catch (error) {
      setReplyError(error instanceof Error ? error.message : 'The reply could not be published.');
    } finally {
      setSendingReplyId(null);
    }
  };

  const handleGenerateReply = async (comment: PostComment) => {
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'generate_reply',
          commentText: comment.commentText,
          postText: comment.postTitle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Reply generation failed.');
      if (data.data?.replyText) {
        setEditingReply((prev) => ({ ...prev, [comment.id]: data.data.replyText }));
      }
    } catch (error) {
      setReplyError(error instanceof Error ? error.message : 'Reply generation failed.');
    }
  };

  const handleAiPolish = () => {
    if (!newPostContent.trim()) return;
    setIsPolishing(true);
    setTimeout(() => {
      setNewPostContent((prev) => `${prev.trim()}\n\n#SoftwareEngineering #Backend #SystemDesign`);
      setIsPolishing(false);
    }, 600);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* ── Breadcrumb ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to dashboard
        </Link>
        <LiveDot
          live={syncIsLive}
          label={syncIsLive ? 'Live engagement synced' : 'Engagement sync needs attention'}
        />
      </div>

      {/* ── Platform header ──────────────────────────────────────────── */}
      <Panel className="animate-fade-in overflow-hidden p-0">
        <div className="relative">
          <div className="aurora">
            <span className="left-[-2%] top-[-70%] h-56 w-56 animate-drift bg-primary/25" />
            <span
              className="right-[10%] top-[-50%] h-48 w-48 animate-drift bg-accent/20"
              style={{ animationDelay: '-9s' }}
            />
          </div>

          <div className="relative flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-center gap-4">
              <span
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white shadow-soft"
                style={{ backgroundColor: meta.color }}
              >
                {meta.logo}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-[-0.03em] sm:text-2xl">
                    {meta.name} pipeline
                  </h1>
                  <StatusBadge tone="success" dot>
                    Connected
                  </StatusBadge>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Content planning, publishing, real engagement, and human-reviewed AI replies.
                </p>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <ApprovalModeToggle
                autoApprove={autoApprove}
                pending={updateVoice.isPending}
                onChange={(next) => updateVoice.mutate({ autoApprove: next })}
              />

              {visibleSuggestions.length > 0 && !autoApprove ? (
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleApproveAll}
                  loading={approve.isPending}
                  icon={<CheckCheck className="h-3.5 w-3.5" />}
                  className="flex-1 sm:flex-initial"
                >
                  Approve all ({visibleSuggestions.length})
                </Button>
              ) : null}

              <Button
                size="sm"
                onClick={() => setShowNewPostModal(true)}
                icon={<Plus className="h-3.5 w-3.5" />}
                className="flex-1 sm:flex-initial"
              >
                New post
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      {publishError ? (
        <InlineNotice
          title="Publishing failed"
          tone="danger"
          icon={<AlertCircle className="h-4 w-4" />}
          action={
            <button
              type="button"
              onClick={() => setPublishError(null)}
              aria-label="Dismiss"
              className="grid h-7 w-7 place-items-center rounded-lg text-destructive transition-colors hover:bg-destructive/15"
            >
              <X className="h-4 w-4" />
            </button>
          }
        >
          {publishError}
        </InlineNotice>
      ) : null}

      {/* ── Metrics ──────────────────────────────────────────────────── */}
      <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="AI suggestions"
          value={visibleSuggestions.length}
          accent="primary"
          icon={<Sparkles className="h-4 w-4" />}
          hint="Awaiting your review"
        />
        <MetricCard
          label="Scheduled"
          value={scheduledPosts.length}
          accent="warning"
          icon={<Clock className="h-4 w-4" />}
          hint="In the publishing queue"
        />
        <MetricCard
          label="Published"
          value={publishedPosts.length}
          accent="success"
          icon={<CheckCircle2 className="h-4 w-4" />}
          hint={`Live on ${meta.name}`}
        />
        <MetricCard
          label="Approval mode"
          value={
            <span className={cn('text-lg', autoApprove ? 'text-primary' : 'text-success')}>
              {autoApprove ? 'Agent' : 'Human'}
            </span>
          }
          accent={autoApprove ? 'primary' : 'info'}
          icon={<Bot className="h-4 w-4" />}
          hint={
            autoApprove
              ? 'Drafts queue themselves for review'
              : 'Nothing queues without your approval'
          }
        />
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <Tabs<TabId>
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { id: 'suggestions', label: 'AI suggestions', count: visibleSuggestions.length, icon: Sparkles },
          { id: 'scheduled', label: 'Scheduled', count: scheduledPosts.length, icon: Clock },
          { id: 'published', label: 'Published', count: publishedPosts.length, icon: CheckCircle2 },
          { id: 'drafts', label: 'Drafts', count: draftPosts.length, icon: FileText },
          { id: 'comments', label: 'Comments', count: commentsList.length, icon: MessageCircle },
        ]}
      />

      {/* ── Tab: suggestions ─────────────────────────────────────────── */}
      {activeTab === 'suggestions' ? (
        <TabPanel className="space-y-3">
          {autoApprove ? (
            <InlineNotice title="Agent approval is on" tone="info" icon={<Bot className="h-4 w-4" />}>
              New drafts move straight to the scheduled queue without appearing here. Publishing
              still needs an explicit action — switch to Human to review each draft first.
            </InlineNotice>
          ) : null}
          {suggestionsLoading ? (
            <CardSkeleton count={3} />
          ) : suggestionsFailed ? (
            <EmptyState
              icon={<AlertCircle className="h-6 w-6" />}
              title="AI suggestions unavailable"
              description={
                suggestionsError instanceof Error
                  ? suggestionsError.message
                  : 'AI suggestions could not be generated. Please try again.'
              }
              action={
                <Button
                  onClick={() => refetchSuggestions()}
                  loading={suggestionsFetching}
                  icon={<RefreshCw className="h-3.5 w-3.5" />}
                >
                  Try again
                </Button>
              }
            />
          ) : visibleSuggestions.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="h-6 w-6" />}
              title="No pending suggestions"
              description="Your AI agent is monitoring developer feeds. Refresh to pull fresh recommendations, or start from a blank draft."
              action={
                <>
                  <Button
                    onClick={() => refetchSuggestions()}
                    loading={suggestionsFetching}
                    icon={<RefreshCw className="h-3.5 w-3.5" />}
                  >
                    Generate suggestions
                  </Button>
                  <Button variant="secondary" onClick={() => setShowNewPostModal(true)}>
                    Draft custom post
                  </Button>
                </>
              }
            />
          ) : (
            <div className="stagger space-y-3">
              {visibleSuggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  expanded={expanded === suggestion.id}
                  content={editingContent[suggestion.id] ?? suggestion.content}
                  pending={approve.isPending}
                  onToggle={() =>
                    setExpanded(expanded === suggestion.id ? null : suggestion.id)
                  }
                  onContentChange={(value) =>
                    setEditingContent((prev) => ({ ...prev, [suggestion.id]: value }))
                  }
                  onApprove={() => handleApproveOne(suggestion)}
                  onDismiss={() => handleDismiss(suggestion.id)}
                  onCollapse={() => setExpanded(null)}
                />
              ))}
            </div>
          )}
        </TabPanel>
      ) : null}

      {/* ── Tab: scheduled ───────────────────────────────────────────── */}
      {activeTab === 'scheduled' ? (
        <TabPanel className="space-y-3">
          {scheduledPosts.length === 0 ? (
            <EmptyState
              icon={<Clock className="h-6 w-6" />}
              title="No scheduled posts"
              description="Approve suggestions from the AI suggestions tab, or create a new post to add it to your queue."
              action={
                <Button onClick={() => setActiveTab('suggestions')} icon={<Sparkles className="h-3.5 w-3.5" />}>
                  Review suggestions
                </Button>
              }
            />
          ) : (
            <div className="stagger space-y-3">
              {scheduledPosts.map((post) => (
                <Panel key={post.id} className="space-y-4 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone="warning">
                        <Clock className="h-3 w-3" /> Queued
                      </StatusBadge>
                      {post.aiGenerated ? (
                        <StatusBadge tone="primary">
                          <Sparkles className="h-3 w-3" /> AI
                        </StatusBadge>
                      ) : null}
                    </div>
                    <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {post.scheduledAt ? formatDateTime(post.scheduledAt) : 'Queued'}
                    </span>
                  </div>

                  <PostBody content={post.content} />

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {post.content.length} characters
                    </span>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm" icon={<CalendarIcon className="h-3.5 w-3.5" />}>
                        Edit schedule
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => publishMutation.mutate(post.id)}
                        loading={publishMutation.isPending && publishMutation.variables === post.id}
                        icon={<Send className="h-3.5 w-3.5" />}
                      >
                        Publish now
                      </Button>
                    </div>
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </TabPanel>
      ) : null}

      {/* ── Tab: published ───────────────────────────────────────────── */}
      {activeTab === 'published' ? (
        <TabPanel className="space-y-3">
          {publishedPosts.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-6 w-6" />}
              title="No published posts yet"
              description={`Approved scheduled posts appear here with live engagement metrics once published to ${meta.name}.`}
            />
          ) : (
            <div className="stagger space-y-3">
              {publishedPosts.map((post) => {
                const postUrl =
                  post.platformPostUrl ||
                  post.metadata?.linkedInUrl ||
                  (post.metadata?.linkedInPostId
                    ? `https://www.linkedin.com/feed/update/${post.metadata.linkedInPostId}`
                    : null);
                const hasReadableMetrics =
                  post.engagementSync?.status === 'ok' || post.engagementSync?.cached === true;
                const likes =
                  hasReadableMetrics && typeof post.metadata?.likes === 'number'
                    ? post.metadata.likes
                    : '—';
                const commentCount =
                  hasReadableMetrics && typeof post.metadata?.comments === 'number'
                    ? post.metadata.comments
                    : '—';

                return (
                  <Panel key={post.id} className="space-y-4 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusBadge tone="success" dot>
                        Published live
                      </StatusBadge>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Just now'}
                      </span>
                    </div>

                    <PostBody content={post.content} />

                    {post.engagementSync && post.engagementSync.status !== 'ok' ? (
                      <InlineNotice
                        title={
                          post.engagementSync.cached
                            ? 'Showing last synced engagement'
                            : 'Live engagement unavailable'
                        }
                        tone="warning"
                        icon={<AlertCircle className="h-4 w-4" />}
                      >
                        {post.engagementSync.message ||
                          'Reconnect LinkedIn or enable engagement read access to sync this post.'}
                      </InlineNotice>
                    ) : null}

                    <div className="grid grid-cols-2 items-center gap-3 border-t border-border/70 pt-3 sm:grid-cols-4">
                      <EngagementStat icon={<Eye className="h-3.5 w-3.5" />} value="—" label="Views" />
                      <EngagementStat
                        icon={<ThumbsUp className="h-3.5 w-3.5 text-success" />}
                        value={likes}
                        label="Reactions"
                      />
                      <EngagementStat
                        icon={<MessageSquare className="h-3.5 w-3.5 text-warning" />}
                        value={commentCount}
                        label="Comments"
                      />
                      <div className="flex justify-start sm:justify-end">
                        {postUrl ? (
                          <a
                            href={postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-primary"
                          >
                            Open post <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="font-mono text-[10px] text-muted-foreground">
                            Link unavailable
                          </span>
                        )}
                      </div>
                    </div>
                  </Panel>
                );
              })}
            </div>
          )}
        </TabPanel>
      ) : null}

      {/* ── Tab: drafts ──────────────────────────────────────────────── */}
      {activeTab === 'drafts' ? (
        <TabPanel className="space-y-3">
          {draftPosts.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="No saved drafts"
              description="Use “New post” to draft, refine, and polish an idea before it reaches the queue."
              action={
                <Button onClick={() => setShowNewPostModal(true)} icon={<Plus className="h-3.5 w-3.5" />}>
                  Create first draft
                </Button>
              }
            />
          ) : (
            <div className="stagger space-y-3">
              {draftPosts.map((post) => (
                <Panel key={post.id} className="space-y-4 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <StatusBadge tone="neutral">Draft</StatusBadge>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <PostBody content={post.content} />

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {post.content.length} characters
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => convertDraftMutation.mutate(post.id)}
                        loading={
                          convertDraftMutation.isPending && convertDraftMutation.variables === post.id
                        }
                        icon={<Clock className="h-3.5 w-3.5" />}
                      >
                        Convert to schedule
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => publishMutation.mutate(post.id)}
                        loading={publishMutation.isPending && publishMutation.variables === post.id}
                        icon={<Send className="h-3.5 w-3.5" />}
                      >
                        Publish now
                      </Button>
                    </div>
                  </div>
                </Panel>
              ))}
            </div>
          )}
        </TabPanel>
      ) : null}

      {/* ── Tab: comments ────────────────────────────────────────────── */}
      {activeTab === 'comments' ? (
        <TabPanel className="space-y-3">
          {commentsData?.sync.status && commentsData.sync.status !== 'ok' ? (
            <InlineNotice
              title={
                commentsData.sync.partial
                  ? 'Some comments could not sync'
                  : 'Real comments are unavailable'
              }
              tone="warning"
              icon={<AlertCircle className="h-4 w-4" />}
            >
              {commentsData.sync.message ||
                'Reconnect LinkedIn or enable engagement read access, then try again.'}
            </InlineNotice>
          ) : null}

          {replyError ? (
            <InlineNotice
              title="Reply was not published"
              tone="danger"
              icon={<AlertCircle className="h-4 w-4" />}
            >
              {replyError}
            </InlineNotice>
          ) : null}

          {commentsList.length === 0 ? (
            <EmptyState
              icon={<MessageCircle className="h-6 w-6" />}
              title="No comments yet"
              description="Real comments on your published posts appear here. AI replies are only generated when you ask for one, and only sent after you approve the wording."
            />
          ) : (
            <div className="stagger space-y-3">
              {commentsList.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  sent={sentReplies.has(comment.id) || comment.status === 'sent'}
                  replyText={editingReply[comment.id] ?? comment.aiReplyText}
                  sending={sendingReplyId === comment.id}
                  onReplyChange={(value) =>
                    setEditingReply((prev) => ({ ...prev, [comment.id]: value }))
                  }
                  onGenerate={() => handleGenerateReply(comment)}
                  onSend={(text) => handleSendCommentReply(comment, text)}
                />
              ))}
            </div>
          )}
        </TabPanel>
      ) : null}

      {/* ── New post modal ───────────────────────────────────────────── */}
      <Modal
        open={showNewPostModal}
        onClose={() => setShowNewPostModal(false)}
        title={`Draft new ${meta.name} post`}
        description="Write it here, polish it, then send it to the queue."
        icon={<Plus className="h-4 w-4" />}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowNewPostModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!newPostContent.trim()}
              onClick={() => {
                setShowNewPostModal(false);
                setNewPostContent('');
              }}
              icon={<CalendarIcon className="h-3.5 w-3.5" />}
            >
              Schedule post
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Textarea
            value={newPostContent}
            onChange={(event) => setNewPostContent(event.target.value)}
            placeholder="What software engineering insight do you want to share?"
            rows={8}
            className="min-h-40 text-[13px]"
          />
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAiPolish}
              disabled={isPolishing || !newPostContent.trim()}
              icon={<Wand2 className={cn('h-3.5 w-3.5 text-primary', isPolishing && 'animate-spin')} />}
            >
              AI polish
            </Button>
            <span className="font-mono text-[10px] text-muted-foreground">
              {newPostContent.length} / 3000
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

/**
 * Two-state switch between human approval and agent approval. The choice is
 * persisted on the brand voice config, so it survives reloads and is the same
 * value the generator reads.
 */
function ApprovalModeToggle({
  autoApprove,
  pending,
  onChange,
}: {
  autoApprove: boolean;
  pending: boolean;
  onChange: (autoApprove: boolean) => void;
}) {
  const options = [
    { value: false, label: 'Human', icon: UserCheck, title: 'You approve every draft before it is queued' },
    { value: true, label: 'Agent', icon: Bot, title: 'The agent queues drafts without a review step' },
  ];

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 py-1.5 pl-3 pr-1.5">
      <span className="font-mono text-[9px] font-bold uppercase leading-tight tracking-[0.14em] text-muted-foreground">
        Approval
      </span>
      <div className="flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5" role="radiogroup" aria-label="Approval mode">
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = option.value === autoApprove;
          return (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={isActive}
              title={option.title}
              disabled={pending}
              onClick={() => onChange(option.value)}
              className={cn(
                'flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-bold transition-colors disabled:opacity-50',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PostBody({ content }: { content: string }) {
  return (
    <p className="whitespace-pre-wrap rounded-xl border border-border/60 bg-muted/25 p-4 text-[13px] leading-6 text-foreground">
      {content}
    </p>
  );
}

function EngagementStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <span className="text-sm font-bold tabular-nums text-foreground">{value}</span>
      <span className="text-[10px]">{label}</span>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  expanded,
  content,
  pending,
  onToggle,
  onContentChange,
  onApprove,
  onDismiss,
  onCollapse,
}: {
  suggestion: Suggestion;
  expanded: boolean;
  content: string;
  pending: boolean;
  onToggle: () => void;
  onContentChange: (value: string) => void;
  onApprove: () => void;
  onDismiss: () => void;
  onCollapse: () => void;
}) {
  return (
    <Panel className={cn('overflow-hidden transition-all duration-300', expanded && 'border-primary/30')}>
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggle();
          }
        }}
        className="flex cursor-pointer select-none items-start justify-between gap-3 p-4 transition-colors hover:bg-muted/25"
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-300',
                expanded && 'rotate-180 text-primary',
              )}
            />
            <span className="truncate text-[13px] font-bold">{suggestion.trend}</span>
            <StatusBadge tone="primary">{suggestion.category}</StatusBadge>
            <span className="font-mono text-[10px] text-muted-foreground">via {suggestion.source}</span>
          </div>

          {!expanded ? (
            <p className="ml-6 line-clamp-2 text-xs leading-6 text-muted-foreground">{content}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-lg border border-border/70 bg-muted/40 px-2.5 py-1 font-mono text-[10px] text-muted-foreground sm:flex">
            <Clock className="h-3 w-3" />
            {formatDateTime(suggestion.scheduledAt)}
          </span>

          <div className="flex items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
            <Button
              variant="success"
              size="xs"
              onClick={onApprove}
              disabled={pending}
              icon={<Check className="h-3.5 w-3.5" />}
              title="Approve and schedule"
            >
              Approve
            </Button>
            <button
              type="button"
              onClick={onDismiss}
              title="Dismiss suggestion"
              aria-label="Dismiss suggestion"
              className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="animate-fade-in space-y-3 border-t border-border/70 bg-muted/15 p-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-bold">
              <Edit3 className="h-3.5 w-3.5 text-primary" />
              Edit post content
            </label>
            <span
              className={cn(
                'font-mono text-[10px]',
                content.length > 3000 ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {content.length} / 3000
            </span>
          </div>

          <Textarea
            value={content}
            onChange={(event) => onContentChange(event.target.value)}
            rows={7}
            className="min-h-36 text-[13px]"
          />

          {suggestion.imageUrl ? (
            <div className="group relative overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={suggestion.imageUrl}
                alt={suggestion.trend}
                className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="glass absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-lg px-3 py-1 text-[10px] font-semibold">
                <ImageIcon className="h-3.5 w-3.5 text-primary" />
                Topic visual attached
              </span>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Button
              variant="secondary"
              size="xs"
              onClick={() => onContentChange(`${content.trim()}\n\n#SoftwareEngineering #Backend #Coding`)}
              icon={<Hash className="h-3 w-3" />}
            >
              Add hashtags
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onCollapse}>
                Collapse
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={onApprove}
                loading={pending}
                icon={<Check className="h-3.5 w-3.5" />}
              >
                Approve & schedule
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}

function CommentCard({
  comment,
  sent,
  replyText,
  sending,
  onReplyChange,
  onGenerate,
  onSend,
}: {
  comment: PostComment;
  sent: boolean;
  replyText: string;
  sending: boolean;
  onReplyChange: (value: string) => void;
  onGenerate: () => void;
  onSend: (text: string) => void;
}) {
  return (
    <Panel className="space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
        <span className="chip max-w-xl truncate border-primary/25 bg-primary/10 text-primary">
          On post: “{comment.postTitle}”
        </span>
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          {comment.createdAt
            ? new Date(comment.createdAt).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            : 'Time unavailable'}
        </span>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/25 p-3.5">
        {comment.commenterAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={comment.commenterAvatar}
            alt={comment.commenterName}
            className="h-9 w-9 shrink-0 rounded-xl border border-border object-cover"
          />
        ) : (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient text-[10px] font-bold text-white">
            {comment.commenterName?.charAt(0)?.toUpperCase() || 'LI'}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-xs font-bold">{comment.commenterName}</h4>
            {comment.commenterHeadline ? (
              <span className="truncate text-[10px] text-muted-foreground">
                {comment.commenterHeadline}
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-[13px] leading-6">{comment.commentText}</p>
        </div>
      </div>

      <div className="space-y-3 border-l-2 border-primary/40 pl-4">
        <div className="flex flex-wrap items-center gap-2">
          <Bot className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold">AI agent response</span>
          {sent ? (
            <StatusBadge tone="success">
              <Check className="h-3 w-3" /> Published
            </StatusBadge>
          ) : (
            <StatusBadge tone="warning">Manual review</StatusBadge>
          )}
        </div>

        {!sent ? (
          <div className="space-y-3">
            <Textarea
              value={replyText}
              onChange={(event) => onReplyChange(event.target.value)}
              rows={3}
              placeholder="Generate a reply or write your own…"
              className="min-h-24 text-[13px]"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={onGenerate}
                icon={<Wand2 className="h-3.5 w-3.5 text-primary" />}
              >
                {replyText ? 'Regenerate reply' : 'Generate reply'}
              </Button>
              <Button
                size="sm"
                onClick={() => onSend(replyText)}
                loading={sending}
                disabled={!replyText.trim()}
                icon={<Send className="h-3.5 w-3.5" />}
              >
                Post reply
              </Button>
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-[13px] leading-6">
            {replyText}
          </p>
        )}
      </div>
    </Panel>
  );
}
