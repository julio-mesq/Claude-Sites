import "server-only";
import type { Exercise, Goal, ExperienceLevel, MuscleGroup, TrainingLocation } from "@prisma/client";
import { db } from "../db";

/**
 * Gerador de plano inicial baseado em regras (não é IA): divide a semana conforme a frequência,
 * escolhe exercícios compatíveis com o equipamento disponível e ajusta volume ao objetivo/nível.
 */
type Split = { name: string; focus: MuscleGroup; groups: MuscleGroup[] }[];

function splitFor(days: number, goal: Goal): Split {
  if (goal === "MOBILITY") return [{ name: "Mobilidade e Core", focus: "MOBILITY", groups: ["MOBILITY", "MOBILITY", "ABS", "GLUTES", "MOBILITY"] }];
  if (goal === "CONDITIONING" && days <= 3)
    return [
      { name: "Condicionamento Total", focus: "CARDIO", groups: ["CARDIO", "LEGS", "CHEST", "BACK", "ABS"] },
      { name: "Cardio e Core", focus: "CARDIO", groups: ["CARDIO", "CARDIO", "ABS", "GLUTES", "MOBILITY"] },
    ];
  if (days <= 2) return [{ name: "Corpo Inteiro", focus: "LEGS", groups: ["LEGS", "CHEST", "BACK", "SHOULDERS", "ABS"] }];
  if (days === 3)
    return [
      { name: "Empurrar", focus: "CHEST", groups: ["CHEST", "CHEST", "SHOULDERS", "TRICEPS", "ABS"] },
      { name: "Puxar", focus: "BACK", groups: ["BACK", "BACK", "BICEPS", "SHOULDERS", "ABS"] },
      { name: "Pernas e Glúteos", focus: "LEGS", groups: ["LEGS", "LEGS", "GLUTES", "LEGS", "ABS"] },
    ];
  if (days === 4)
    return [
      { name: "Superiores A", focus: "CHEST", groups: ["CHEST", "BACK", "SHOULDERS", "BICEPS", "TRICEPS"] },
      { name: "Inferiores A", focus: "LEGS", groups: ["LEGS", "LEGS", "GLUTES", "ABS", "LEGS"] },
      { name: "Superiores B", focus: "BACK", groups: ["BACK", "CHEST", "SHOULDERS", "TRICEPS", "BICEPS"] },
      { name: "Inferiores B", focus: "GLUTES", groups: ["GLUTES", "LEGS", "LEGS", "ABS", "CARDIO"] },
    ];
  return [
    { name: "Peito e Tríceps", focus: "CHEST", groups: ["CHEST", "CHEST", "CHEST", "TRICEPS", "TRICEPS"] },
    { name: "Costas e Bíceps", focus: "BACK", groups: ["BACK", "BACK", "BACK", "BICEPS", "BICEPS"] },
    { name: "Pernas", focus: "LEGS", groups: ["LEGS", "LEGS", "LEGS", "GLUTES", "ABS"] },
    { name: "Ombros e Core", focus: "SHOULDERS", groups: ["SHOULDERS", "SHOULDERS", "SHOULDERS", "ABS", "ABS"] },
    { name: "Glúteos e Cardio", focus: "GLUTES", groups: ["GLUTES", "GLUTES", "LEGS", "CARDIO", "MOBILITY"] },
  ];
}

const EQUIPMENT_MAP: Record<string, string[]> = {
  Halteres: ["Halteres"],
  Barra: ["Barra"],
  Anilhas: ["Anilhas"],
  Banco: ["Banco"],
  Máquinas: ["Máquina"],
  "Polia/Cabo": ["Polia"],
  Kettlebell: ["Kettlebell"],
  Elásticos: ["Elástico"],
  "Barra fixa": ["Barra fixa"],
  Esteira: ["Esteira"],
  Bicicleta: ["Bicicleta"],
  Corda: ["Corda"],
};

export function availableEquipment(location: TrainingLocation | null, equipment: string[]) {
  const set = new Set<string>(["Peso corporal"]);
  if (location === "GYM" || location === "MIXED") ["Halteres", "Barra", "Anilhas", "Banco", "Máquina", "Polia", "Barra fixa", "Esteira", "Bicicleta", "Kettlebell", "Corda", "Elástico"].forEach((e) => set.add(e));
  for (const e of equipment) (EQUIPMENT_MAP[e] ?? []).forEach((x) => set.add(x));
  return set;
}

function compatible(ex: Pick<Exercise, "equipment">, avail: Set<string>) {
  return ex.equipment.split(/\s*\+\s*/).every((part) => avail.has(part));
}

export function volumeFor(goal: Goal, level: ExperienceLevel) {
  const base =
    goal === "STRENGTH" ? { sets: 5, reps: "4-6", restSec: 150 } :
    goal === "GAIN_MUSCLE" ? { sets: 4, reps: "8-12", restSec: 90 } :
    goal === "LOSE_FAT" || goal === "CONDITIONING" ? { sets: 3, reps: "12-15", restSec: 45 } :
    goal === "MOBILITY" ? { sets: 2, reps: "30s", restSec: 30 } :
    { sets: 3, reps: "10-12", restSec: 60 };
  if (level === "BEGINNER") return { ...base, sets: Math.max(2, base.sets - 1) };
  return base;
}

export async function generateStarterPlan(userId: string) {
  const profile = await db.profile.findUniqueOrThrow({ where: { userId } });
  const goal = profile.goal ?? "HEALTH";
  const level = profile.experience ?? "BEGINNER";
  const days = profile.trainingDaysPerWeek ?? 3;
  const avail = availableEquipment(profile.location, profile.equipment);
  const difficulties = level === "BEGINNER" ? ["BEGINNER"] : level === "INTERMEDIATE" ? ["BEGINNER", "INTERMEDIATE"] : ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
  const library = (await db.exercise.findMany({ where: { isPublished: true, authorId: null } })).filter(
    (e) => compatible(e, avail) && difficulties.includes(e.difficulty),
  );
  const vol = volumeFor(goal, level);
  const minutes = profile.sessionMinutes ?? 45;
  const perSession = Math.max(3, Math.min(8, Math.round(minutes / 9)));

  const created: string[] = [];
  for (const day of splitFor(days, goal)) {
    const used = new Set<string>();
    const items: { exerciseId: string; sets: number; reps: string; restSec: number }[] = [];
    const groups = [...day.groups];
    while (groups.length < perSession) groups.push(day.groups[groups.length % day.groups.length]!);
    for (const g of groups.slice(0, perSession)) {
      const options = library.filter((e) => (e.muscleGroup === g || e.secondaryMuscles.includes(g)) && !used.has(e.id));
      const pick = options.find((e) => e.muscleGroup === g) ?? options[0];
      if (!pick) continue;
      used.add(pick.id);
      const isTimed = pick.isCardio || g === "MOBILITY";
      items.push({
        exerciseId: pick.id,
        sets: isTimed ? Math.min(vol.sets, 3) : vol.sets,
        reps: isTimed ? pick.defaultReps : vol.reps,
        restSec: isTimed ? 30 : vol.restSec,
      });
    }
    if (items.length === 0) continue;
    const w = await db.workout.create({
      data: {
        userId,
        name: day.name,
        focus: day.focus,
        description: "Treino inicial gerado a partir do seu onboarding. Ajuste livremente.",
        estimatedMinutes: minutes,
        exercises: { create: items.map((it, i) => ({ ...it, position: i })) },
      },
    });
    created.push(w.id);
  }
  return created;
}

/** Gerador de treino rápido (funcionalidade extra): monta uma sessão para o tempo e foco escolhidos. */
export async function quickWorkout(userId: string, input: { minutes: number; focus: MuscleGroup | "FULL"; equipment: "available" | "bodyweight" }) {
  const profile = await db.profile.findUnique({ where: { userId } });
  const avail = input.equipment === "bodyweight" ? new Set(["Peso corporal"]) : availableEquipment(profile?.location ?? null, profile?.equipment ?? []);
  const level = profile?.experience ?? "BEGINNER";
  const goal = profile?.goal ?? "HEALTH";
  const library = (await db.exercise.findMany({ where: { isPublished: true, authorId: null } })).filter((e) => compatible(e, avail) && (level !== "BEGINNER" || e.difficulty !== "ADVANCED"));
  const groups: MuscleGroup[] =
    input.focus === "FULL" ? ["LEGS", "CHEST", "BACK", "SHOULDERS", "GLUTES", "ABS", "CARDIO", "BICEPS", "TRICEPS"] : [input.focus, input.focus, input.focus, "ABS", input.focus];
  const count = Math.max(3, Math.min(8, Math.round(input.minutes / 7)));
  const vol = volumeFor(goal, level);
  const used = new Set<string>();
  const items = [];
  for (let i = 0; items.length < count && i < count * 3; i++) {
    const g = groups[i % groups.length]!;
    const options = library.filter((e) => e.muscleGroup === g && !used.has(e.id));
    const pick = options[Math.floor(Math.random() * options.length)];
    if (!pick) continue;
    used.add(pick.id);
    items.push({ exerciseId: pick.id, name: pick.name, muscleGroup: pick.muscleGroup, sets: pick.isCardio ? 1 : Math.min(vol.sets, input.minutes <= 20 ? 2 : 4), reps: pick.isCardio || g === "MOBILITY" ? pick.defaultReps : vol.reps, restSec: pick.isCardio ? 0 : Math.min(vol.restSec, input.minutes <= 20 ? 45 : vol.restSec) });
  }
  if (items.length === 0) throw new Error("Nenhum exercício compatível encontrado.");
  return { name: `Treino rápido · ${input.minutes} min`, estimatedMinutes: input.minutes, items };
}
