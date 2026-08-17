'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-auth';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { Logo } from '@/components/brand/marks';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  useEffect(() => setMobileNavOpen(false), [pathname]);

  if (isLoading) {
    return (
      <div className="app-grid relative flex min-h-screen items-center justify-center">
        <div className="relative flex flex-col items-center gap-5">
          <div className="relative">
            <span className="absolute -inset-4 animate-pulse rounded-full bg-primary/20 blur-2xl" />
            <Logo className="relative h-12 w-12 animate-float" gradientId="loading-mark" />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            Loading workspace
          </p>
          <div className="skeleton h-1 w-32 rounded-full" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="app-grid relative flex min-h-screen">
      {/* Sidebar reads ?tab= to resolve its active item, so it needs a
          suspense boundary for prerendering. */}
      <Suspense fallback={<div className="hidden w-[272px] shrink-0 border-r border-border bg-card lg:block" />}>
        <Sidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      </Suspense>
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <Header user={user} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
