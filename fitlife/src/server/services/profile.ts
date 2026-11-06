import "server-only";
import type { z } from "zod";
import { db } from "../db";
import { Errors } from "../errors";
import { audit } from "../audit";
import type { onboardingSchema, preferencesSchema, profileUpdateSchema } from "@/lib/validations/profile";
import { ageFrom, estimateTargets, waterTargetMl } from "@/lib/fitness-math";
import { addDaysKey, dateKey, keyToDate, zonedStartOfDay } from "@/lib/utils";
import { generateStarterPlan } from "./planner";
import { addMilestone } from "./gamification";
import { notify } from "./notifications";

const DEFAULT_HABITS: Record<string, { name: string; icon: string; color: string }[]> = {
  base: [
    { name: "Beber água", icon: "droplets", color: "#3BC8FF" },
    { name: "Dormir 7h+", icon: "moon", color: "#9B8CFF" },
  ],
  GAIN_MUSCLE: [{ name: "Bater a meta de proteína", icon: "beef", color: "#B6FF3B" }],
  LOSE_FAT: [{ name: "Caminhar 30 min", icon: "footprints", color: "#77D63B" }],
  CONDITIONING: [{ name: "Caminhar 30 min", icon: "footprints", color: "#77D63B" }],
  STRENGTH: [{ name: "Alongar 10 min", icon: "stretch", color: "#FFB83B" }],
  HEALTH: [{ name: "Comer frutas e vegetais", icon: "apple", color: "#77D63B" }],
  MAINTAIN: [{ name: "Seguir a rotina alimentar", icon: "salad", color: "#77D63B" }],
  MOBILITY: [{ name: "Alongar 10 min", icon: "stretch", color: "#FFB83B" }],
};

export async function completeOnboarding(userId: string, data: z.infer<typeof onboardingSchema>) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const alreadyOnboarded = !!user.onboardedAt;
  const targets = estimateTargets({
    sex: data.sex,
    weightKg: data.weightKg,
    heightCm: data.heightCm,
    age: ageFrom(data.birthDate),
    trainingDaysPerWeek: data.trainingDaysPerWeek,
    goal: data.goal,
  });
  const today = dateKey();

  await db.$transaction(async (tx) => {
    await tx.profile.upsert({
      where: { userId },
      create: { userId, ...data, healthNotes: data.healthNotes ?? null },
      update: { ...data, healthNotes: data.healthNotes ?? null },
    });
    await tx.userPreference.upsert({
      where: { userId },
      create: { userId, weeklyWorkoutTarget: data.trainingDaysPerWeek, dailyWaterMl: waterTargetMl(data.weightKg) },
      update: { weeklyWorkoutTarget: data.trainingDaysPerWeek, dailyWaterMl: waterTargetMl(data.weightKg) },
    });
    await tx.nutritionLog.upsert({
      where: { userId_date: { userId, date: keyToDate(today) } },
      create: { userId, date: keyToDate(today), calorieTarget: targets.calorieTarget, proteinTarget: targets.proteinTarget, carbsTarget: targets.carbsTarget, fatTarget: targets.fatTarget, notes: "Estimativa automática (Mifflin-St Jeor)." },
      update: { calorieTarget: targets.calorieTarget, proteinTarget: targets.proteinTarget, carbsTarget: targets.carbsTarget, fatTarget: targets.fatTarget },
    });
    await tx.user.update({ where: { id: userId }, data: { onboardedAt: user.onboardedAt ?? new Date() } });
  });

  if (!alreadyOnboarded) {
    await db.bodyMeasurement.create({ data: { userId, measuredAt: new Date(), weightKg: data.weightKg, heightCm: data.heightCm, notes: "Medida inicial (onboarding)." } });
    const habits = [...DEFAULT_HABITS.base!, ...(DEFAULT_HABITS[data.goal] ?? [])];
    await db.habit.createMany({ data: habits.map((h) => ({ userId, ...h })) });
    const workoutIds = await generateStarterPlan(userId);
    // Agenda os treinos da próxima semana distribuídos pelos dias disponíveis.
    const spacing = Math.max(1, Math.floor(7 / data.trainingDaysPerWeek));
    for (let i = 0; i < data.trainingDaysPerWeek && workoutIds.length > 0; i++) {
      const key = addDaysKey(today, 1 + i * spacing);
      const workoutId = workoutIds[i % workoutIds.length]!;
      const w = await db.workout.findUnique({ where: { id: workoutId }, select: { name: true } });
      const startsAt = new Date(zonedStartOfDay(key).getTime() + 18 * 3600_000);
      await db.calendarEvent.create({ data: { userId, title: w?.name ?? "Treino", type: "WORKOUT", workoutId, startsAt, remindAt: new Date(startsAt.getTime() - 60 * 60_000) } });
    }
    await addMilestone(userId, "MEASUREMENT", "Início da jornada", `Ponto de partida registrado: ${data.weightKg} kg.`, "journey:start", { weightKg: data.weightKg });
    await notify(userId, {
      type: "welcome",
      title: "Seu plano inicial está pronto",
      body: `Criamos ${workoutIds.length} treino(s), hábitos e metas nutricionais estimadas com base no seu perfil.`,
      href: "/app/workouts",
    });
    if (data.hasHealthConditions) {
      await notify(userId, {
        type: "health",
        title: "Recomendamos avaliação profissional",
        body: "Você indicou condições de saúde. Antes de iniciar ou intensificar treinos, consulte um médico e um profissional de educação física.",
      });
    }
  }
  await audit("profile.onboarding_completed", { actorId: userId });
  return { targets };
}

export async function getProfileBundle(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, xp: true, level: true, createdAt: true, emailVerifiedAt: true, onboardedAt: true, profile: true, preferences: true, subscription: true },
  });
  if (!user) throw Errors.notFound("Usuário");
  return user;
}

export async function updateProfile(userId: string, data: z.infer<typeof profileUpdateSchema>) {
  const { name, ...profile } = data;
  if (profile.username) {
    const taken = await db.profile.findFirst({ where: { username: profile.username, NOT: { userId } }, select: { userId: true } });
    if (taken) throw Errors.conflict("Este nome de usuário já está em uso.");
  }
  await db.$transaction([
    ...(name ? [db.user.update({ where: { id: userId }, data: { name } })] : []),
    db.profile.update({ where: { userId }, data: profile }),
  ]);
  await audit("profile.updated", { actorId: userId });
}

export async function updatePreferences(userId: string, data: z.infer<typeof preferencesSchema>) {
  await db.userPreference.upsert({ where: { userId }, create: { userId, ...data }, update: data });
  await audit("preferences.updated", { actorId: userId, meta: data });
}

/** Recalcula metas nutricionais estimadas a partir do perfil atual. */
export async function recalculateTargets(userId: string) {
  const p = await db.profile.findUniqueOrThrow({ where: { userId } });
  if (!p.birthDate || !p.weightKg || !p.heightCm || !p.goal) throw Errors.badRequest("Complete seu perfil (idade, peso, altura e objetivo).");
  const latest = await db.bodyMeasurement.findFirst({ where: { userId, weightKg: { not: null } }, orderBy: { measuredAt: "desc" } });
  const t = estimateTargets({ sex: p.sex, weightKg: latest?.weightKg ?? p.weightKg, heightCm: p.heightCm, age: ageFrom(p.birthDate), trainingDaysPerWeek: p.trainingDaysPerWeek ?? 3, goal: p.goal });
  const date = keyToDate(dateKey());
  await db.nutritionLog.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, calorieTarget: t.calorieTarget, proteinTarget: t.proteinTarget, carbsTarget: t.carbsTarget, fatTarget: t.fatTarget, notes: "Estimativa automática (Mifflin-St Jeor)." },
    update: { calorieTarget: t.calorieTarget, proteinTarget: t.proteinTarget, carbsTarget: t.carbsTarget, fatTarget: t.fatTarget, notes: "Estimativa automática (Mifflin-St Jeor)." },
  });
  return t;
}
