import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    // Cores sólidas: um gradiente com id compartilhado some quando a primeira instância está oculta (ex.: sidebar no mobile).
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8", className)} aria-hidden>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="#101414" stroke="#B6FF3B" strokeOpacity=".45" />
      <path d="M9 22.5 13.5 9h9.5l-1.2 3.6h-5.9l-.9 2.7h5.2l-1.2 3.6H13.8L12.6 22.5Z" fill="#B6FF3B" />
      <circle cx="23" cy="21.5" r="2" fill="#77D63B" />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)} aria-label="FitLife — início">
      <LogoMark />
      <span className="font-display text-lg font-extrabold tracking-[0.12em]">
        FIT<span className="text-neon">LIFE</span>
      </span>
    </Link>
  );
}
