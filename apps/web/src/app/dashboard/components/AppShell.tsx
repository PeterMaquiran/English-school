'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { authRepository, type AuthUser } from '@/module/auth';
import { firstName } from '@/utils/format';
import { dashboardNav } from '@/utils/nav';
import { getApiErrorMessage } from '@/utils/api-error-message';

export function AppShell({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const links = dashboardNav(user.role);

  async function signOut() {
    setPending(true);
    const result = await authRepository.logout();
    setPending(false);
    if (result.isErr()) {
      window.alert(getApiErrorMessage(result.error));
      return;
    }
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-full md:flex">
      <aside className="border-b border-line bg-[#f5f5f7] md:sticky md:top-0 md:flex md:h-screen md:w-56 md:shrink-0 md:flex-col md:border-b-0 md:border-r md:px-4 md:py-6">
        <div className="flex items-center justify-between px-5 py-3 md:block md:px-2 md:py-0">
          <Link href="/dashboard" className="block">
            <p className="text-[15px] font-semibold tracking-tight">
              English School
            </p>
            <p className="hidden text-[12px] text-muted md:block">
              Hello, {firstName(user.name)}
            </p>
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            disabled={pending}
            className="text-[13px] text-accent md:hidden"
          >
            Sign out
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:mt-8 md:flex-1 md:flex-col md:overflow-visible md:px-0 md:pb-0">
          {links.map((link) => {
            const active = link.exact
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-[13px] transition md:rounded-xl ${
                  active
                    ? 'bg-white text-foreground shadow-sm ring-1 ring-line'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => void signOut()}
          disabled={pending}
          className="mt-4 hidden px-2 text-left text-[13px] text-accent hover:underline disabled:opacity-50 md:block"
        >
          {pending ? 'Signing out…' : 'Sign out'}
        </button>
      </aside>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
