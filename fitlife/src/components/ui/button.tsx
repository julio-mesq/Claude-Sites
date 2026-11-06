import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-neon text-ink-950 hover:bg-[#c6ff63] shadow-[0_8px_24px_-10px_rgb(182_255_59/0.6)] font-semibold",
  secondary: "bg-ink-700 text-snow hover:bg-ink-600 border border-white/5",
  ghost: "text-mist hover:text-snow hover:bg-white/5",
  danger: "bg-danger/15 text-danger hover:bg-danger/25 border border-danger/30",
  outline: "border border-white/12 text-snow hover:border-neon/50 hover:bg-neon/5",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-lg gap-1.5",
  md: "h-11 px-5 text-sm rounded-xl gap-2",
  lg: "h-13 px-7 text-base rounded-xl gap-2",
  icon: "h-10 w-10 rounded-xl",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn("inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 active:scale-[0.98]", variants[variant], sizes[size], className);
}
