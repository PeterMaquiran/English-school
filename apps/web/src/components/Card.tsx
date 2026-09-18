import type { HTMLAttributes } from 'react';

export function Card({
  className = '',
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section
      {...props}
      className={`rounded-[22px] bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-line ${className}`}
    />
  );
}
