export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="px-2 py-10 text-center">
      <p className="text-[17px] font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}
