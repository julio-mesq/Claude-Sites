"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDate } from "@/lib/utils";

// Tokens de gráfico. Paleta categórica validada (OKLCH, CVD e contraste) contra a superfície escura #101414.
export const SERIES = ["#64A21A", "#7C5CE6", "#2B93C9", "#D9548F"] as const;
export const BRAND = "#B6FF3B";
const GRID = "rgba(255,255,255,0.06)";
const AXIS = { fill: "#939B96", fontSize: 11 };

function TooltipBox({ active, payload, label, unit, labelFormat }: { active?: boolean; payload?: { name: string; value: number; color: string; dataKey: string }[]; label?: string; unit?: string; labelFormat?: (l: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-ink-800/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <div className="mb-1 text-mist">{labelFormat ? labelFormat(String(label)) : label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-snow">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-mist">{p.name}</span>
          <span className="ml-auto font-semibold tabular-nums">
            {typeof p.value === "number" ? p.value.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : p.value}
            {unit ? ` ${unit}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function SrTable({ caption, cols, rows }: { caption: string; cols: string[]; rows: (string | number | null)[][] }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>{r.map((v, j) => <td key={j}>{v ?? "—"}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

const day = (d: string) => formatDate(d, { day: "2-digit", month: "short" });

export function TrendArea({ data, unit, label, height = 220 }: { data: { date: string; value: number }[]; unit: string; label: string; height?: number }) {
  const values = data.map((d) => d.value);
  const min = Math.floor(Math.min(...values) - 1);
  const max = Math.ceil(Math.max(...values) + 1);
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BRAND} stopOpacity={0.28} />
              <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="date" tickFormatter={day} tick={AXIS} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis domain={[min, max]} tick={AXIS} axisLine={false} tickLine={false} width={48} />
          <Tooltip content={<TooltipBox unit={unit} labelFormat={day} />} cursor={{ stroke: "rgba(255,255,255,0.2)" }} />
          <Area type="monotone" dataKey="value" name={label} stroke={BRAND} strokeWidth={2} fill="url(#trendFill)" dot={data.length < 12 ? { r: 4, fill: BRAND, stroke: "#101414", strokeWidth: 2 } : false} activeDot={{ r: 5, stroke: "#101414", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
      <SrTable caption={label} cols={["Data", `${label} (${unit})`]} rows={data.map((d) => [d.date, d.value])} />
    </div>
  );
}

export function Bars({ data, xKey, yKey, label, unit, height = 200, xFormat, highlightLast }: { data: Record<string, string | number>[]; xKey: string; yKey: string; label: string; unit?: string; height?: number; xFormat?: "day-month"; highlightLast?: boolean }) {
  const fmt = xFormat === "day-month" ? (v: string) => formatDate(v, { day: "2-digit", month: "2-digit" }) : undefined;
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -24 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey={xKey} tick={AXIS} axisLine={false} tickLine={false} tickFormatter={fmt} interval="preserveStartEnd" />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} width={40} />
          <Tooltip content={<TooltipBox unit={unit} labelFormat={fmt} />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar
            dataKey={yKey}
            name={label}
            radius={[4, 4, 0, 0]}
            fill={BRAND}
            shape={(props: unknown) => {
              const p = props as { x: number; y: number; width: number; height: number; index: number };
              const last = highlightLast && p.index === data.length - 1;
              const r = Math.min(4, p.width / 2, p.height);
              if (p.height <= 0) return <g />;
              return <path d={`M${p.x},${p.y + p.height} V${p.y + r} Q${p.x},${p.y} ${p.x + r},${p.y} H${p.x + p.width - r} Q${p.x + p.width},${p.y} ${p.x + p.width},${p.y + r} V${p.y + p.height} Z`} fill={BRAND} fillOpacity={highlightLast ? (last ? 1 : 0.45) : 0.85} />;
            }}
          />
        </BarChart>
      </ResponsiveContainer>
      <SrTable caption={label} cols={[xKey, label]} rows={data.map((d) => [String(d[xKey]), d[yKey] as number])} />
    </div>
  );
}

export function MultiLine({ data, series, unit, height = 240, caption }: { data: Record<string, string | number | null>[]; series: { key: string; label: string }[]; unit: string; height?: number; caption: string }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="date" tickFormatter={day} tick={AXIS} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} width={48} domain={["auto", "auto"]} />
          <Tooltip content={<TooltipBox unit={unit} labelFormat={day} />} cursor={{ stroke: "rgba(255,255,255,0.2)" }} />
          {series.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#939B96", paddingTop: 8 }} />}
          {series.map((s, i) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={SERIES[i % SERIES.length]} strokeWidth={2} connectNulls dot={{ r: 4, strokeWidth: 2, stroke: "#101414", fill: SERIES[i % SERIES.length] }} activeDot={{ r: 5 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <SrTable caption={caption} cols={["Data", ...series.map((s) => `${s.label} (${unit})`)]} rows={data.map((d) => [String(d.date), ...series.map((s) => d[s.key] as number | null)])} />
    </div>
  );
}
