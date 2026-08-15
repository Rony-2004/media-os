import { ArrowUpRight, Radio, Sparkles } from 'lucide-react';
import { NothingMark } from '@/components/brand/marks';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="app-grid min-h-screen p-3 sm:p-5">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm sm:min-h-[calc(100vh-2.5rem)] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden bg-foreground p-10 text-background lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(currentColor_0.7px,transparent_0.7px)] [background-size:16px_16px]" />
          <div className="relative flex items-center gap-3">
            <NothingMark className="bg-background text-foreground" />
            <div>
              <p className="font-black tracking-[-0.04em]">CONNECT/US</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] opacity-55">Social OS / 01</p>
            </div>
          </div>
          <div className="relative max-w-xl">
            <p className="mb-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] opacity-55">
              <Radio className="h-3.5 w-3.5 text-primary" /> Signal over noise
            </p>
            <h1 className="text-5xl font-black leading-[0.96] tracking-[-0.055em] xl:text-6xl">
              Build a social presence that sounds like you.
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-7 opacity-65">
              Create, schedule, publish, and understand your content from one focused workspace.
            </p>
          </div>
          <div className="relative grid grid-cols-3 gap-3">
            {[
              ['01', 'Draft with intent'],
              ['02', 'Publish with control'],
              ['03', 'Read real signals'],
            ].map(([number, label]) => (
              <div key={number} className="border-t border-background/20 pt-3">
                <p className="font-mono text-[9px] text-primary">{number}</p>
                <p className="mt-1 text-xs font-semibold opacity-70">{label}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="flex min-w-0 flex-col p-5 sm:p-8 lg:p-10 xl:p-14">
          <div className="mb-10 flex items-center justify-between lg:justify-end">
            <div className="flex items-center gap-3 lg:hidden">
              <NothingMark />
              <span className="text-sm font-black tracking-tight">CONNECT/US</span>
            </div>
            <div className="hidden items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground sm:flex">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Secure access
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="my-auto w-full max-w-md self-center">{children}</div>
          <p className="mt-10 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
            Encrypted session · Human-controlled publishing
          </p>
        </section>
      </div>
    </main>
  );
}
