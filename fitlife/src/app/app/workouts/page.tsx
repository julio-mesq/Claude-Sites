import type { Metadata } from "next";
import { requireUser } from "@/server/auth/guard";
import { listExercises, listHistory, listRecords, listWorkouts } from "@/server/services/workouts";
import { WorkoutsHub } from "./workouts-hub";

export const metadata: Metadata = { title: "Treinos" };

export default async function WorkoutsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUser();
  const [workouts, history, records, exercises, sp] = await Promise.all([listWorkouts(user.id), listHistory(user.id, { take: 30 }), listRecords(user.id), listExercises(user.id, {}), searchParams]);
  return (
    <WorkoutsHub
      initialTab={(["mine", "library", "history", "records"].includes(sp.tab ?? "") ? sp.tab : "mine") as "mine"}
      workouts={workouts.map((w) => ({ id: w.id, name: w.name, description: w.description, focus: w.focus, isTemplate: w.isTemplate, minutes: w.estimatedMinutes, exercises: w.exercises.map((e) => ({ name: e.exercise.name, group: e.exercise.muscleGroup, sets: e.sets, reps: e.reps })) }))}
      history={history.items.map((h) => ({ id: h.id, name: h.name, status: h.status, startedAt: h.startedAt.toISOString(), durationSec: h.durationSec, volume: h.totalVolumeKg, sets: h._count.sets, xp: h.xpAwarded, cardioKm: h.cardioKm }))}
      records={records.map((r) => ({ id: r.id, exercise: r.exercise.name, slug: r.exercise.slug, group: r.exercise.muscleGroup, loadKg: r.loadKg, reps: r.reps, e1rm: r.estimated1Rm, date: r.achievedAt.toISOString() }))}
      exercises={exercises.map((e) => ({ id: e.id, slug: e.slug, name: e.name, group: e.muscleGroup, secondary: e.secondaryMuscles, equipment: e.equipment, difficulty: e.difficulty }))}
    />
  );
}
