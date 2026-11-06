import Link from "next/link";
import { Clock, Dumbbell, Flame, Route, Trophy } from "lucide-react";
import { Badge, Card, PageHeader } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { Stat } from "@/components/ui/misc";
import { MUSCLE_LABEL } from "@/lib/labels";
import { formatDate, formatDuration, formatNumber } from "@/lib/utils";

type S = { id: string; name: string; status: string; startedAt: string; durationSec: number; volume: number; cardioKm: number; effort: number | null; notes: string | null; xp: number; workoutId: string | null };
type Row = { id: string; exerciseId: string; exerciseName: string; group: string; setNumber: number; reps: number | null; loadKg: number | null; durationSec: number | null; distanceKm: number | null };

export function Summary({ session: s, sets }: { session: S; sets: Row[] }) {
  const byExercise = new Map<string, Row[]>();
  for (const r of sets) byExercise.set(r.exerciseId, [...(byExercise.get(r.exerciseId) ?? []), r]);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow={s.status === "COMPLETED" ? "Treino concluído" : "Treino interrompido"}
        title={s.name}
        subtitle={formatDate(new Date(s.startedAt), { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}
        action={
          <Link href="/app/workouts?tab=history" className={buttonClass("secondary")}>
            Ver histórico
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Duração" value={formatDuration(s.durationSec)} icon={<Clock className="h-4 w-4" />} />
        <Stat label="Volume" value={formatNumber(s.volume)} unit="kg" icon={<Dumbbell className="h-4 w-4" />} tone="info" />
        <Stat label="Séries" value={sets.length} icon={<Trophy className="h-4 w-4" />} tone="violet" />
        {s.cardioKm > 0 ? <Stat label="Distância" value={formatNumber(s.cardioKm, 1)} unit="km" icon={<Route className="h-4 w-4" />} tone="warning" /> : <Stat label="XP" value={`+${s.xp}`} icon={<Flame className="h-4 w-4" />} tone="warning" />}
      </div>
      {(s.effort || s.notes) && (
        <Card className="mt-4 p-5">
          {s.effort && <Badge tone="neon">Esforço percebido: {s.effort}/10</Badge>}
          {s.notes && <p className="mt-3 text-sm text-mist">{s.notes}</p>}
        </Card>
      )}
      <Card className="mt-4 divide-y divide-white/5">
        {[...byExercise.values()].map((rows) => (
          <div key={rows[0]!.exerciseId} className="p-5">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{rows[0]!.exerciseName}</div>
              <span className="text-xs text-mist">{MUSCLE_LABEL[rows[0]!.group]}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {rows.map((r) => (
                <span key={r.id} className="rounded-lg border border-white/8 bg-ink-900/60 px-2.5 py-1 text-xs tabular-nums">
                  {r.setNumber}. {r.loadKg != null ? `${formatNumber(r.loadKg, 1)} kg × ` : ""}
                  {r.reps ?? ""}
                  {r.durationSec ? ` ${Math.round(r.durationSec / 60)} min` : ""}
                  {r.distanceKm ? ` ${r.distanceKm} km` : ""}
                </span>
              ))}
            </div>
          </div>
        ))}
        {sets.length === 0 && <p className="p-5 text-sm text-mist">Nenhuma série registrada.</p>}
      </Card>
    </div>
  );
}
