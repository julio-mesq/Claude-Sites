import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-xl border border-white/8 bg-ink-900/80 px-3.5 text-sm text-snow placeholder:text-mist-700 transition-colors focus:border-neon/60 focus:outline-none focus:ring-2 focus:ring-neon/20 disabled:opacity-50 aria-[invalid=true]:border-danger/60";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(base, "h-11", className)} {...p} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn(base, "min-h-24 py-3", className)} {...p} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...p }, ref) {
  return (
    <select ref={ref} className={cn(base, "h-11 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23939B96%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:14px] bg-[right_12px_center] bg-no-repeat pr-9", className)} {...p}>
      {children}
    </select>
  );
});

export function Field({ label, error, hint, children, className, htmlFor }: { label?: ReactNode; error?: string | null; hint?: ReactNode; children: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-xs font-medium uppercase tracking-wider text-mist">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-mist-700">{hint}</p>
      ) : null}
    </div>
  );
}

/** Campo com rótulo associado automaticamente. */
export function TextField({ label, error, hint, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; error?: string | null; hint?: ReactNode }) {
  const id = useId();
  return (
    <Field label={label} error={error} hint={hint} htmlFor={props.id ?? id} className={className}>
      <Input id={props.id ?? id} aria-invalid={!!error} {...props} />
    </Field>
  );
}
