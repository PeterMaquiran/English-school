'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from '@/shared/hooks';
import { LogoutButton } from './LogoutButton';

export function DashboardScreen() {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session.status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [router, session.status]);

  if (session.status !== 'authenticated') {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Loading session…
      </p>
    );
  }

  return (
    <section className="flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Signed in as {session.user.name} ({session.user.email})
        </p>
        <p className="mt-1 text-sm uppercase tracking-wide text-zinc-500">
          Role: {session.user.role.replace('_', ' ')}
        </p>
      </div>
      <LogoutButton />
    </section>
  );
}
