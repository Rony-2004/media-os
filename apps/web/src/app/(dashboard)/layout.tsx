'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-auth';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { NothingMark } from '@/components/brand/marks';

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
      <div className="app-grid flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <NothingMark className="animate-pulse" />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Loading workspace
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="app-grid flex min-h-screen">
      <Sidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="min-w-0 flex-1">
        <Header user={user} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
