'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
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
  ExternalLink,
  ThumbsUp,
  MessageSquare,
  Share2,
  Eye,
  Calendar as CalendarIcon,
  ShieldCheck,
  Zap,
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
}

// ─── API calls ───────────────────────────────────────────────────────────────

async function fetchSuggestions(): Promise<Suggestion[]> {
  const res = await fetch('/api/ai/suggestions', { credentials: 'include' });
  if (!res.ok) return [];
  return (await res.json()).data?.suggestions || [];
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
  const [activeTab, setActiveTab] = useState<'suggestions' | 'scheduled' | 'published' | 'drafts'>('suggestions');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<Record<string, string>>({});
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);

  const meta = PLATFORM_META[provider] || {
    name: provider,
    handle: `@${provider}`,
    color: '#666',
    bgGradient: 'from-slate-700 to-slate-900',
    logo: null,
  };

  const { data: suggestions = [], isLoading: suggestionsLoading, refetch: refetchSuggestions } = useQuery({
    queryKey: ['suggestions'],
    queryFn: fetchSuggestions,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['posts', provider],
    queryFn: () => fetchPosts(provider),
  });

  const approve = useMutation({
    mutationFn: approveSuggestions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/posts/${postId}/publish`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to publish');
      return (await res.json()).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
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

  const handleAiPolish = () => {
    if (!newPostContent.trim()) return;
    setIsPolishing(true);
    setTimeout(() => {
      setNewPostContent((prev) => `${prev.trim()}\n\n#SoftwareEngineering #Backend #SystemDesign`);
      setIsPolishing(false);
    }, 600);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumbs Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>

        <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Realtime Sync Active
        </span>
      </div>

      {/* Platform Header Card (shadcn/ui style) */}
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
                Automated developer trend monitoring, content generation & post scheduling
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
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
          <span className="text-[10px] text-muted-foreground font-medium mt-1 block">Auto-Scheduler Active</span>
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
            <span className="text-[11px] font-medium">Pipeline Status</span>
            <Zap className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Monitoring 24/7
          </span>
          <span className="text-[10px] text-muted-foreground font-medium mt-1 block">Developer Feeds Active</span>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-6 overflow-x-auto no-scrollbar" aria-label="Tabs">
          {[
            { id: 'suggestions', label: 'AI Suggestions', count: visibleSuggestions.length, icon: Sparkles },
            { id: 'scheduled', label: 'Scheduled Queue', count: scheduledPosts.length, icon: Clock },
            { id: 'published', label: 'Published', count: publishedPosts.length, icon: CheckCircle2 },
            { id: 'drafts', label: 'Drafts', count: draftPosts.length, icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-1 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`} />
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
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
                  {/* Suggestion Card Header */}
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

                  {/* Expanded Content Editor */}
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
            publishedPosts.map((post, idx) => (
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

                {/* Simulated Realtime Analytics Bar */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Eye className="h-3.5 w-3.5 text-blue-500" />
                    <span className="font-semibold text-foreground">{1420 + idx * 310}</span>
                    <span className="text-[10px]">Views</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <ThumbsUp className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="font-semibold text-foreground">{84 + idx * 12}</span>
                    <span className="text-[10px]">Likes</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                    <span className="font-semibold text-foreground">{18 + idx * 4}</span>
                    <span className="text-[10px]">Comments</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground justify-end">
                    <a
                      href="https://linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-500 font-semibold text-[11px] flex items-center gap-1"
                    >
                      <span>View</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))
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
