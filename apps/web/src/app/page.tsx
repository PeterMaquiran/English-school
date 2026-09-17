import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-xl flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">English School</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Sign in with your school account to open the dashboard.
      </p>
      <Link
        href="/login"
        className="w-fit rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950"
      >
        Sign in
      </Link>
    </main>
  );
}
