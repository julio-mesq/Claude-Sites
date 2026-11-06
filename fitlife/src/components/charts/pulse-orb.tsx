"use client";

import { motion, useReducedMotion } from "motion/react";

/** Indicador circular animado do FitLife Pulse (consistência — não é indicador de saúde). */
export function PulseOrb({ score, label, size = 200, hasData = true }: { score: number; label: string; size?: number; hasData?: boolean }) {
  const reduce = useReducedMotion();
  const stroke = 12;
  const r = (size - stroke) / 2 - 10;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`FitLife Pulse: ${score} de 100, ${label}`}>
      {hasData && !reduce && (
        <>
          <span className="absolute inset-6 rounded-full border border-neon/40" style={{ animation: "var(--animate-pulse-ring)" }} />
          <span className="absolute inset-6 rounded-full border border-neon/30" style={{ animation: "var(--animate-pulse-ring)", animationDelay: "1.2s" }} />
        </>
      )}
      <div className="absolute inset-8 rounded-full bg-[radial-gradient(circle_at_50%_35%,rgba(182,255,59,0.18),transparent_65%)]" />
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="pulseGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#B6FF3B" />
            <stop offset="100%" stopColor="#77D63B" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none" />
        {Array.from({ length: 40 }).map((_, i) => {
          const a = (i / 40) * Math.PI * 2;
          const r1 = r + 14;
          const r2 = r + (i % 5 === 0 ? 20 : 17);
          const q = (n: number) => Math.round(n * 100) / 100;
          return <line key={i} x1={q(size / 2 + Math.cos(a) * r1)} y1={q(size / 2 + Math.sin(a) * r1)} x2={q(size / 2 + Math.cos(a) * r2)} y2={q(size / 2 + Math.sin(a) * r2)} stroke={i / 40 < score / 100 ? "rgba(182,255,59,0.55)" : "rgba(255,255,255,0.08)"} strokeWidth={1.5} />;
        })}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#pulseGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (score / 100) * c }}
          transition={{ duration: reduce ? 0 : 1.4, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ filter: "drop-shadow(0 0 8px rgba(182,255,59,0.45))" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-5xl font-extrabold tabular-nums">{hasData ? score : "—"}</div>
        <div className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-neon">{label}</div>
      </div>
    </div>
  );
}
