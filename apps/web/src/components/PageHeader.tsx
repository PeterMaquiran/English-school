export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-8">
      {eyebrow ? (
        <p className="mb-2 text-[13px] font-medium uppercase tracking-[0.08em] text-muted">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-[34px] font-semibold leading-tight tracking-tight">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 max-w-xl text-[17px] leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
    </header>
  );
}
