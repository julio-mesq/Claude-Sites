import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Dumbbell, Lock, Route, Timer, Trophy } from "lucide-react";
import { requireUser } from "@/server/auth/guard";
import { PLAN_LIMITS } from "@/server/permissions";
import { getPlan } from "@/server/services/billing";
import { advancedReport } from "@/server/services/insights";
import { Card, CardHeader, EmptyState, PageHeader } from "@/components/ui/card";
import { Stat } from "@/components/ui/misc";
import { buttonClass } from "@/components/ui/button";
import { Bars } from "@/components/charts/charts";
import { MuscleFigure } from "@/components/fitness/muscle-figure";
import { MUSCLE_LABEL } from "@/lib/labels";
import { formatDate, formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Relatórios" };

export default async function ReportsPage() {
  const user = await requireUser();
  const plan = await getPlan(user.id);
  if (!PLAN_LIMITS[plan].advancedReports)
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader eyebrow="Relatórios" title="Relatórios avançados" />
        <Card>
          <EmptyState icon={<Lock className="h-6 w-6" />} title="Disponível no FitLife Pro" description="Volume semanal, esforço percebido, ranking de recordes e equilíbrio muscular dos últimos 90 dias." action={<Link href="/app/settings/billing" className={buttonClass("primary", "sm")}>Conhecer os planos</Link>} />
        </Card>
      </div>
    );
  const r = await advancedReport(user.id);
  return (
    <div>
      <PageHeader eyebrow="Relatórios · 90 dias" title="Relatórios avançados" subtitle="Baseado exclusivamente nas suas sessões registradas." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Sessões" value={r.totals.sessions} icon={<Dumbbell className="h-4 w-4" />} />
        <Stat label="Tempo total" value={formatNumber(r.totals.minutes)} unit="min" icon={<Timer className="h-4 w-4" />} tone="info" />
        <Stat label="Volume total" value={formatNumber(r.totals.volumeKg)} unit="kg" icon={<BarChart3 className="h-4 w-4" />} tone="violet" />
        <Stat label="Cardio" value={formatNumber(r.totals.cardioKm, 1)} unit="km" icon={<Route className="h-4 w-4" />} tone="warning" />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Volume por semana" subtitle="kg levantados (carga × repetições)" />
          <div className="p-4">{r.weeks.length ? <Bars data={r.weeks} xKey="week" yKey="volume" label="Volume" unit="kg" xFormat="day-month" /> : <EmptyState title="Sem sessões no período" />}</div>
        </Card>
        <Card>
          <CardHeader title="Minutos por semana" />
          <div className="p-4">{r.weeks.length ? <Bars data={r.weeks} xKey="week" yKey="minutes" label="Minutos" unit="min" xFormat="day-month" /> : <EmptyState title="Sem sessões no período" />}</div>
        </Card>
        <Card>
          <CardHeader title="Top recordes (1RM estimado)" icon={<Trophy className="h-4 w-4" />} />
          <div className="p-2">
            {r.records.length === 0 ? <EmptyState title="Sem recordes ainda" /> : (
              <ol className="divide-y divide-white/5">
                {r.records.map((x, i) => (
                  <li key={x.exercise} className="flex items-center justify-between px-3 py-2.5 text-sm">
                    <span><span className="mr-2 text-mist-700">{i + 1}.</span>{x.exercise}</span>
                    <span className="text-right"><span className="font-semibold text-neon">{formatNumber(x.e1rm, 1)} kg</span> <span className="text-xs text-mist">({x.loadKg}×{x.reps} · {formatDate(x.date)})</span></span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Equilíbrio muscular (90 dias)" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <MuscleFigure intensity={Object.fromEntries(r.balance.data.map((d) => [d.group, d.intensity]))} />
            <ul className="space-y-1.5 text-sm">
              {r.balance.data.map((d) => <li key={d.group} className="flex justify-between"><span className="text-mist">{MUSCLE_LABEL[d.group]}</span><span className="tabular-nums">{d.sets} séries</span></li>)}
            </ul>
          </div>
        </Card>
      </div>
      {r.weeks.some((w) => w.avgEffort) && (
        <Card className="mt-5 p-5">
          <h3 className="text-sm font-semibold">Esforço percebido médio por semana</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {r.weeks.map((w) => <span key={w.week} className="rounded-lg border border-white/8 px-2.5 py-1 text-xs">{formatDate(w.week, { day: "2-digit", month: "2-digit" })}: <span className="font-semibold">{w.avgEffort ?? "—"}</span>/10</span>)}
          </div>
        </Card>
      )}
    </div>
  );
}
