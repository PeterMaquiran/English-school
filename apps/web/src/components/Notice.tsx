export function Notice({
  tone = 'error',
  children,
}: {
  tone?: 'error' | 'success';
  children: string;
}) {
  const color = tone === 'error' ? 'text-danger' : 'text-[#248a3d]';
  return (
    <p
      className={`text-sm ${color}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </p>
  );
}
