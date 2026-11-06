import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, Droplets, Dumbbell, ListChecks, Salad } from "lucide-react";
import { requireUser } from "@/server/auth/guard";
import { pulse, weeklyReview } from "@/server/services/insights";
import { Card, CardHeader, PageHeader } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import { PulseOrb } from "@/components/charts/pulse-orb";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "FitLife Pulse" };

const ICONS = { training: Dumbbell, consistency: CalendarCheck, habits: ListChecks, nutrition: Salad, hydration: Droplets } as const;
const LINKS = { training: "/app/workouts", consistency: "/app/calendar", habits: "/app/habits", nutrition: "/app/nutrition", hydration: "/app/nutrition" } as const;

export default async function PulsePage() {
  const user = await requireUser();
  const [p, review] = await Promise.all([pulse(user.id), weeklyReview(user.id)]);
  return (
    <div>
      <PageHeader eyebrow="Centro de inteligência" title="FitLife Pulse" subtitle="Uma visão consolidada da sua consistência — calculada a partir dos seus registros." />
      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <Card className="relative flex flex-col items-center overflow-hidden p-6 text-center">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-neon/10 to-transparent" />
          <PulseOrb score={p.score} label={p.label} size={260} hasData={p.hasData} />
          <p className="mt-4 text-sm text-mist">{p.focus}</p>
          <div className="mt-6 w-full">
            <div className="mb-2 flex justify-between text-xs text-mist">
              <span>Últimos 14 dias</span>
              <span>Sequência: {p.streak} dia(s)</span>
            </div>
            <div className="flex gap-1">
              {p.last14.map((d) => (
                <div key={d.date} title={formatDate(d.date)} className={cn("h-8 flex-1 rounded-md", d.active ? "bg-neon" : "bg-white/6")} />
              ))}
            </div>
          </div>
          <p className="mt-6 text-[11px] text-mist-700">O Pulse mede a regularidade dos seus registros. Não é diagnóstico nem indicador de saúde ou aptidão física.</p>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Composição do índice" subtitle="Peso de cada componente na pontuação" />
            <div className="space-y-5 p-5">
              {p.parts.map((part) => {
                const Icon = ICONS[part.key as keyof typeof ICONS];
                return (
                  <Link key={part.key} href={LINKS[part.key as keyof typeof LINKS]} className="block rounded-xl p-2 transition-colors hover:bg-white/[0.02]">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-neon/10 text-neon">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="text-sm font-medium">{part.label}</div>
                          <div className="text-xs text-mist">{part.detail}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display font-bold">{part.pct}%</div>
                        <div className="text-[10px] text-mist-700">peso {part.weight}%</div>
                      </div>
                    </div>
                    <ProgressBar value={part.pct} label={part.label} />
                  </Link>
                );
              })}
            </div>
          </Card>
          <Card>
            <CardHeader title="Esta semana x semana passada" />
            <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
              {[
                ["Treinos", review.current.workouts, review.previous.workouts],
                ["Minutos", review.current.minutes, review.previous.minutes],
                ["Alimentos registrados", review.current.mealsLogged, review.previous.mealsLogged],
                ["Água (L)", review.current.waterL, review.previous.waterL],
              ].map(([l, c, prev]) => (
                <div key={l as string} className="rounded-xl border border-white/5 bg-ink-900/60 p-3">
                  <div className="text-[11px] text-mist">{l}</div>
                  <div className="font-display text-xl font-bold">{String(c).replace(".", ",")}</div>
                  <div className={cn("text-[11px]", Number(c) >= Number(prev) ? "text-neon" : "text-mist")}>antes: {String(prev).replace(".", ",")}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
