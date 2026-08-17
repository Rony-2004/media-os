import Link from 'next/link';
import { ArrowLeft, Check, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/brand/marks';
import { ThemeSwitchButton } from '@/components/theme-toggle';

const highlights = [
  'Drafts written from trends your audience actually engages with',
  'Nothing publishes until you approve the exact wording',
  'Engagement you can verify — never an invented number',
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen bg-background p-3 sm:p-5">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl overflow-hidden rounded-3xl border border-border bg-card shadow-card sm:min-h-[calc(100vh-2.5rem)] lg:grid-cols-[1.05fr_0.95fr]">
        {/* ── Brand panel ─────────────────────────────────────────────── */}
        {/* Deliberately constant-dark in both themes: it is a printed panel,
            not a themed surface. Red appears only on the signal accents. */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#0B0A0A] p-10 text-white lg:flex xl:p-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.85) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          <div className="relative flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-white/10">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            <div>
              <p className="text-base font-bold tracking-[-0.02em]">SocialFlow</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/55">
                Social OS / 01
              </p>
            </div>
          </div>

          <div className="relative max-w-xl">
            <p className="mb-6 inline-flex items-center gap-2 border border-white/20 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/75">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Signal over noise
            </p>
            <h1 className="text-5xl font-bold leading-[1.02] tracking-[-0.045em] xl:text-6xl">
              Build a social presence that sounds like you.
            </h1>
            <ul className="mt-9 space-y-3.5">
              {highlights.map((item, index) => (
                <li
                  key={item}
                  className="flex animate-fade-in items-start gap-3 text-sm leading-6 text-white/70"
                  style={{ animationDelay: `${180 + index * 90}ms` }}
                >
                  <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative grid grid-cols-3 gap-4">
            {[
              ['01', 'Draft with intent'],
              ['02', 'Publish with control'],
              ['03', 'Read real signals'],
            ].map(([number, label]) => (
              <div key={number} className="border-t border-white/20 pt-3">
                <p className="font-mono text-[10px] text-primary">{number}</p>
                <p className="mt-1.5 text-[13px] font-semibold text-white/85">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Form panel ──────────────────────────────────────────────── */}
        <section className="relative flex min-w-0 flex-col p-5 sm:p-8 lg:p-10 xl:p-14">
          <div className="dot-grid pointer-events-none absolute inset-0 opacity-40 mask-fade-b lg:hidden" />

          <div className="relative mb-10 flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-3 lg:hidden">
              <Logo gradientId="auth-mark" />
              <span className="text-sm font-bold tracking-[-0.02em]">
                Social<span className="gradient-text">Flow</span>
              </span>
            </Link>
            <Link
              href="/"
              className="hidden items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground lg:inline-flex"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to home
            </Link>
            <ThemeSwitchButton />
          </div>

          <div className="relative my-auto w-full max-w-md self-center py-6">{children}</div>

          <p className="relative mt-10 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            Encrypted session · Human-controlled publishing
          </p>
        </section>
      </div>
    </main>
  );
}
