import { cn } from "@/lib/utils";

export function ProgressBar({ value, max = 100, className, tone = "neon", label }: { value: number; max?: number; className?: string; tone?: "neon" | "info" | "warning" | "violet" | "danger"; label?: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const colors = { neon: "from-neon-600 to-neon", info: "from-sky-500 to-info", warning: "from-orange-400 to-warning", violet: "from-indigo-400 to-violet", danger: "from-red-500 to-danger" };
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-white/6", className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cn("h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out", colors[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Ring({ value, size = 120, stroke = 10, children, color = "#B6FF3B", track = "rgba(255,255,255,0.06)", label }: { value: number; size?: number; stroke?: number; children?: React.ReactNode; color?: string; track?: string; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label ?? `${Math.round(pct)}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} style={{ transition: "stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)", filter: `drop-shadow(0 0 6px ${color}55)` }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
