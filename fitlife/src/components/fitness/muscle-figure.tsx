import { HeartPulse, StretchHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type G = "CHEST" | "BACK" | "SHOULDERS" | "BICEPS" | "TRICEPS" | "LEGS" | "GLUTES" | "ABS" | "CARDIO" | "MOBILITY";

/** Ilustração anatômica estilizada (frente e costas) destacando grupos musculares. */
export function MuscleFigure({ primary, secondary = [], className, intensity }: { primary?: G | null; secondary?: G[]; className?: string; intensity?: Partial<Record<G, number>> }) {
  if (!intensity && (primary === "CARDIO" || primary === "MOBILITY")) {
    const Icon = primary === "CARDIO" ? HeartPulse : StretchHorizontal;
    return (
      <div className={cn("relative grid place-items-center", className)} aria-hidden>
        <div className="absolute h-24 w-24 rounded-full bg-neon/15 blur-2xl" />
        <Icon className="relative h-16 w-16 text-neon" strokeWidth={1.25} />
      </div>
    );
  }
  const fill = (g: G) => {
    if (intensity) {
      const v = intensity[g] ?? 0;
      return v > 0 ? `rgba(182,255,59,${0.18 + v * 0.75})` : "rgba(255,255,255,0.06)";
    }
    return g === primary ? "#B6FF3B" : secondary.includes(g) ? "rgba(182,255,59,0.4)" : "rgba(255,255,255,0.06)";
  };
  const base = "rgba(255,255,255,0.04)";
  const stroke = "rgba(255,255,255,0.14)";
  const Body = ({ back }: { back?: boolean }) => (
    <g stroke={stroke} strokeWidth="0.8">
      <circle cx="50" cy="14" r="9" fill={base} />
      <rect x="45" y="22" width="10" height="6" rx="2" fill={base} />
      {/* ombros */}
      <ellipse cx="31" cy="35" rx="8" ry="7" fill={fill("SHOULDERS")} />
      <ellipse cx="69" cy="35" rx="8" ry="7" fill={fill("SHOULDERS")} />
      {back ? (
        <>
          <path d="M38 30 H62 L64 58 Q50 64 36 58 Z" fill={fill("BACK")} />
          <ellipse cx="25" cy="50" rx="5" ry="10" fill={fill("TRICEPS")} />
          <ellipse cx="75" cy="50" rx="5" ry="10" fill={fill("TRICEPS")} />
          <path d="M36 62 Q50 58 64 62 L64 76 Q50 82 36 76 Z" fill={fill("GLUTES")} />
          <rect x="37" y="80" width="11" height="30" rx="5" fill={fill("LEGS")} />
          <rect x="52" y="80" width="11" height="30" rx="5" fill={fill("LEGS")} />
        </>
      ) : (
        <>
          <path d="M38 30 H62 L62 46 Q50 50 38 46 Z" fill={fill("CHEST")} />
          <ellipse cx="25" cy="50" rx="5" ry="10" fill={fill("BICEPS")} />
          <ellipse cx="75" cy="50" rx="5" ry="10" fill={fill("BICEPS")} />
          <rect x="41" y="49" width="18" height="24" rx="5" fill={fill("ABS")} />
          <path d="M37 76 Q50 72 63 76 L63 80 L37 80 Z" fill={base} />
          <rect x="37" y="80" width="11" height="30" rx="5" fill={fill("LEGS")} />
          <rect x="52" y="80" width="11" height="30" rx="5" fill={fill("LEGS")} />
        </>
      )}
      <rect x="21" y="61" width="7" height="16" rx="3.5" fill={base} />
      <rect x="72" y="61" width="7" height="16" rx="3.5" fill={base} />
      <rect x="38" y="112" width="9" height="22" rx="4" fill={back ? fill("LEGS") : base} />
      <rect x="53" y="112" width="9" height="22" rx="4" fill={back ? fill("LEGS") : base} />
    </g>
  );
  return (
    <svg viewBox="0 0 210 140" className={cn("h-auto w-full", className)} role="img" aria-label="Ilustração dos músculos trabalhados">
      <g transform="translate(0,3)">
        <Body />
      </g>
      <g transform="translate(108,3)">
        <Body back />
      </g>
      <text x="50" y="140" textAnchor="middle" fontSize="7" fill="#5d6560">
        frente
      </text>
      <text x="158" y="140" textAnchor="middle" fontSize="7" fill="#5d6560">
        costas
      </text>
    </svg>
  );
}
