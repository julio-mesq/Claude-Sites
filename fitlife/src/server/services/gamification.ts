import "server-only";
import type { JourneyKind, MissionMetric, Prisma } from "@prisma/client";
import { db } from "../db";
import { levelFromXp, streakFromKeys } from "@/lib/fitness-math";
import { addDaysKey, dateKey, keyToDate, zonedStartOfDay } from "@/lib/utils";
import { notify } from "./notifications";

export { ACHIEVEMENTS } from "@/lib/catalog";

/** Sessões abaixo deste tempo não contam para XP, conquistas e missões (anti-manipulação). */
export const MIN_VALID_SESSION_SEC = 300;

export const XP = {
  workoutBase: 50,
  workoutMaxBonus: 30,
  maxXpWorkoutsPerDay: 2,
  habitCheck: 5,
  mealDay: 10,
  waterGoal: 10,
  measurement: 15,
  recovery: 5,
} as const;

type Tx = Prisma.TransactionClient | typeof db;

/** Concede XP de forma idempotente. Retorna o XP efetivamente concedido. */
export async function awardXp(userId: string, amount: number, reason: string, sourceKey: string, client: Tx = db) {
  if (amount <= 0) return 0;
  // skipDuplicates torna a concessão idempotente sem gerar erro (sourceKey é único por usuário).
  const { count } = await client.xpEvent.createMany({ data: [{ userId, amount, reason, sourceKey }], skipDuplicates: true });
  if (count === 0) return 0;
  const user = await client.user.update({ where: { id: userId }, data: { xp: { increment: amount } }, select: { xp: true, level: true } });
  const newLevel = levelFromXp(user.xp);
  if (newLevel > user.level) {
    await client.user.update({ where: { id: userId }, data: { level: newLevel } });
    await addMilestone(userId, "LEVEL_UP", `Nível ${newLevel}`, `Você alcançou o nível ${newLevel}.`, `level:${newLevel}`, { level: newLevel }, client);
    await notify(userId, { type: "level", title: `Nível ${newLevel} alcançado!`, body: "Sua dedicação está rendendo resultados.", href: "/app/achievements" });
  }
  return amount;
}

export async function addMilestone(
  userId: string,
  kind: JourneyKind,
  title: string,
  description: string,
  sourceKey: string,
  data?: Prisma.InputJsonValue,
  client: Tx = db,
  occurredAt?: Date,
) {
  const { count } = await client.journeyMilestone.createMany({ data: [{ userId, kind, title, description, sourceKey, data, occurredAt }], skipDuplicates: true });
  return count === 1;
}

/** Dias (AAAA-MM-DD) com qualquer atividade registrada pelo usuário. */
export async function activityDayKeys(userId: string, sinceDays = 400) {
  const since = new Date(Date.now() - sinceDays * 86400_000);
  const rows = await db.$queryRaw<{ d: string }[]>`
    SELECT DISTINCT to_char(d, 'YYYY-MM-DD') AS d FROM (
      SELECT ("startedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date AS d FROM workout_sessions WHERE "userId" = ${userId} AND status = 'COMPLETED' AND "startedAt" >= ${since}
      UNION SELECT date AS d FROM habit_logs WHERE "userId" = ${userId} AND date >= ${since}::date
      UNION SELECT m.date AS d FROM meals m WHERE m."userId" = ${userId} AND m.date >= ${since}::date AND m."isCustomTemplate" = false AND EXISTS (SELECT 1 FROM meal_entries e WHERE e."mealId" = m.id)
      UNION SELECT date AS d FROM water_logs WHERE "userId" = ${userId} AND date >= ${since}::date
      UNION SELECT ("measuredAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date AS d FROM body_measurements WHERE "userId" = ${userId} AND "measuredAt" >= ${since}
    ) t`;
  return rows.map((r) => r.d);
}

async function grant(userId: string, code: string) {
  const ach = await db.achievement.findUnique({ where: { code } });
  if (!ach) return false;
  const { count } = await db.userAchievement.createMany({ data: [{ userId, achievementId: ach.id }], skipDuplicates: true });
  if (count === 0) return false;
  await awardXp(userId, ach.xpReward, `Conquista: ${ach.name}`, `achievement:${code}`);
  await addMilestone(userId, "ACHIEVEMENT", ach.name, ach.description, `achievement:${code}`, { code });
  await notify(userId, { type: "achievement", title: `Conquista desbloqueada: ${ach.name}`, body: ach.description, href: "/app/achievements" });
  return true;
}

/** Avalia todas as conquistas com base em dados reais do banco. Seguro para chamar repetidamente. */
export async function evaluateAchievements(userId: string) {
  const owned = new Set((await db.userAchievement.findMany({ where: { userId }, select: { achievement: { select: { code: true } } } })).map((a) => a.achievement.code));
  const need = (c: string) => !owned.has(c);
  const unlocked: string[] = [];
  const check = async (code: string, cond: () => Promise<boolean>) => {
    if (need(code) && (await cond()) && (await grant(userId, code))) unlocked.push(code);
  };

  const workouts = await db.workoutSession.count({ where: { userId, status: "COMPLETED", durationSec: { gte: MIN_VALID_SESSION_SEC } } });
  await check("FIRST_STEP", async () => workouts >= 1);
  await check("DISCIPLINE", async () => workouts >= 20);
  await check("CENTURION", async () => workouts >= 100);
  await check("CONSISTENCY", async () => streakFromKeys(await activityDayKeys(userId, 60), dateKey()) >= 7);
  await check("EVOLUTION", async () => (await db.userGoal.count({ where: { userId, status: "COMPLETED" } })) >= 1);
  await check("MARATHONER", async () => {
    const agg = await db.workoutSession.aggregate({ where: { userId, status: "COMPLETED" }, _sum: { cardioKm: true } });
    return (agg._sum.cardioKm ?? 0) >= 42.2;
  });
  await check("PR_HUNTER", async () => (await db.journeyMilestone.count({ where: { userId, kind: "PERSONAL_RECORD" } })) >= 1);
  await check("HYDRATED", async () => {
    const pref = await db.userPreference.findUnique({ where: { userId }, select: { dailyWaterMl: true } });
    const target = pref?.dailyWaterMl ?? 2500;
    const rows = await db.$queryRaw<{ n: bigint }[]>`
      SELECT COUNT(*) AS n FROM (SELECT date FROM water_logs WHERE "userId" = ${userId} GROUP BY date HAVING SUM("amountMl") >= ${target}) t`;
    return Number(rows[0]?.n ?? 0) >= 7;
  });
  await check("NUTRI_LOGGER", async () => {
    const rows = await db.$queryRaw<{ n: bigint }[]>`
      SELECT COUNT(DISTINCT m.date) AS n FROM meals m WHERE m."userId" = ${userId} AND m."isCustomTemplate" = false AND EXISTS (SELECT 1 FROM meal_entries e WHERE e."mealId" = m.id)`;
    return Number(rows[0]?.n ?? 0) >= 7;
  });
  await check("BODY_TRACKER", async () => (await db.bodyMeasurement.count({ where: { userId } })) >= 1);
  await check("MISSION_DONE", async () => (await db.missionProgress.count({ where: { userId, status: "COMPLETED" } })) >= 1);
  await check("HABIT_BUILDER", async () => {
    const habits = await db.habit.findMany({ where: { userId, frequency: "DAILY" }, select: { id: true, logs: { select: { date: true }, where: { date: { gte: keyToDate(addDaysKey(dateKey(), -60)) } } } } });
    return habits.some((h) => streakFromKeys(h.logs.map((l) => l.date.toISOString().slice(0, 10)), dateKey()) >= 21);
  });
  return unlocked;
}

// ───────────── Missões ─────────────

async function metricValue(userId: string, metric: MissionMetric, from: Date, to: Date): Promise<number> {
  const fromKey = dateKey(from);
  const toKey = dateKey(to);
  switch (metric) {
    case "WORKOUTS":
      return db.workoutSession.count({ where: { userId, status: "COMPLETED", durationSec: { gte: MIN_VALID_SESSION_SEC }, startedAt: { gte: from, lte: to } } });
    case "ROUTINE_COMPLETIONS":
      return db.workoutSession.count({ where: { userId, status: "COMPLETED", durationSec: { gte: MIN_VALID_SESSION_SEC }, workoutId: { not: null }, startedAt: { gte: from, lte: to } } });
    case "WORKOUT_MINUTES": {
      const agg = await db.workoutSession.aggregate({ where: { userId, status: "COMPLETED", startedAt: { gte: from, lte: to } }, _sum: { durationSec: true } });
      return Math.floor((agg._sum.durationSec ?? 0) / 60);
    }
    case "CARDIO_KM": {
      const agg = await db.workoutSession.aggregate({ where: { userId, status: "COMPLETED", startedAt: { gte: from, lte: to } }, _sum: { cardioKm: true } });
      return Math.round((agg._sum.cardioKm ?? 0) * 10) / 10;
    }
    case "MEALS_LOGGED":
      return db.mealEntry.count({ where: { meal: { userId, isCustomTemplate: false, date: { gte: keyToDate(fromKey), lte: keyToDate(toKey) } } } });
    case "WATER_DAYS": {
      const pref = await db.userPreference.findUnique({ where: { userId }, select: { dailyWaterMl: true } });
      const target = pref?.dailyWaterMl ?? 2500;
      const rows = await db.$queryRaw<{ n: bigint }[]>`
        SELECT COUNT(*) AS n FROM (SELECT date FROM water_logs WHERE "userId" = ${userId} AND date BETWEEN ${keyToDate(fromKey)}::date AND ${keyToDate(toKey)}::date GROUP BY date HAVING SUM("amountMl") >= ${target}) t`;
      return Number(rows[0]?.n ?? 0);
    }
    case "HABIT_CHECKINS":
      return db.habitLog.count({ where: { userId, date: { gte: keyToDate(fromKey), lte: keyToDate(toKey) } } });
  }
}

/** Recalcula o progresso das missões ativas a partir dos dados reais. */
export async function refreshMissions(userId: string) {
  const active = await db.missionProgress.findMany({ where: { userId, status: "ACTIVE" }, include: { mission: true } });
  const now = new Date();
  for (const mp of active) {
    const value = await metricValue(userId, mp.mission.metric, mp.startedAt, mp.endsAt < now ? mp.endsAt : now);
    if (value >= mp.mission.targetValue) {
      const done = await db.missionProgress.updateMany({ where: { id: mp.id, status: "ACTIVE" }, data: { progress: value, status: "COMPLETED", completedAt: now } });
      if (done.count === 1) {
        await awardXp(userId, mp.mission.xpReward, `Missão: ${mp.mission.name}`, `mission:${mp.id}`);
        await addMilestone(userId, "MISSION_COMPLETED", mp.mission.name, "Missão concluída.", `mission:${mp.id}`, { missionId: mp.mission.id });
        await notify(userId, { type: "mission", title: `Missão concluída: ${mp.mission.name}`, body: `+${mp.mission.xpReward} XP`, href: "/app/missions" });
      }
    } else if (mp.endsAt < now) {
      await db.missionProgress.update({ where: { id: mp.id }, data: { progress: value, status: "FAILED" } });
    } else if (value !== mp.progress) {
      await db.missionProgress.update({ where: { id: mp.id }, data: { progress: value } });
    }
  }
}

/** Ponto único chamado após eventos relevantes (treino concluído, refeição, hábito...). */
export async function afterActivity(userId: string) {
  await refreshMissions(userId);
  await evaluateAchievements(userId);
  await checkWeekMilestone(userId);
}

async function checkWeekMilestone(userId: string) {
  const pref = await db.userPreference.findUnique({ where: { userId }, select: { weeklyWorkoutTarget: true } });
  const target = pref?.weeklyWorkoutTarget ?? 3;
  const today = dateKey();
  const dow = (keyToDate(today).getUTCDay() + 6) % 7;
  const weekStart = addDaysKey(today, -dow);
  const count = await db.workoutSession.count({
    where: { userId, status: "COMPLETED", startedAt: { gte: zonedStartOfDay(weekStart) } },
  });
  if (count >= target) {
    const isFirst = (await db.journeyMilestone.count({ where: { userId, kind: "FIRST_FULL_WEEK" } })) === 0;
    if (isFirst) await addMilestone(userId, "FIRST_FULL_WEEK", "Primeira semana completa", `Você cumpriu a meta de ${target} treinos na semana.`, `week:${weekStart}`);
  }
}
