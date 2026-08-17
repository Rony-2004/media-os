import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Link2,
  MessageCircleQuestion,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { PageHeader, Panel, SectionTitle } from '@/components/ui/product';

const helpItems = [
  {
    icon: Link2,
    title: 'Connect LinkedIn',
    description:
      'Authorize publishing first. Engagement reads additionally require LinkedIn Community Management access on your developer app.',
    href: '/accounts',
    label: 'Open accounts',
  },
  {
    icon: ShieldCheck,
    title: 'Why metrics show a dash',
    description:
      'A dash means LinkedIn did not return a verified value. SocialFlow never substitutes a made-up zero in its place.',
    href: '/platform/linkedin?tab=published',
    label: 'Check sync status',
  },
  {
    icon: MessageCircleQuestion,
    title: 'Comment replies',
    description:
      'Generate a suggestion, edit it, then publish manually. A reply is marked sent only once LinkedIn accepts it.',
    href: '/platform/linkedin?tab=comments',
    label: 'Open comments',
  },
];

const faqs = [
  {
    q: 'Can the assistant publish without me?',
    a: 'No. Auto-scheduling only moves an already-approved draft into the queue. Every post and reply needs an explicit approval first.',
  },
  {
    q: 'How often does engagement sync?',
    a: 'Published posts refresh roughly every minute while the pipeline is open. If a sync fails, the card says so instead of showing stale numbers silently.',
  },
  {
    q: 'What happens when I disconnect an account?',
    a: 'The stored tokens are deleted immediately and any scheduled posts bound to that account are cancelled.',
  },
  {
    q: 'Where do development verification codes appear?',
    a: 'In the server terminal running the Next.js app, until an email provider is configured.',
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <PageHeader
        eyebrow="Support"
        title="Help centre"
        description="Quick answers for connecting accounts, reading engagement, and working with AI-assisted replies."
      />

      <div className="stagger grid gap-4 md:grid-cols-3">
        {helpItems.map((item) => {
          const Icon = item.icon;
          return (
            <Panel key={item.title} interactive className="group flex min-h-64 flex-col overflow-hidden p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-6 text-base font-bold tracking-tight">{item.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
              <Link
                href={item.href}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-all group-hover:gap-2.5"
              >
                {item.label} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Panel>
          );
        })}
      </div>

      <section className="space-y-4">
        <SectionTitle icon={<MessageCircleQuestion className="h-3.5 w-3.5" />}>
          Frequent questions
        </SectionTitle>
        <div className="space-y-2.5">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="surface group overflow-hidden px-5 py-4 transition-colors duration-200 open:border-primary/30 hover:border-primary/25"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-transform duration-300 group-open:rotate-45">
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <Panel className="flex flex-col items-start gap-4 overflow-hidden p-6 sm:flex-row sm:items-center">
        <div className="aurora">
          <span className="left-[-4%] top-[-100%] h-48 w-48 animate-drift bg-primary/20" />
        </div>
        <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <BookOpen className="h-4 w-4" />
        </span>
        <div className="relative min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            Developer note
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </h2>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            LinkedIn read permissions are restricted. If a 403 appears after reconnecting, enable the
            required product in the LinkedIn Developer Portal, then reconnect the account.
          </p>
        </div>
      </Panel>
    </div>
  );
}
