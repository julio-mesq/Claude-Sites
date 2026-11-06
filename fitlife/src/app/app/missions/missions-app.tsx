"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Clock, Droplets, Dumbbell, Flame, ListChecks, Repeat, Route, Salad, Target, Timer, XCircle } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { Segmented } from "@/components/ui/misc";
import { useConfirm } from "@/components/ui/confirm";
import { formatDate, formatNumber } from "@/lib/utils";

type Mission = { id: string; code: string; name: string; description: string; metric: string; targetValue: number; durationDays: number; xpReward: number; icon: string };
type Progress = { id: string; missionId: string; startedAt: string; endsAt: string; progress: number; status: string; completedAt: string | null; mission: Mission };

const ICONS: Record<string, typeof Target> = { dumbbell: Dumbbell, route: Route, "list-checks": ListChecks, salad: Salad, droplets: Droplets, timer: Timer, repeat: Repeat, flame: Flame, target: Target };
const UNIT: Record<string, string> = { WORKOUTS: "treinos", ROUTINE_COMPLETIONS: "treinos", WORKOUT_MINUTES: "min", CARDIO_KM: "km", MEALS_LOGGED: "alimentos", WATER_DAYS: "dias", HABIT_CHECKINS: "check-ins" };
const STATUS: Record<string, { label: string; tone: "neon" | "danger" | "neutral" | "warning" }> = { ACTIVE: { label: "Em andamento", tone: "warning" }, COMPLETED: { label: "Concluída", tone: "neon" }, FAILED: { label: "Não concluída", tone: "danger" }, ABANDONED: { label: "Abandonada", tone: "neutral" } };

export function MissionsApp({ data }: { data: { missions: Mission[]; progress: Progress[] } }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [tab, setTab] = useState<"active" | "available" | "history">(data.progress.some((p) => p.status === "ACTIVE") ? "active" : "available");
  const active = data.progress.filter((p) => p.status === "ACTIVE");
  const history = data.progress.filter((p) => p.status !== "ACTIVE");
  const activeIds = new Set(active.map((a) => a.missionId));

  async function join(m: Mission) {
    try {
      await api(`/missions/${m.id}/join`, { method: "POST" });
      toast.success(`Missão iniciada: ${m.name}`);
      setTab("active");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro.");
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Mission Mode" title="Missões" subtitle="Desafios com prazo e recompensa. O progresso é acompanhado automaticamente pelos seus registros." />
      <div className="mb-6 overflow-x-auto">
        <Segmented value={tab} onChange={setTab} options={[{ value: "active", label: `Ativas (${active.length})` }, { value: "available", label: "Disponíveis" }, { value: "history", label: "Histórico" }]} />
      </div>
      {tab === "active" &&
        (active.length === 0 ? (
          <Card><EmptyState icon={<Target className="h-6 w-6" />} title="Nenhuma missão ativa" description="Escolha uma missão para ter um objetivo de curto prazo." action={<Button size="sm" onClick={() => setTab("available")}>Ver missões</Button>} /></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {active.map((p) => {
              const Icon = ICONS[p.mission.icon] ?? Target;
              const daysLeft = Math.max(0, Math.ceil((new Date(p.endsAt).getTime() - Date.now()) / 86400_000));
              return (
                <Card key={p.id} className="relative overflow-hidden p-6">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-neon/10 blur-2xl" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/12 text-neon"><Icon className="h-6 w-6" /></span>
                      <div>
                        <div className="font-display text-lg font-bold">{p.mission.name}</div>
                        <div className="text-xs text-mist">{p.mission.description}</div>
                      </div>
                    </div>
                  </div>
                  <div className="relative mt-5">
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="tabular-nums">{formatNumber(p.progress, 1)} / {formatNumber(p.mission.targetValue, 1)} {UNIT[p.mission.metric]}</span>
                      <span className="text-mist">{Math.round(Math.min(100, (p.progress / p.mission.targetValue) * 100))}%</span>
                    </div>
                    <ProgressBar value={p.progress} max={p.mission.targetValue} label={p.mission.name} />
                  </div>
                  <div className="relative mt-4 flex flex-wrap items-center gap-2">
                    <Badge><Clock className="h-3 w-3" /> {daysLeft} dia(s) restantes</Badge>
                    <Badge tone="neon">+{p.mission.xpReward} XP</Badge>
                    <Button variant="ghost" size="sm" className="ml-auto" onClick={async () => { if (!(await confirm({ title: "Abandonar missão?", description: "O progresso será perdido.", confirmLabel: "Abandonar", danger: true }))) return; await api(`/missions/progress/${p.id}`, { method: "DELETE" }); router.refresh(); }}>Abandonar</Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ))}
      {tab === "available" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.missions.map((m) => {
            const Icon = ICONS[m.icon] ?? Target;
            const isActive = activeIds.has(m.id);
            return (
              <Card key={m.id} className="flex flex-col p-5">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-neon/10 text-neon"><Icon className="h-5 w-5" /></span>
                <div className="mt-4 font-semibold">{m.name}</div>
                <p className="mt-1 flex-1 text-sm text-mist">{m.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge>Objetivo: {formatNumber(m.targetValue)} {UNIT[m.metric]}</Badge>
                  <Badge>{m.durationDays} dias</Badge>
                  <Badge tone="neon">+{m.xpReward} XP</Badge>
                </div>
                <Button className="mt-4 w-full" variant={isActive ? "secondary" : "primary"} disabled={isActive} onClick={() => join(m)}>{isActive ? "Em andamento" : "Aceitar missão"}</Button>
              </Card>
            );
          })}
        </div>
      )}
      {tab === "history" &&
        (history.length === 0 ? (
          <Card><EmptyState title="Sem histórico de missões" /></Card>
        ) : (
          <Card className="divide-y divide-white/5">
            {history.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  {p.status === "COMPLETED" ? <CheckCircle2 className="h-5 w-5 text-neon" /> : <XCircle className="h-5 w-5 text-mist-700" />}
                  <div>
                    <div className="font-medium">{p.mission.name}</div>
                    <div className="text-xs text-mist">{formatDate(new Date(p.startedAt))} – {formatDate(new Date(p.endsAt))} · {formatNumber(p.progress, 1)}/{formatNumber(p.mission.targetValue, 1)} {UNIT[p.mission.metric]}</div>
                  </div>
                </div>
                <Badge tone={STATUS[p.status]!.tone}>{STATUS[p.status]!.label}</Badge>
              </div>
            ))}
          </Card>
        ))}
    </div>
  );
}
