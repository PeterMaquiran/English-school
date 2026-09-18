import type { CefrLevel } from '@english-school/shared';

export function CefrBadge({ level }: { level: CefrLevel | null | undefined }) {
  if (!level) {
    return <span className="text-sm text-muted">Not placed</span>;
  }

  return (
    <span className="inline-flex h-7 items-center rounded-full bg-[#e8e8ed] px-2.5 text-[13px] font-semibold tracking-wide text-foreground">
      {level}
    </span>
  );
}
