'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BrainCircuit, Save, Loader2, Plus, X, Sparkles, SlidersHorizontal, Sliders, ShieldCheck } from 'lucide-react';

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
  topics: ['AI & Tech', 'SaaS Growth'],
  avoidWords: ['synergy', 'leverage'],
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
  if (!res.ok) throw new Error('Failed to save');
  return (await res.json()).data;
}

function Slider({
  label, value, leftLabel, rightLabel, onChange,
}: {
  label: string; value: number; leftLabel: string; rightLabel: string; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs">
        <label className="font-bold text-foreground">{label}</label>
        <span className="font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-md">Level {value} / 5</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
      />
      <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

function Select({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
      <div>
        <p className="text-xs font-bold text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

export default function AISettingsPage() {
  const queryClient = useQueryClient();
  const { data: saved } = useQuery({ queryKey: ['ai-config'], queryFn: fetchConfig });
  const [config, setConfig] = useState<AIConfig>(saved || defaults);
  const [topicInput, setTopicInput] = useState('');
  const [avoidInput, setAvoidInput] = useState('');
  const [savedOk, setSavedOk] = useState(false);

  const save = useMutation({
    mutationFn: saveConfig,
    onSuccess: () => {
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
      queryClient.invalidateQueries({ queryKey: ['ai-config'] });
    },
  });

  const set = (key: keyof AIConfig, val: any) =>
    setConfig((c) => ({ ...c, [key]: val }));

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
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-indigo-900 via-purple-950 to-slate-900 text-white relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300 backdrop-blur-xs">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">AI Agent Brand Voice</h1>
            <p className="text-indigo-200 text-xs mt-0.5">
              Tune writing style, formality, tone sliders, content frequency, and guardrails.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Automation Settings */}
        <div className="glass-card rounded-2xl p-6 border space-y-4">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            Automation Controls
          </h2>
          <div className="space-y-3">
            <Toggle
              label="Auto-schedule approved suggestions"
              description="Immediately queue posts for the optimal time once you hit approve."
              checked={config.autoSchedule}
              onChange={(v) => set('autoSchedule', v)}
            />
            <Toggle
              label="Auto-approve high-confidence AI drafts"
              description="Allow AI agent to queue top trend posts automatically (use with confidence)."
              checked={config.autoApprove}
              onChange={(v) => set('autoApprove', v)}
            />
          </div>
        </div>

        {/* Content Frequency & Voice Tone */}
        <div className="glass-card rounded-2xl p-6 border space-y-6">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Tone & Style Sliders
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Slider label="Formality" value={config.formality} leftLabel="Casual / Conversational" rightLabel="Corporate / Authoritative" onChange={(v) => set('formality', v)} />
            <Slider label="Humor & Personality" value={config.humor} leftLabel="Serious / Insightful" rightLabel="Witty / Playful" onChange={(v) => set('humor', v)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <Select label="Emoji usage" value={config.emojiUsage} onChange={(v) => set('emojiUsage', v)}
              options={[{ value: 'none', label: 'None (0 emojis)' }, { value: 'light', label: 'Light (1-2 per post)' }, { value: 'moderate', label: 'Moderate (3-5 per post)' }, { value: 'heavy', label: 'Heavy' }]} />
            <Select label="Post length preference" value={config.postLength} onChange={(v) => set('postLength', v)}
              options={[{ value: 'short', label: 'Short (100-300 chars)' }, { value: 'medium', label: 'Medium (300-800 chars)' }, { value: 'long', label: 'Long-form (800+ chars)' }]} />
            <Select label="Content target frequency" value={config.postFrequency} onChange={(v) => set('postFrequency', v)}
              options={[
                { value: '1_week', label: '1 post per week' },
                { value: '3_week', label: '3 posts per week' },
                { value: '5_week', label: '5 posts per week (weekdays)' },
                { value: '7_week', label: '7 posts per week (daily)' },
              ]} />
          </div>
        </div>

        {/* Focus Topics */}
        <div className="glass-card rounded-2xl p-6 border space-y-4">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
            Target Focus Topics
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTopic()}
              placeholder="Add topic e.g. AI Engineering, SaaS Marketing..."
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button onClick={addTopic} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 flex items-center gap-1">
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {config.topics.map((t) => (
              <span key={t} className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-semibold">
                {t}
                <button onClick={() => set('topics', config.topics.filter((x) => x !== t))} className="hover:opacity-75">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={() => save.mutate(config)}
          disabled={save.isPending}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs transition-all disabled:opacity-50"
        >
          {save.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving Configuration...</>
          ) : savedOk ? (
            '✓ AI Settings Updated!'
          ) : (
            <><Save className="h-4 w-4" /> Save AI Configuration</>
          )}
        </button>
      </div>
    </div>
  );
}
