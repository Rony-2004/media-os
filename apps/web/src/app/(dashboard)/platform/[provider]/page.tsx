'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { InlineNotice } from '@/components/ui/product';
import { readApiResponse } from '@/lib/api-response';
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  X,
  Clock,
  TrendingUp,
  Edit3,
  Check,
  CheckCheck,
  Loader2,
  Plus,
  FileText,
  Wand2,
  Image as ImageIcon,
  RefreshCw,
  Send,
  ExternalLink,
  ThumbsUp,
  MessageSquare,
  Share2,
  Eye,
  Calendar as CalendarIcon,
  ShieldCheck,
  AlertCircle,
  Zap,
  Bot,
  MessageCircle,
} from 'lucide-react';

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

// ─── Platform Meta Definitions ───────────────────────────────────────────────

const PLATFORM_META: Record<
  string,
  { name: string; handle: string; color: string; bgGradient: string; logo: React.ReactNode }
> = {
  linkedin: {
    name: 'LinkedIn',
    handle: '@connected-user',
    color: '#0A66C2',
    bgGradient: 'from-blue-600 to-indigo-700',
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
};

export default function PlatformPage() {
  const { provider } = useParams<{ provider: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'suggestions' | 'scheduled' | 'published' | 'drafts' | 'comments'>('suggestions');
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

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get('tab');
    if (['suggestions', 'scheduled', 'published', 'drafts', 'comments'].includes(requestedTab || '')) {
      setActiveTab(requestedTab as typeof activeTab);
    }
  }, []);

  const meta = PLATFORM_META[provider] || {
    name: provider,
    handle: `@${provider}`,
    color: '#666',
    bgGradient: 'from-slate-700 to-slate-900',
    logo: null,
  };

  const {
    data: suggestions = [],
    isLoading: suggestionsLoading,
    isError: suggestionsFailed,
    error: suggestionsError,
    refetch: refetchSuggestions,
  } = useQuery({
    queryKey: ['suggestions'],
    queryFn: fetchSuggestions,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery({
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

  const [publishError, setPublishError] = useState<string | null>(null);

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
      {/* Top Breadcrumbs Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>

        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${syncIsLive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {syncIsLive ? 'Live engagement synced' : 'Engagement sync needs attention'}
        </span>
      </div>

      {/* Platform Header Card (shadcn/ui style with Auto-Reply Toggle) */}
      <div className="rounded-2xl p-6 border border-border bg-card relative overflow-hidden transition-all duration-300 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
              style={{ backgroundColor: meta.color }}
            >
              {meta.logo}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">{meta.name} Pipeline</h1>
                <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-md flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Connected
                </span>
              </div>
              <p className="text-muted-foreground text-xs mt-0.5">
                Content planning, publishing, real engagement, and human-reviewed AI replies
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-3 py-1.5">
              <Bot className="h-4 w-4 shrink-0 text-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-muted-foreground leading-tight">
                  Reply mode
                </span>
                <span className="text-[11px] font-bold text-foreground leading-tight">Human review</span>
              </div>
            </div>

            {visibleSuggestions.length > 0 && (
              <button
                onClick={handleApproveAll}
                disabled={approve.isPending}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
              >
                {approve.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                Approve All ({visibleSuggestions.length})
              </button>
            )}

            <button
              onClick={() => setShowNewPostModal(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-foreground text-background hover:opacity-90 rounded-xl text-xs font-semibold transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              New Post
            </button>
          </div>
        </div>
      </div>

      {publishError && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs font-semibold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
            <span>{publishError}</span>
          </div>
          <button
            onClick={() => setPublishError(null)}
            className="p-1 hover:bg-destructive/20 rounded-md text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="glass-card rounded-xl p-4 border border-border bg-card hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">AI Suggestions</span>
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <span className="text-xl font-bold text-foreground block">{visibleSuggestions.length} Ready</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 block">⚡ Fresh Suggestions</span>
        </div>

        <div className="glass-card rounded-xl p-4 border border-border bg-card hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">Scheduled Posts</span>
            <Clock className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <span className="text-xl font-bold text-foreground block">{scheduledPosts.length} Queued</span>
          <span className="text-[10px] text-muted-foreground font-medium mt-1 block">Publishing queue</span>
        </div>

        <div className="glass-card rounded-xl p-4 border border-border bg-card hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">Published</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <span className="text-xl font-bold text-foreground block">{publishedPosts.length} Total</span>
          <span className="text-[10px] text-muted-foreground font-medium mt-1 block">Live on LinkedIn</span>
        </div>

        <div className="glass-card rounded-xl p-4 border border-border bg-card hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">Reply assistant</span>
            <Bot className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Manual review mode
          </span>
          <span className="text-[10px] text-muted-foreground font-medium mt-1 block">Nothing posts without approval</span>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="border-b border-border">
        <nav className="scrollbar-none flex space-x-6 overflow-x-auto" aria-label="Tabs">
          {[
            { id: 'suggestions', label: 'AI Suggestions', count: visibleSuggestions.length, icon: Sparkles },
            { id: 'scheduled', label: 'Scheduled Queue', count: scheduledPosts.length, icon: Clock },
            { id: 'published', label: 'Published', count: publishedPosts.length, icon: CheckCircle2 },
            { id: 'drafts', label: 'Drafts', count: draftPosts.length, icon: FileText },
            { id: 'comments', label: 'Comments & Replies', count: commentsList.length, icon: MessageCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-3 px-1 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-primary text-foreground font-bold'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── TAB 1: AI SUGGESTIONS ─────────────────────────────────────── */}
      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          {suggestionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-card border rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : suggestionsFailed ? (
            <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center border border-red-500/25 bg-card">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3 text-red-600 dark:text-red-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-sm text-foreground">AI Suggestions Unavailable</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                {suggestionsError instanceof Error
                  ? suggestionsError.message
                  : 'AI suggestions could not be generated. Please try again.'}
              </p>
              <button
                onClick={() => refetchSuggestions()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Try Again
              </button>
            </div>
          ) : visibleSuggestions.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center border border-border bg-card">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3 text-blue-600 dark:text-blue-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-sm text-foreground">No Pending Suggestions</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                Your AI agent is monitoring developer feeds. Click below to refresh recommendations now.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => refetchSuggestions()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Generate AI Suggestions
                </button>
                <button
                  onClick={() => setShowNewPostModal(true)}
                  className="px-4 py-2 bg-muted text-foreground rounded-xl text-xs font-semibold hover:bg-accent transition-colors"
                >
                  Draft Custom Post
                </button>
              </div>
            </div>
          ) : (
            visibleSuggestions.map((s) => {
              const isExpanded = expanded === s.id;
              const currentContent = editingContent[s.id] ?? s.content;

              return (
                <div
                  key={s.id}
                  className="glass-card rounded-2xl border border-border bg-card overflow-hidden transition-all duration-200 hover:border-blue-500/30"
                >
                  <div
                    className="p-4 flex items-start justify-between gap-3 cursor-pointer select-none hover:bg-muted/20 transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : s.id)}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-bold text-foreground truncate">{s.trend}</span>
                          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-md border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            {s.category}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-normal">via {s.source}</span>
                        </div>

                        {!isExpanded && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {currentContent}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground font-normal bg-muted/40 px-2.5 py-1 rounded-lg border border-border/50">
                        <Clock className="h-3 w-3" />
                        {new Date(s.scheduledAt).toLocaleDateString('en', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleApproveOne(s)}
                          disabled={approve.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                          title="Approve and Schedule Post"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleDismiss(s.id)}
                          className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                          title="Dismiss Suggestion"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 border-t border-border bg-muted/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Edit3 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          Edit Post Content
                        </label>
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {currentContent.length} / 3000 chars
                        </span>
                      </div>

                      <textarea
                        value={currentContent}
                        onChange={(e) =>
                          setEditingContent((prev) => ({ ...prev, [s.id]: e.target.value }))
                        }
                        rows={6}
                        className="w-full p-3.5 text-xs rounded-xl bg-background border border-border focus:outline-none focus:ring-1 focus:ring-blue-500/40 leading-relaxed font-sans min-h-[140px] resize-y"
                      />

                      {s.imageUrl && (
                        <div className="relative rounded-xl overflow-hidden border border-border bg-slate-950 group">
                          <img
                            src={s.imageUrl}
                            alt={s.trend}
                            className="w-full h-52 object-cover group-hover:scale-102 transition-transform duration-300"
                          />
                          <div className="absolute bottom-2.5 left-2.5 bg-background/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] text-foreground font-semibold flex items-center gap-1.5 border border-border">
                            <ImageIcon className="h-3.5 w-3.5 text-blue-500" />
                            <span>Topic Visual Asset Attached</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingContent((prev) => ({
                                ...prev,
                                [s.id]: `${currentContent.trim()}\n\n#SoftwareEngineering #Backend #Coding`,
                              }))
                            }
                            className="px-2.5 py-1 bg-muted hover:bg-accent text-foreground rounded-lg text-[11px] font-medium transition-colors"
                          >
                            + Add Hashtags
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpanded(null)}
                            className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Collapse
                          </button>
                          <button
                            onClick={() => handleApproveOne(s)}
                            disabled={approve.isPending}
                            className="flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                          >
                            {approve.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Approve & Schedule
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── TAB 2: SCHEDULED POSTS ─────────────────────────────────────── */}
      {activeTab === 'scheduled' && (
        <div className="space-y-3">
          {scheduledPosts.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center border border-border bg-card">
              <Clock className="h-8 w-8 text-amber-500/60 mx-auto mb-2" />
              <h3 className="font-bold text-sm text-foreground">No Scheduled Posts</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Approve suggestions from the AI Suggestions tab or create a new post to add to your queue.
              </p>
            </div>
          ) : (
            scheduledPosts.map((post) => (
              <div key={post.id} className="glass-card rounded-2xl p-5 border border-border bg-card space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold rounded-md border border-amber-500/20 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Scheduled Queue
                    </span>
                    {post.aiGenerated && (
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-medium rounded-md">
                        AI Generated
                      </span>
                    )}
                  </div>

                  <span className="text-muted-foreground font-medium text-xs flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    {post.scheduledAt
                      ? new Date(post.scheduledAt).toLocaleString('en', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Queued'}
                  </span>
                </div>

                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans bg-muted/20 p-3.5 rounded-xl border border-border/40">
                  {post.content}
                </p>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[11px] text-muted-foreground">{post.content.length} characters</span>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 bg-muted hover:bg-accent text-foreground rounded-lg font-medium text-xs transition-colors">
                      Edit Schedule
                    </button>
                    <button
                      onClick={() => publishMutation.mutate(post.id)}
                      disabled={publishMutation.isPending}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {publishMutation.isPending && publishMutation.variables === post.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      <span>Publish Now</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAB 3: PUBLISHED POSTS ─────────────────────────────────────── */}
      {activeTab === 'published' && (
        <div className="space-y-3">
          {publishedPosts.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center border border-border bg-card">
              <CheckCircle2 className="h-8 w-8 text-emerald-500/60 mx-auto mb-2" />
              <h3 className="font-bold text-sm text-foreground">No Published Posts Yet</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Approved scheduled posts will appear here with live engagement metrics once published to {meta.name}.
              </p>
            </div>
          ) : (
            publishedPosts.map((post) => {
              const postUrl = post.platformPostUrl || post.metadata?.linkedInUrl ||
                (post.metadata?.linkedInPostId ? `https://www.linkedin.com/feed/update/${post.metadata.linkedInPostId}` : null);
              const hasReadableMetrics =
                post.engagementSync?.status === 'ok' || post.engagementSync?.cached === true;
              const likes = hasReadableMetrics && typeof post.metadata?.likes === 'number' ? post.metadata.likes : '—';
              const commentCount =
                hasReadableMetrics && typeof post.metadata?.comments === 'number' ? post.metadata.comments : '—';

              return (
                <div key={post.id} className="glass-card rounded-2xl p-5 border border-border bg-card space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold rounded-md border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Published Live
                    </span>
                    <span className="text-muted-foreground font-medium">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Just now'}
                    </span>
                  </div>

                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap bg-muted/20 p-3.5 rounded-xl border border-border/40">
                    {post.content}
                  </p>

                  {post.engagementSync && post.engagementSync.status !== 'ok' ? (
                    <InlineNotice
                      title={post.engagementSync.cached ? 'Showing last synced engagement' : 'Live engagement unavailable'}
                      tone="warning"
                      icon={<AlertCircle className="h-4 w-4" />}
                    >
                      {post.engagementSync.message || 'Reconnect LinkedIn or enable engagement read access to sync this post.'}
                    </InlineNotice>
                  ) : null}

                  <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs sm:grid-cols-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" />
                      <span className="font-semibold text-foreground">—</span>
                      <span className="text-[10px]">Views</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <ThumbsUp className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="font-semibold text-foreground">{likes}</span>
                      <span className="text-[10px]">Reactions</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                      <span className="font-semibold text-foreground">{commentCount}</span>
                      <span className="text-[10px]">Comments</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground justify-end">
                      {postUrl ? (
                        <a
                          href={postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-primary"
                        >
                          <span>Open post</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-[10px]">Link unavailable</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── TAB 4: DRAFTS ──────────────────────────────────────────────── */}
      {activeTab === 'drafts' && (
        <div className="space-y-3">
          {draftPosts.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center border border-border bg-card">
              <FileText className="h-8 w-8 text-blue-500/60 mx-auto mb-2" />
              <h3 className="font-bold text-sm text-foreground">No Saved Drafts</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Use the "New Post" button to draft, refine, and polish post ideas.
              </p>
              <button
                onClick={() => setShowNewPostModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Create First Draft
              </button>
            </div>
          ) : (
            draftPosts.map((post) => (
              <div key={post.id} className="glass-card rounded-2xl p-5 border border-border bg-card space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 bg-muted text-muted-foreground font-semibold rounded-md border border-border">
                    Draft
                  </span>
                  <span className="text-muted-foreground font-medium">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap bg-muted/20 p-3.5 rounded-xl border border-border/40">
                  {post.content}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-muted-foreground">{post.content.length} chars</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => convertDraftMutation.mutate(post.id)}
                      disabled={convertDraftMutation.isPending}
                      className="px-3 py-1.5 bg-muted hover:bg-accent text-foreground rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {convertDraftMutation.isPending && convertDraftMutation.variables === post.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      Convert to Schedule
                    </button>
                    <button
                      onClick={() => publishMutation.mutate(post.id)}
                      disabled={publishMutation.isPending}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {publishMutation.isPending && publishMutation.variables === post.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Publish Now
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAB 5: COMMENTS & AUTO-REPLIES ───────────────────────────── */}
      {activeTab === 'comments' && (
        <div className="space-y-4">
          {commentsData?.sync.status && commentsData.sync.status !== 'ok' ? (
            <InlineNotice
              title={commentsData.sync.partial ? 'Some comments could not sync' : 'Real comments are unavailable'}
              tone="warning"
              icon={<AlertCircle className="h-4 w-4" />}
            >
              {commentsData.sync.message || 'Reconnect LinkedIn or enable engagement read access, then try again.'}
            </InlineNotice>
          ) : null}
          {replyError ? (
            <InlineNotice title="Reply was not published" tone="danger" icon={<AlertCircle className="h-4 w-4" />}>
              {replyError}
            </InlineNotice>
          ) : null}
          {commentsList.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center border border-border bg-card">
              <MessageCircle className="h-8 w-8 text-blue-500/60 mx-auto mb-2" />
              <h3 className="font-bold text-sm text-foreground">No Comments Yet</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Real comments on your published LinkedIn posts will appear here. AI replies are generated only when you ask.
              </p>
            </div>
          ) : (
            commentsList.map((cmt) => {
              const isSent = sentReplies.has(cmt.id) || cmt.status === 'sent';
              const currentReplyText = editingReply[cmt.id] ?? cmt.aiReplyText;

              return (
                <div key={cmt.id} className="glass-card rounded-2xl p-5 border border-border bg-card space-y-4">
                  {/* Target Post Header Badge */}
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20 truncate max-w-xl">
                      On Post: "{cmt.postTitle}"
                    </span>
                    <span className="text-[11px] text-muted-foreground shrink-0 font-medium">
                      {cmt.createdAt
                        ? new Date(cmt.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                        : 'Time unavailable'}
                    </span>
                  </div>

                  {/* Original Commenter Info & Body */}
                  <div className="flex items-start gap-3 bg-muted/20 p-3.5 rounded-xl border border-border/50">
                    {cmt.commenterAvatar ? (
                      <img
                        src={cmt.commenterAvatar}
                        alt={cmt.commenterName}
                        className="h-9 w-9 shrink-0 rounded-xl border border-border object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-[10px] font-black text-background">
                        LI
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-foreground">{cmt.commenterName}</h4>
                        {cmt.commenterHeadline ? <span className="truncate text-[10px] text-muted-foreground">{cmt.commenterHeadline}</span> : null}
                      </div>
                      <p className="text-xs text-foreground mt-1 leading-relaxed">{cmt.commentText}</p>
                    </div>
                  </div>

                  {/* AI Auto-Reply Section */}
                  <div className="pl-4 border-l-2 border-blue-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Bot className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-xs font-bold text-foreground">AI Agent Response</span>
                        {isSent ? (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold rounded-md border border-emerald-500/20 flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Published to LinkedIn
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold rounded-md border border-amber-500/20">
                            Manual review
                          </span>
                        )}
                      </div>
                    </div>

                    {!isSent ? (
                      <div className="space-y-3">
                        <textarea
                          value={currentReplyText}
                          onChange={(e) =>
                            setEditingReply((prev) => ({ ...prev, [cmt.id]: e.target.value }))
                          }
                          rows={3}
                          placeholder="Generate a reply or write your own…"
                          className="product-input min-h-24 resize-y text-xs leading-relaxed"
                        />

                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/comments', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({
                                    action: 'generate_reply',
                                    commentText: cmt.commentText,
                                    postText: cmt.postTitle,
                                  }),
                                });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.error?.message || 'Reply generation failed.');
                                if (data.data?.replyText) {
                                  setEditingReply((prev) => ({ ...prev, [cmt.id]: data.data.replyText }));
                                }
                              } catch (error) {
                                setReplyError(error instanceof Error ? error.message : 'Reply generation failed.');
                              }
                            }}
                            className="px-3 py-1.5 bg-muted hover:bg-accent text-foreground rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                          >
                            <Wand2 className="h-3 w-3 text-blue-500" />
                            <span>{currentReplyText ? 'Regenerate reply' : 'Generate reply'}</span>
                          </button>

                          <button
                            onClick={() => handleSendCommentReply(cmt, currentReplyText)}
                            disabled={sendingReplyId === cmt.id || !currentReplyText.trim()}
                            className="product-button-primary min-h-8 px-3 py-1.5 text-xs"
                          >
                            {sendingReplyId === cmt.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                            <span>Post Reply to LinkedIn</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl text-xs text-foreground leading-relaxed font-sans">
                        {currentReplyText}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* NEW POST MODAL */}
      {showNewPostModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-background rounded-2xl max-w-lg w-full p-6 space-y-4 border border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Draft New {meta.name} Post
              </h3>
              <button
                onClick={() => setShowNewPostModal(false)}
                className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What software engineering insight do you want to share?"
              rows={6}
              className="w-full p-3.5 text-xs rounded-xl bg-card border border-border focus:outline-none focus:ring-1 focus:ring-blue-500/40 leading-relaxed"
            />

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleAiPolish}
                disabled={isPolishing || !newPostContent.trim()}
                className="px-3 py-1.5 bg-muted hover:bg-accent text-foreground rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Wand2 className={`h-3.5 w-3.5 text-blue-500 ${isPolishing ? 'animate-spin' : ''}`} />
                <span>AI Polish</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewPostModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowNewPostModal(false);
                    setNewPostContent('');
                  }}
                  disabled={!newPostContent.trim()}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Schedule Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
