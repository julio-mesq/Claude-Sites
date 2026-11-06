import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth/guard";
import { getWorkout, listExercises } from "@/server/services/workouts";
import { WorkoutBuilder } from "../../builder";

export const metadata: Metadata = { title: "Editar treino" };

export default async function EditWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [w, ex] = await Promise.all([getWorkout(user.id, id).catch(() => null), listExercises(user.id, {})]);
  if (!w) notFound();
  return (
    <WorkoutBuilder
      exercises={ex.map((e) => ({ id: e.id, name: e.name, group: e.muscleGroup, equipment: e.equipment, defaultSets: e.defaultSets, defaultReps: e.defaultReps, defaultRestSec: e.defaultRestSec }))}
      initial={{ id: w.id, name: w.name, description: w.description ?? "", focus: w.focus ?? "", isTemplate: w.isTemplate, estimatedMinutes: w.estimatedMinutes, items: w.exercises.map((e) => ({ exerciseId: e.exerciseId, name: e.exercise.name, group: e.exercise.muscleGroup, sets: e.sets, reps: e.reps, loadKg: e.loadKg != null ? String(e.loadKg) : "", restSec: e.restSec, notes: e.notes ?? "" })) }}
    />
  );
}
