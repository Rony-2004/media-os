import Link from 'next/link';
import { BookOpen, ExternalLink, Link2, MessageCircleQuestion, ShieldCheck } from 'lucide-react';
import { PageHeader, Panel } from '@/components/ui/product';

const helpItems = [
  {
    icon: Link2,
    title: 'Connect LinkedIn',
    description: 'Authorize publishing first. Engagement reads also require LinkedIn Community Management access.',
    href: '/accounts',
    label: 'Open accounts',
  },
  {
    icon: ShieldCheck,
    title: 'Why metrics can show —',
    description: 'A dash means LinkedIn did not return a verified value. ConnectUs never substitutes a made-up zero.',
    href: '/platform/linkedin?tab=published',
    label: 'Check sync status',
  },
  {
    icon: MessageCircleQuestion,
    title: 'Comment replies',
    description: 'Generate a suggestion, edit it, then publish manually. A reply is marked sent only after LinkedIn accepts it.',
    href: '/platform/linkedin?tab=comments',
    label: 'Open comments',
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
      <div className="grid gap-4 md:grid-cols-3">
        {helpItems.map((item) => {
          const Icon = item.icon;
          return (
            <Panel key={item.title} className="flex min-h-60 flex-col p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background">
                <Icon className="h-4 w-4" />
              </div>
              <h2 className="mt-6 text-base font-black tracking-tight">{item.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
              <Link href={item.href} className="mt-5 inline-flex items-center gap-2 text-xs font-bold underline decoration-border underline-offset-4 hover:decoration-primary">
                {item.label} <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Panel>
          );
        })}
      </div>
      <Panel className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h2 className="text-sm font-black">Developer note</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              LinkedIn read permissions are restricted. If a 403 appears after reconnecting, enable the required product in the LinkedIn Developer Portal.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
