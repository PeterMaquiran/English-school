import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const styles: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover disabled:bg-accent/50',
  secondary:
    'bg-[#e8e8ed] text-foreground hover:bg-[#dcdce0] disabled:opacity-50',
  ghost: 'bg-transparent text-accent hover:bg-accent/5 disabled:opacity-50',
  danger: 'bg-danger text-white hover:bg-[#b80012] disabled:opacity-50',
};

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    />
  );
}
