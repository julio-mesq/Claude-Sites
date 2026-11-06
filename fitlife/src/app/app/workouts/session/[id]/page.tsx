import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth/guard";
import { getSession, listExercises } from "@/server/services/workouts";
import { Player } from "./player";
import { Summary } from "./summary";

export const metadata: Metadata = { title: "Treino" };
export const dynamic = "force-dynamic";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const s = await getSession(user.id, id).catch(() => null);
  if (!s) notFound();
  const sets = s.sets.map((x) => ({ id: x.id, exerciseId: x.exerciseId, exerciseName: x.exercise.name, group: x.exercise.muscleGroup, setNumber: x.setNumber, reps: x.reps, loadKg: x.loadKg, durationSec: x.durationSec, distanceKm: x.distanceKm }));
  if (s.status !== "IN_PROGRESS") {
    return <Summary session={{ id: s.id, name: s.name, status: s.status, startedAt: s.startedAt.toISOString(), durationSec: s.durationSec ?? 0, volume: s.totalVolumeKg, cardioKm: s.cardioKm, effort: s.perceivedEffort, notes: s.notes, xp: s.xpAwarded, workoutId: s.workoutId }} sets={sets} />;
  }
  const library = s.workout ? [] : await listExercises(user.id, {});
  return (
    <Player
      session={{ id: s.id, name: s.name, startedAt: s.startedAt.toISOString() }}
      plan={(s.workout?.exercises ?? []).map((e) => ({ exerciseId: e.exerciseId, name: e.exercise.name, slug: e.exercise.slug, group: e.exercise.muscleGroup, isCardio: e.exercise.isCardio, sets: e.sets, reps: e.reps, loadKg: e.loadKg, restSec: e.restSec, cautions: e.exercise.cautions.slice(0, 2) }))}
      library={library.map((e) => ({ exerciseId: e.id, name: e.name, slug: e.slug, group: e.muscleGroup, isCardio: e.isCardio, sets: e.defaultSets, reps: e.defaultReps, loadKg: null, restSec: e.defaultRestSec, cautions: e.cautions.slice(0, 2) }))}
      initialSets={sets}
    />
  );
}
