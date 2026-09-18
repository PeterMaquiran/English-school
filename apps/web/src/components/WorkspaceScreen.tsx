import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import Link from 'next/link';

export function WorkspaceScreen({
  title,
  description,
  steps,
  note,
  action,
}: {
  title: string;
  description: string;
  steps: { title: string; body: string }[];
  note?: string;
  action?: { href: string; label: string };
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="grid gap-4 md:grid-cols-2">
        {steps.map((step, index) => (
          <Card key={step.title} className="flex flex-col">
            <p className="text-[13px] font-medium text-muted">
              {String(index + 1).padStart(2, '0')}
            </p>
            <h2 className="mt-3 text-[21px] font-semibold tracking-tight">
              {step.title}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              {step.body}
            </p>
          </Card>
        ))}
      </div>
      {note ? <p className="mt-6 text-sm text-muted">{note}</p> : null}
      {action ? (
        <Link
          href={action.href}
          className="mt-8 inline-flex h-11 items-center rounded-full bg-accent px-5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          {action.label}
        </Link>
      ) : null}
    </>
  );
}
