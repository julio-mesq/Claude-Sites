"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode; disabled?: boolean }) {
  return (
    <label className={cn("flex cursor-pointer items-start justify-between gap-4 py-3", disabled && "cursor-not-allowed opacity-50")}>
      <span>
        <span className="block text-sm font-medium text-snow">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-mist">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn("relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-neon" : "bg-ink-600")}
      >
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5.5 bg-ink-950" : "translate-x-0.5")} />
      </button>
    </label>
  );
}

export function Segmented<T extends string>({ value, onChange, options, className, size = "md" }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; className?: string; size?: "sm" | "md" }) {
  return (
    <div role="tablist" className={cn("inline-flex rounded-xl border border-white/6 bg-ink-900/80 p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          type="button"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg font-medium transition-all",
            size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
            value === o.value ? "bg-neon text-ink-950 shadow" : "text-mist hover:text-snow",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-2 text-sm transition-all",
        active ? "border-neon/60 bg-neon/12 text-neon shadow-[0_0_0_1px_rgb(182_255_59/0.2)]" : "border-white/8 bg-ink-900/60 text-mist hover:border-white/20 hover:text-snow",
      )}
    >
      {children}
    </button>
  );
}

export function Stat({ label, value, unit, hint, icon, tone = "neon" }: { label: string; value: ReactNode; unit?: string; hint?: ReactNode; icon?: ReactNode; tone?: "neon" | "info" | "warning" | "violet" }) {
  const tones = { neon: "text-neon bg-neon/10", info: "text-info bg-info/10", warning: "text-warning bg-warning/10", violet: "text-violet bg-violet/10" };
  return (
    <div className="glass group relative overflow-hidden rounded-2xl p-4 transition-colors hover:border-white/10">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-mist">{label}</span>
        {icon && <span className={cn("grid h-8 w-8 place-items-center rounded-lg", tones[tone])}>{icon}</span>}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-display text-2xl font-bold tabular-nums">{value}</span>
        {unit && <span className="text-sm text-mist">{unit}</span>}
      </div>
      {hint && <div className="mt-1 text-xs text-mist">{hint}</div>}
    </div>
  );
}

/** Renderizador mínimo e seguro de markdown (negrito, itálico, listas). Não usa HTML bruto. */
export function SafeMarkdown({ text }: { text: string }) {
  const inline = (s: string, key: string) => {
    const parts = s.split(/(\*\*[^*]+\*\*|_[^_]+_)/g);
    return parts.map((p, i) =>
      p.startsWith("**") && p.endsWith("**") ? <strong key={`${key}-${i}`}>{p.slice(2, -2)}</strong> : p.startsWith("_") && p.endsWith("_") && p.length > 2 ? <em key={`${key}-${i}`}>{p.slice(1, -1)}</em> : <span key={`${key}-${i}`}>{p}</span>,
    );
  };
  const blocks: ReactNode[] = [];
  const lines = text.split("\n");
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(<Tag key={`l${blocks.length}`}>{list.items.map((it, i) => <li key={i}>{inline(it, `li${blocks.length}-${i}`)}</li>)}</Tag>);
    list = null;
  };
  lines.forEach((line, idx) => {
    const ul = line.match(/^\s*[-*]\s+(.*)/);
    const ol = line.match(/^\s*\d+\.\s+(.*)/);
    if (ul || ol) {
      const ordered = !!ol;
      if (list && list.ordered !== ordered) flush();
      list ??= { ordered, items: [] };
      list.items.push((ul ?? ol)![1]!);
      return;
    }
    flush();
    if (line.trim()) blocks.push(<p key={`p${idx}`}>{inline(line.replace(/^#+\s*/, ""), `p${idx}`)}</p>);
  });
  flush();
  return <div className="prose-fit text-sm text-snow/90">{blocks}</div>;
}
