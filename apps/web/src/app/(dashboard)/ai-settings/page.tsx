'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Ban,
  CalendarClock,
  CheckCircle2,
  Hash,
  Plus,
  Save,
  Sparkles,
  SlidersHorizontal,
  Wand2,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, RangeSlider, Select, TokenChip, ToggleRow } from '@/components/ui/field';
import { PageHeader, PanelSection, StatusBadge } from '@/components/ui/product';

interface AIConfig {
  formality: number;
  humor: number;
  emojiUsage: string;
  postLength: string;
  imageStyle: string;
  proficiency: string;
  postFrequency: string;
  topics: string[];
  avoidWords: string[];
  samplePosts: string;
  autoApprove: boolean;
  autoSchedule: boolean;
}

const defaults: AIConfig = {
  formality: 3,
  humor: 2,
  emojiUsage: 'light',
  postLength: 'medium',
  imageStyle: 'professional',
  proficiency: 'expert',
  postFrequency: '3_week',
  topics: ['Software Engineering', 'System Design', 'AI Infrastructure'],
  avoidWords: ['synergy', 'leverage', 'game-changer'],
  samplePosts: '',
  autoApprove: false,
  autoSchedule: true,
};

async function fetchConfig(): Promise<AIConfig | null> {
  const res = await fetch('/api/ai/config', { credentials: 'include' });
  if (!res.ok) return null;
  return (await res.json()).data;
}

async function saveConfig(data: AIConfig) {
  const res = await fetch('/api/ai/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save configuration');
  return (await res.json()).data;
}

/** A short preview of how the current tone settings read. */
function toneSummary(config: AIConfig) {
  const formality = ['very casual', 'casual', 'balanced', 'formal', 'corporate'][config.formality - 1];
  const humor = ['strictly technical', 'mostly serious', 'lightly witty', 'playful', 'very playful'][
    config.humor - 1
  ];
  const length = { short: 'short', medium: 'medium-length', long: 'long-form' }[config.postLength] ?? 'medium-length';
  return `${length} posts, ${formality} in tone and ${humor}, with ${config.emojiUsage} emoji use.`;
}

export default function AISettingsPage() {
  const queryClient = useQueryClient();
  const { data: saved } = useQuery({ queryKey: ['ai-config'], queryFn: fetchConfig });
  const [config, setConfig] = useState<AIConfig>(defaults);
  const [topicInput, setTopicInput] = useState('');
  const [avoidInput, setAvoidInput] = useState('');
  const [savedOk, setSavedOk] = useState(false);

  useEffect(() => {
    if (saved) setConfig(saved);
  }, [saved]);

  const save = useMutation({
    mutationFn: saveConfig,
    onSuccess: () => {
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2500);
      queryClient.invalidateQueries({ queryKey: ['ai-config'] });
    },
  });

  const set = (key: keyof AIConfig, val: any) => setConfig((c) => ({ ...c, [key]: val }));

  const addTopic = () => {
    if (!topicInput.trim()) return;
    set('topics', [...config.topics, topicInput.trim()]);
    setTopicInput('');
  };

  const addAvoid = () => {
    if (!avoidInput.trim()) return;
    set('avoidWords', [...config.avoidWords, avoidInput.trim()]);
    setAvoidInput('');
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-28">
      <PageHeader
        eyebrow="Writing system"
        title="Brand voice"
        description="Tune the writing style, content preferences, and approval controls used by your AI assistant. Changes apply to every draft generated after you save."
        actions={<StatusBadge tone="success" dot>Active config</StatusBadge>}
      />

      {/* Voice preview */}
      <div className="relative animate-fade-in overflow-hidden rounded-2xl border border-primary/25 bg-primary/5 p-5">
        <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-primary/25 blur-3xl" />
        <div className="relative flex items-start gap-3.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
            <Wand2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              Current voice
            </p>
            <p className="mt-1.5 text-sm leading-6">{toneSummary(config)}</p>
            {config.topics.length ? (
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                Focused on {config.topics.slice(0, 3).join(', ')}
                {config.topics.length > 3 ? ` and ${config.topics.length - 3} more` : ''}.
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="stagger space-y-5">
        {/* Automation */}
        <PanelSection
          title="Automation controls"
          icon={<SlidersHorizontal className="h-4 w-4" />}
          description="What the assistant is allowed to do without you."
          bodyClassName="space-y-3"
        >
          <ToggleRow
            title="Auto-schedule approved suggestions"
            description="Queue posts for optimal delivery the moment you approve them."
            icon={<CalendarClock className="h-4 w-4" />}
            checked={config.autoSchedule}
            onChange={(v) => set('autoSchedule', v)}
          />
          <ToggleRow
            title="Auto-approve high-confidence drafts"
            description="Allow the agent to queue top trend posts without a review step."
            icon={<Zap className="h-4 w-4" />}
            checked={config.autoApprove}
            onChange={(v) => set('autoApprove', v)}
          />
        </PanelSection>

        {/* Tone */}
        <PanelSection
          title="Tone & style"
          icon={<Sparkles className="h-4 w-4" />}
          description="How the writing should feel before anything about the topic."
          bodyClassName="space-y-7"
        >
          <div className="grid gap-7 sm:grid-cols-2">
            <RangeSlider
              label="Formality"
              value={config.formality}
              leftLabel="Conversational"
              rightLabel="Corporate"
              onChange={(v) => set('formality', v)}
            />
            <RangeSlider
              label="Humour & personality"
              value={config.humor}
              leftLabel="Technical"
              rightLabel="Playful"
              onChange={(v) => set('humor', v)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Emoji usage">
              <Select
                value={config.emojiUsage}
                onChange={(event) => set('emojiUsage', event.target.value)}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'light', label: 'Light (1–2 per post)' },
                  { value: 'moderate', label: 'Moderate (3–5)' },
                  { value: 'heavy', label: 'Heavy' },
                ]}
              />
            </Field>
            <Field label="Post length">
              <Select
                value={config.postLength}
                onChange={(event) => set('postLength', event.target.value)}
                options={[
                  { value: 'short', label: 'Short (100–300 chars)' },
                  { value: 'medium', label: 'Medium (300–800 chars)' },
                  { value: 'long', label: 'Long-form (800+ chars)' },
                ]}
              />
            </Field>
            <Field label="Target frequency">
              <Select
                value={config.postFrequency}
                onChange={(event) => set('postFrequency', event.target.value)}
                options={[
                  { value: '1_week', label: '1 post per week' },
                  { value: '3_week', label: '3 posts per week' },
                  { value: '5_week', label: '5 posts per week' },
                  { value: '7_week', label: '7 posts per week' },
                ]}
              />
            </Field>
          </div>
        </PanelSection>

        {/* Topics */}
        <PanelSection
          title="Focus topics"
          icon={<Hash className="h-4 w-4" />}
          description="Trends outside these areas are filtered out before drafting."
          bodyClassName="space-y-4"
        >
          <div className="flex gap-2">
            <Input
              value={topicInput}
              onChange={(event) => setTopicInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addTopic();
                }
              }}
              placeholder="e.g. Distributed systems, Developer tooling…"
              className="flex-1"
            />
            <Button onClick={addTopic} icon={<Plus className="h-4 w-4" />}>
              Add
            </Button>
          </div>

          {config.topics.length ? (
            <div className="flex flex-wrap gap-2">
              {config.topics.map((topic) => (
                <TokenChip
                  key={topic}
                  onRemove={() => set('topics', config.topics.filter((x) => x !== topic))}
                >
                  {topic}
                </TokenChip>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No topics yet — the assistant will draft across all monitored feeds.
            </p>
          )}
        </PanelSection>

        {/* Avoid words */}
        <PanelSection
          title="Forbidden words"
          icon={<Ban className="h-4 w-4" />}
          description="Buzzwords the assistant must never use in a draft."
          bodyClassName="space-y-4"
        >
          <div className="flex gap-2">
            <Input
              value={avoidInput}
              onChange={(event) => setAvoidInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addAvoid();
                }
              }}
              placeholder="e.g. leverage, game-changer…"
              className="flex-1"
            />
            <Button variant="secondary" onClick={addAvoid} icon={<Plus className="h-4 w-4" />}>
              Add
            </Button>
          </div>

          {config.avoidWords.length ? (
            <div className="flex flex-wrap gap-2">
              {config.avoidWords.map((word) => (
                <TokenChip
                  key={word}
                  tone="danger"
                  onRemove={() => set('avoidWords', config.avoidWords.filter((x) => x !== word))}
                >
                  {word}
                </TokenChip>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No blocked words yet.</p>
          )}
        </PanelSection>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-20 mx-auto max-w-3xl">
        <div className="glass flex items-center justify-between gap-4 rounded-2xl p-3 shadow-lift">
          <p className="hidden pl-2 text-xs text-muted-foreground sm:block">
            {savedOk ? 'Configuration saved.' : 'Changes apply to drafts generated after saving.'}
          </p>
          <Button
            onClick={() => save.mutate(config)}
            loading={save.isPending}
            variant={savedOk ? 'success' : 'primary'}
            icon={savedOk ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            className="w-full sm:w-auto"
          >
            {save.isPending ? 'Saving…' : savedOk ? 'Saved' : 'Save configuration'}
          </Button>
        </div>
      </div>
    </div>
  );
}
