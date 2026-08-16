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
        <section className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex xl:p-14">
          <div className="absolute inset-0 bg-brand-gradient" />
          <div className="aurora">
            <span className="left-[-10%] top-[10%] h-[400px] w-[400px] animate-drift bg-white/25" />
            <span
              className="bottom-[-10%] right-[-5%] h-[360px] w-[360px] animate-drift bg-black/25"
              style={{ animationDelay: '-11s' }}
            />
          </div>
          <div className="noise absolute inset-0" />
          <div
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />

          <div className="relative flex items-center gap-3 text-white">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur-sm">
              <span className="h-3 w-3 rounded-full bg-white" />
            </span>
            <div>
              <p className="text-base font-bold tracking-[-0.02em]">ConnectUs</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.24em] opacity-70">
                Social OS / 01
              </p>
            </div>
          </div>

          <div className="relative max-w-xl text-white">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] backdrop-blur-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Signal over noise
            </p>
            <h1 className="text-5xl font-bold leading-[1.02] tracking-[-0.045em] xl:text-6xl">
              Build a social presence that sounds like you.
            </h1>
            <ul className="mt-9 space-y-3.5">
              {highlights.map((item, index) => (
                <li
                  key={item}
                  className="flex animate-fade-in items-start gap-3 text-sm leading-6 opacity-90"
                  style={{ animationDelay: `${180 + index * 90}ms` }}
                >
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/20">
                    <Check className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative grid grid-cols-3 gap-4 text-white">
            {[
              ['01', 'Draft with intent'],
              ['02', 'Publish with control'],
              ['03', 'Read real signals'],
            ].map(([number, label]) => (
              <div key={number} className="border-t border-white/25 pt-3">
                <p className="font-mono text-[10px] opacity-70">{number}</p>
                <p className="mt-1.5 text-[13px] font-semibold">{label}</p>
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
                Connect<span className="gradient-text">Us</span>
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
