import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center px-6 py-24">
      <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-muted">
        English School
      </p>
      <h1 className="mt-4 text-[52px] font-semibold leading-[1.05] tracking-tight">
        Placement,
        <br />
        simply.
      </h1>
      <p className="mt-5 max-w-md text-[19px] leading-relaxed text-muted">
        Sign in to place students on the CEFR scale and keep a clear record of
        every change.
      </p>
      <Link
        href="/login"
        className="mt-8 inline-flex h-12 w-fit items-center rounded-full bg-accent px-6 text-[15px] font-medium text-white hover:bg-accent-hover"
      >
        Sign in
      </Link>
    </main>
  );
}
