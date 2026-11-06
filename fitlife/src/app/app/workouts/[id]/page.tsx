import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Pencil } from "lucide-react";
import { requireUser } from "@/server/auth/guard";
import { db } from "@/server/db";
import { getWorkout } from "@/server/services/workouts";
import { Badge, Card, PageHeader } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { MuscleFigure } from "@/components/fitness/muscle-figure";
import { StartWorkoutButton } from "@/components/app/start-workout-button";
import { MUSCLE_LABEL } from "@/lib/labels";
import { formatDate, formatDuration } from "@/lib/utils";

export const metadata: Metadata = { title: "Treino" };

export default async function WorkoutDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const w = await getWorkout(user.id, id).catch(() => null);
  if (!w) notFound();
  const sessions = await db.workoutSession.findMany({ where: { userId: user.id, workoutId: w.id, status: "COMPLETED" }, orderBy: { startedAt: "desc" }, take: 5 });
  const groups = [...new Set(w.exercises.map((e) => e.exercise.muscleGroup))];
  const totalSets = w.exercises.reduce((a, e) => a + e.sets, 0);
  return (
    <div>
      <PageHeader
        eyebrow="Treino"
        title={w.name}
        subtitle={w.description ?? undefined}
        action={
          <>
            <Link href={`/app/workouts/${w.id}/edit`} className={buttonClass("secondary")}>
              <Pencil className="h-4 w-4" /> Editar
            </Link>
            <StartWorkoutButton workoutId={w.id} />
          </>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card className="divide-y divide-white/5">
          {w.exercises.map((e, i) => (
            <Link key={e.id} href={`/app/workouts/exercises/${e.exercise.slug}`} className="flex items-center gap-4 p-4 hover:bg-white/[0.02]">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-neon/10 text-sm font-bold text-neon">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{e.exercise.name}</div>
                <div className="text-xs text-mist">
                  {MUSCLE_LABEL[e.exercise.muscleGroup]} · {e.exercise.equipment}
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="font-semibold">
                  {e.sets} × {e.reps}
                </div>
                <div className="text-xs text-mist">
                  {e.loadKg ? `${e.loadKg} kg · ` : ""}
                  {e.restSec}s descanso
                </div>
              </div>
            </Link>
          ))}
        </Card>
        <div className="space-y-4">
          <Card className="p-5">
            <MuscleFigure intensity={Object.fromEntries(groups.map((g) => [g, 0.9]))} />
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="neon">
                <Clock className="h-3 w-3" /> {w.estimatedMinutes} min
              </Badge>
              <Badge>{w.exercises.length} exercícios</Badge>
              <Badge>{totalSets} séries</Badge>
            </div>
            <p className="mt-3 text-sm text-mist">{groups.map((g) => MUSCLE_LABEL[g]).join(" · ")}</p>
          </Card>
          <Card className="p-5">
            <h3 className="text-sm font-semibold">Últimas execuções</h3>
            {sessions.length === 0 ? (
              <p className="mt-2 text-sm text-mist">Ainda não executado.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {sessions.map((s) => (
                  <li key={s.id}>
                    <Link href={`/app/workouts/session/${s.id}`} className="flex justify-between text-mist hover:text-snow">
                      <span>{formatDate(s.startedAt, { day: "2-digit", month: "short" })}</span>
                      <span>{formatDuration(s.durationSec ?? 0)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
