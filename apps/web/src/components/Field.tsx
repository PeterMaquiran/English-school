import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

const controlClass =
  'h-11 w-full rounded-xl border-0 bg-[#f5f5f7] px-3.5 text-[15px] text-foreground outline-none ring-0 transition placeholder:text-muted focus:bg-white focus:ring-2 focus:ring-accent/25';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-medium text-muted">
      {label}
      {children}
      {hint ? <span className="font-normal">{hint}</span> : null}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className={`${controlClass} ${props.className ?? ''}`} />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${controlClass} ${props.className ?? ''}`} />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-24 w-full rounded-xl border-0 bg-[#f5f5f7] px-3.5 py-3 text-[15px] text-foreground outline-none focus:bg-white focus:ring-2 focus:ring-accent/25 ${props.className ?? ''}`}
    />
  );
}
