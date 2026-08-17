'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Bot,
  CalendarClock,
  ChevronDown,
  Github,
  Layers,
  Lock,
  MessageCircle,
  Minus,
  ShieldCheck,
  Sparkles,
  Twitter,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/marks';
import { ThemeSwitchButton } from '@/components/theme-toggle';
import { AppPreview } from '@/components/marketing/preview';

/* ── Data ────────────────────────────────────────────────────────────────── */

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'FAQ', href: '#faq' },
];

const features = [
  {
    icon: Sparkles,
    title: 'Trend-aware drafting',
    body: 'The writer watches the topics your audience actually engages with, then drafts in your voice — not a template’s.',
    span: 'lg:col-span-2',
  },
  {
    icon: CalendarClock,
    title: 'A queue you control',
    body: 'Approve, edit, or reject. Nothing reaches a feed without a human saying yes.',
    span: '',
  },
  {
    icon: BarChart3,
    title: 'Verified engagement only',
    body: 'When a number can’t be read from the platform, you see a dash — never an invented zero.',
    span: '',
  },
  {
    icon: MessageCircle,
    title: 'Reply assistant',
    body: 'Suggested replies to real comments, drafted in context and sent only after you approve the wording.',
    span: 'lg:col-span-2',
  },
];

const steps = [
  {
    number: '01',
    icon: Layers,
    title: 'Connect',
    body: 'Authorize LinkedIn once. Tokens stay server-side, encrypted, and revocable from your settings.',
  },
  {
    number: '02',
    icon: Bot,
    title: 'Tune your voice',
    body: 'Set formality, humour, length, topics, and the buzzwords you never want to see again.',
  },
  {
    number: '03',
    icon: Zap,
    title: 'Review and ship',
    body: 'Approve drafts, schedule the queue, publish, and read engagement that actually came back.',
  },
];

const stats = [
  { value: '3 min', label: 'From connect to first draft' },
  { value: '100%', label: 'Human-approved publishing' },
  { value: '0', label: 'Invented metrics, ever' },
  { value: '< 60s', label: 'Engagement sync interval' },
];

const testimonials = [
  {
    quote:
      'It stopped feeling like a chore. I approve three drafts on Monday and the week is handled.',
    name: 'Priya R.',
    role: 'Staff Engineer',
  },
  {
    quote:
      'The dash instead of a fake zero is the reason I trust the dashboard. Everything else is noise.',
    name: 'Dan M.',
    role: 'Founder, infra tooling',
  },
  {
    quote:
      'Voice tuning nailed it after two passes. My teammates could not tell which posts started as drafts.',
    name: 'Amara O.',
    role: 'Developer Advocate',
  },
];

const faqs = [
  {
    q: 'Does anything publish automatically?',
    a: 'No. Every post and every reply waits for an explicit approval. Auto-scheduling only moves an already-approved draft into the queue.',
  },
  {
    q: 'Why do some metrics show a dash?',
    a: 'A dash means the platform did not return a verified value — usually because engagement read access has not been granted. We would rather show nothing than a number we cannot prove.',
  },
  {
    q: 'Which platforms are supported?',
    a: 'LinkedIn is live today, including publishing, engagement reads, and comment replies. X is in progress; the pipeline is built to take more providers.',
  },
  {
    q: 'Where do my access tokens live?',
    a: 'Server-side only, encrypted at rest. The browser never receives a provider token, and disconnecting an account revokes it immediately.',
  },
];

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          scrolled ? 'border-b border-border/70 bg-background/80 backdrop-blur-xl' : 'border-b border-transparent',
        )}
      >
        <nav className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Logo gradientId="nav-mark" />
            <span className="text-[15px] font-bold tracking-[-0.02em]">
              Social<span className="gradient-text">Flow</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ThemeSwitchButton className="hidden sm:grid" />
            <Link href="/login" className="btn-ghost h-9 px-3 text-[13px]">
              Sign in
            </Link>
            <Link href="/register" className="btn-primary h-9 px-4 text-[13px]">
              Get started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileNav((open) => !open)}
              aria-label="Toggle menu"
              className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card md:hidden"
            >
              <ChevronDown className={cn('h-4 w-4 transition-transform', mobileNav && 'rotate-180')} />
            </button>
          </div>
        </nav>

        {mobileNav ? (
          <div className="animate-slide-down border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur-xl md:hidden">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileNav(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>
        ) : null}
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pb-20 pt-36 sm:pb-28 sm:pt-44">
        <div className="dots-lg pointer-events-none absolute inset-0 mask-fade-b" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-7 inline-flex animate-fade-in items-center gap-2 rounded-full border border-border bg-card/70 py-1.5 pl-1.5 pr-4 text-xs backdrop-blur-md">
              <span className="chip border-transparent bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                New
              </span>
              <span className="text-muted-foreground">Comment reply assistant is live</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </div>

            <h1
              className="animate-fade-in text-[40px] font-bold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl"
              style={{ animationDelay: '60ms' }}
            >
              Build a social presence
              <br />
              that <span className="text-primary">sounds like you</span>.
            </h1>

            <p
              className="mx-auto mt-6 max-w-xl animate-fade-in text-base leading-7 text-muted-foreground sm:text-lg"
              style={{ animationDelay: '120ms' }}
            >
              SocialFlow drafts from real trends, queues what you approve, publishes on your
              schedule, and reports only the engagement it can actually verify.
            </p>

            <div
              className="mt-9 flex animate-fade-in flex-col items-center justify-center gap-3 sm:flex-row"
              style={{ animationDelay: '180ms' }}
            >
              <Link href="/register" className="btn-primary h-12 w-full px-7 text-[15px] sm:w-auto">
                Start free — no card
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#workflow" className="btn-secondary h-12 w-full px-7 text-[15px] sm:w-auto">
                See how it works
              </a>
            </div>

            <div
              className="mt-8 flex animate-fade-in flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
              style={{ animationDelay: '240ms' }}
            >
              {[
                { icon: ShieldCheck, label: 'Human-approved publishing' },
                { icon: Lock, label: 'Tokens never leave the server' },
                { icon: Minus, label: 'No invented metrics' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <span key={item.label} className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    {item.label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Product shot */}
          <div
            className="relative mx-auto mt-16 max-w-5xl animate-fade-in"
            style={{ animationDelay: '300ms' }}
          >
            <AppPreview />

            {/* Signal readout. Aligned to the frame below the shot rather than
                floating over it, so nothing ever covers the interface. */}
            <div className="mt-3 grid overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-3">
              {[
                { label: 'Draft approved', value: 'Queued for Tue 09:00' },
                { label: 'Published', value: '128 posts live' },
                { label: 'Verified engagement', value: '+184 reactions · 40s ago' },
              ].map((signal, index) => (
                <div
                  key={signal.label}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3',
                    index > 0 && 'border-t border-border sm:border-l sm:border-t-0',
                  )}
                >
                  <span className="signal-pulse h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                      {signal.label}
                    </p>
                    <p className="mt-0.5 truncate text-xs font-semibold">{signal.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="relative scroll-mt-24 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="dot-label mb-4">Capabilities</p>
            <h2 className="text-3xl font-bold tracking-[-0.035em] sm:text-[44px] sm:leading-[1.08]">
              Four moving parts. No black boxes.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Every stage of the pipeline is inspectable, editable, and reversible — which is the
              only way an assistant earns a place next to your name.
            </p>
          </div>

          <div className="stagger mt-14 grid gap-4 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className={cn(
                    'surface group relative overflow-hidden p-7 transition-colors duration-200 hover:border-foreground/25',
                    feature.span,
                  )}
                >
                  <span className="grid h-11 w-11 place-items-center rounded-md border border-border bg-muted text-foreground transition-colors duration-200 group-hover:border-primary/40 group-hover:text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-6 text-lg font-bold tracking-tight">{feature.title}</h3>
                  <p className="mt-2.5 max-w-md text-sm leading-6 text-muted-foreground">
                    {feature.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Workflow ────────────────────────────────────────────────────── */}
      <section id="workflow" className="relative scroll-mt-24 overflow-hidden py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 bg-muted/25" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="dot-label mb-4 justify-center">Workflow</p>
            <h2 className="text-3xl font-bold tracking-[-0.035em] sm:text-[44px] sm:leading-[1.08]">
              Three steps, then it runs weekly.
            </h2>
          </div>

          <div className="relative mt-16 grid gap-6 md:grid-cols-3">
            <div className="pointer-events-none absolute left-0 right-0 top-[52px] hidden h-px bg-fade-border md:block" />
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="relative animate-fade-in" style={{ animationDelay: `${index * 90}ms` }}>
                  <div className="relative mx-auto grid h-[104px] w-[104px] place-items-center">
                    <span className="surface relative grid h-16 w-16 place-items-center rounded-lg bg-background text-primary">
                      <Icon className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
                      {step.number}
                    </p>
                    <h3 className="mt-2 text-lg font-bold tracking-tight">{step.title}</h3>
                    <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <section className="border-y border-border/70 py-14">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="gradient-text text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="dot-label mb-4">Signal from users</p>
            <h2 className="text-3xl font-bold tracking-[-0.035em] sm:text-[44px] sm:leading-[1.08]">
              Written by people who hate posting.
            </h2>
          </div>

          <div className="stagger mt-14 grid gap-4 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <figure
                key={testimonial.name}
                className="surface edge-light flex flex-col p-7 transition-all duration-300 ease-spring hover:-translate-y-1 hover:border-primary/30"
              >
                <span className="font-mono text-3xl leading-none text-primary/40">“</span>
                <blockquote className="mt-3 flex-1 text-sm leading-7 text-foreground">
                  {testimonial.quote}
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-border/70 pt-5">
                  <span className="grid h-9 w-9 place-items-center rounded-md border border-border bg-muted text-xs font-bold">
                    {testimonial.name.charAt(0)}
                  </span>
                  <span>
                    <span className="block text-xs font-bold">{testimonial.name}</span>
                    <span className="block font-mono text-[10px] text-muted-foreground">
                      {testimonial.role}
                    </span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="scroll-mt-24 py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="dot-label mb-4">Questions</p>
            <h2 className="text-3xl font-bold tracking-[-0.035em] sm:text-[40px] sm:leading-[1.1]">
              The things people ask first.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Still unsure?{' '}
              <Link href="/register" className="font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">
                Create an account
              </Link>{' '}
              — the free tier shows the whole loop.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="surface group overflow-hidden px-5 py-4 transition-colors duration-200 open:border-primary/30 hover:border-primary/25"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/70 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:px-8">
          <div className="flex items-center gap-3">
            <Logo gradientId="footer-mark" />
            <div>
              <p className="text-sm font-bold tracking-[-0.02em]">
                Social<span className="gradient-text">Flow</span>
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Social OS
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
                {link.label}
              </a>
            ))}
            <Link href="/help" className="transition-colors hover:text-foreground">
              Help
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <ThemeSwitchButton />
            {[Github, Twitter].map((Icon, index) => (
              <span
                key={index}
                className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground"
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>
        <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          © {new Date().getFullYear()} SocialFlow · Human-controlled publishing
        </p>
      </footer>
    </div>
  );
}
