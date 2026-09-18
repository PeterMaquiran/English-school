'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardUserContext, useSession } from '@/shared/hooks';
import { AppShell } from './AppShell';

export function DashboardGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session.status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [router, session.status]);

  if (session.status !== 'authenticated') {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <DashboardUserContext.Provider value={session.user}>
      <AppShell user={session.user}>{children}</AppShell>
    </DashboardUserContext.Provider>
  );
}
