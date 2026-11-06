import type { Metadata } from "next";
import { requireUser } from "@/server/auth/guard";
import { listExercises } from "@/server/services/workouts";
import { WorkoutBuilder } from "../builder";

export const metadata: Metadata = { title: "Novo treino" };

export default async function NewWorkoutPage() {
  const user = await requireUser();
  const ex = await listExercises(user.id, {});
  return <WorkoutBuilder exercises={ex.map((e) => ({ id: e.id, name: e.name, group: e.muscleGroup, equipment: e.equipment, defaultSets: e.defaultSets, defaultReps: e.defaultReps, defaultRestSec: e.defaultRestSec }))} />;
}
