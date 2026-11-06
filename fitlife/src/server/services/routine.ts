import "server-only";
import type { z } from "zod";
import { db } from "../db";
import { Errors } from "../errors";
import { PLAN_LIMITS } from "../permissions";
import type { calendarEventSchema, habitSchema, recoverySchema } from "@/lib/validations/tracking";
import { longestStreak, streakFromKeys } from "@/lib/fitness-math";
import { addDaysKey, dateKey, keyToDate, weekStartKey } from "@/lib/utils";
import { addMilestone, afterActivity, awardXp, XP } from "./gamification";
import { getPlan } from "./billing";

// ───────────── Hábitos ─────────────

export async function listHabits(userId: string, todayKey = dateKey()) {
  const since = addDaysKey(todayKey, -90);
  const habits = await db.habit.findMany({
    where: { userId, archivedAt: null },
    orderBy: { createdAt: "asc" },
    include: { logs: { where: { date: { gte: keyToDate(since) } }, select: { date: true } } },
  });
  const weekStart = weekStartKey(todayKey);
  return habits.map((h) => {
    const keys = h.logs.map((l) => l.date.toISOString().slice(0, 10));
    const set = new Set(keys);
    const last30 = Array.from({ length: 30 }, (_, i) => addDaysKey(todayKey, -29 + i));
    const weekCount = keys.filter((k) => k >= weekStart && k <= todayKey).length;
    return {
      id: h.id,
      name: h.name,
      icon: h.icon,
      color: h.color,
      frequency: h.frequency,
      targetPerPeriod: h.targetPerPeriod,
      doneToday: set.has(todayKey),
      streak: h.frequency === "DAILY" ? streakFromKeys(keys, todayKey) : weekCount,
      bestStreak: longestStreak(keys),
      weekCount,
      consistency30: Math.round((last30.filter((k) => set.has(k)).length / 30) * 100),
      heatmap: last30.map((k) => ({ date: k, done: set.has(k) })),
    };
  });
}

export async function createHabit(userId: string, data: z.infer<typeof habitSchema>) {
  const plan = await getPlan(userId);
  const count = await db.habit.count({ where: { userId, archivedAt: null } });
  if (count >= PLAN_LIMITS[plan].maxHabits) throw Errors.planRequired(plan === "FREE" ? "Pro" : "Elite");
  return db.habit.create({ data: { ...data, userId } });
}

export async function updateHabit(userId: string, id: string, data: Partial<z.infer<typeof habitSchema>>) {
  const res = await db.habit.updateMany({ where: { id, userId, archivedAt: null }, data });
  if (res.count === 0) throw Errors.notFound("Hábito");
}

export async function archiveHabit(userId: string, id: string) {
  const res = await db.habit.updateMany({ where: { id, userId, archivedAt: null }, data: { archivedAt: new Date() } });
  if (res.count === 0) throw Errors.notFound("Hábito");
}

/** Marca/desmarca um hábito em uma data (no máximo 7 dias no passado, nunca no futuro). */
export async function toggleHabit(userId: string, id: string, key: string) {
  const today = dateKey();
  if (key > today) throw Errors.badRequest("Não é possível registrar hábitos no futuro.");
  if (key < addDaysKey(today, -7)) throw Errors.badRequest("Só é possível ajustar os últimos 7 dias.");
  const habit = await db.habit.findFirst({ where: { id, userId, archivedAt: null } });
  if (!habit) throw Errors.notFound("Hábito");
  const date = keyToDate(key);
  const existing = await db.habitLog.findUnique({ where: { habitId_date: { habitId: id, date } } });
  if (existing) {
    await db.habitLog.delete({ where: { id: existing.id } });
    return { done: false };
  }
  await db.habitLog.create({ data: { habitId: id, userId, date } });
  // XP idempotente por hábito/dia: desmarcar e remarcar não gera pontos extras.
  await awardXp(userId, XP.habitCheck, "Hábito concluído", `habit:${id}:${key}`);
  const logs = await db.habitLog.findMany({ where: { habitId: id, date: { gte: keyToDate(addDaysKey(today, -60)) } }, select: { date: true } });
  const streak = streakFromKeys(logs.map((l) => l.date.toISOString().slice(0, 10)), today);
  if (streak === 7 || streak === 21 || streak === 66) {
    await addMilestone(userId, "HABIT_STREAK", `${habit.name}: ${streak} dias`, `Sequência de ${streak} dias consecutivos.`, `habit-streak:${id}:${streak}`, { habitId: id, streak });
  }
  await afterActivity(userId);
  return { done: true };
}

// ───────────── Calendário ─────────────

export async function listEvents(userId: string, from: Date, to: Date) {
  const events = await db.calendarEvent.findMany({
    where: { userId, startsAt: { gte: from, lt: to } },
    orderBy: { startsAt: "asc" },
    include: { workout: { select: { id: true, name: true, archivedAt: true } } },
  });
  // Sessões concluídas aparecem como histórico no calendário.
  const sessions = await db.workoutSession.findMany({
    where: { userId, status: "COMPLETED", startedAt: { gte: from, lt: to } },
    select: { id: true, name: true, startedAt: true, durationSec: true, workoutId: true },
  });
  return { events, sessions };
}

export async function createEvent(userId: string, data: z.infer<typeof calendarEventSchema>) {
  if (data.workoutId) {
    const w = await db.workout.findFirst({ where: { id: data.workoutId, userId, archivedAt: null } });
    if (!w) throw Errors.notFound("Treino");
  }
  const { remindMinutesBefore, ...rest } = data;
  return db.calendarEvent.create({
    data: { ...rest, userId, remindAt: remindMinutesBefore != null ? new Date(data.startsAt.getTime() - remindMinutesBefore * 60_000) : null },
  });
}

export async function updateEvent(userId: string, id: string, data: Partial<z.infer<typeof calendarEventSchema>> & { completed?: boolean }) {
  const ev = await db.calendarEvent.findFirst({ where: { id, userId } });
  if (!ev) throw Errors.notFound("Evento");
  const { remindMinutesBefore, completed, ...rest } = data;
  const startsAt = rest.startsAt ?? ev.startsAt;
  return db.calendarEvent.update({
    where: { id },
    data: {
      ...rest,
      ...(completed !== undefined ? { completedAt: completed ? new Date() : null } : {}),
      ...(remindMinutesBefore !== undefined ? { remindAt: remindMinutesBefore != null ? new Date(startsAt.getTime() - remindMinutesBefore * 60_000) : null, reminderSentAt: null } : {}),
    },
  });
}

export async function deleteEvent(userId: string, id: string) {
  const res = await db.calendarEvent.deleteMany({ where: { id, userId } });
  if (res.count === 0) throw Errors.notFound("Evento");
}

// ───────────── Smart Recovery ─────────────

export async function upsertRecovery(userId: string, data: z.infer<typeof recoverySchema>) {
  if (data.date > dateKey()) throw Errors.badRequest("Não é possível registrar datas futuras.");
  const date = keyToDate(data.date);
  const { date: _d, ...rest } = data;
  const log = await db.recoveryLog.upsert({ where: { userId_date: { userId, date } }, create: { ...rest, userId, date }, update: rest });
  await awardXp(userId, XP.recovery, "Registro de recuperação", `recovery:${data.date}`);
  return log;
}

export async function recoveryOverview(userId: string, todayKey = dateKey()) {
  const since = addDaysKey(todayKey, -27);
  const logs = await db.recoveryLog.findMany({ where: { userId, date: { gte: keyToDate(since) } }, orderBy: { date: "asc" } });
  const sessions = await db.workoutSession.findMany({
    where: { userId, status: "COMPLETED", startedAt: { gte: keyToDate(addDaysKey(todayKey, -7)) } },
    select: { startedAt: true, durationSec: true, perceivedEffort: true },
  });
  const last7 = logs.filter((l) => l.date.toISOString().slice(0, 10) >= addDaysKey(todayKey, -6));
  const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
  const avgSleep = avg(last7.map((l) => l.sleepHours));
  const avgFatigue = avg(last7.map((l) => l.fatigue));
  const avgSoreness = avg(last7.map((l) => l.soreness));
  const restDays = last7.filter((l) => l.isRestDay).length;
  const trainingDaysLast7 = new Set(sessions.map((s) => dateKey(s.startedAt))).size;

  // Sugestões gerais e educativas — nunca um veredito de aptidão.
  const tips: string[] = [];
  if (avgSleep != null && avgSleep < 7) tips.push("Sua média de sono está abaixo de 7h. Uma rotina de sono regular costuma ajudar na recuperação.");
  if (avgSoreness != null && avgSoreness >= 4) tips.push("Você relatou dor muscular elevada. Considere alternar grupos musculares ou incluir um dia leve/descanso.");
  if (avgFatigue != null && avgFatigue >= 4) tips.push("Cansaço percebido alto nos últimos dias. Respeite os sinais do corpo e ajuste a intensidade.");
  if (trainingDaysLast7 >= 6 && restDays === 0) tips.push("Você treinou quase todos os dias. Programe pelo menos um dia de descanso na semana.");
  if (tips.length === 0 && logs.length > 0) tips.push("Seus registros estão equilibrados. Continue mantendo sono, hidratação e descanso em dia.");
  return {
    logs: logs.map((l) => ({ ...l, date: l.date.toISOString().slice(0, 10) })),
    summary: { avgSleep, avgFatigue, avgSoreness, restDays, trainingDaysLast7 },
    tips,
    today: logs.find((l) => l.date.toISOString().slice(0, 10) === todayKey) ?? null,
  };
}

// ───────────── Missões ─────────────

export async function listMissions(userId: string) {
  const [missions, progress] = await Promise.all([
    db.mission.findMany({ where: { isActive: true }, orderBy: { durationDays: "asc" } }),
    db.missionProgress.findMany({ where: { userId }, orderBy: { startedAt: "desc" }, include: { mission: true }, take: 50 }),
  ]);
  return { missions, progress };
}

export async function joinMission(userId: string, missionId: string) {
  const mission = await db.mission.findFirst({ where: { id: missionId, isActive: true } });
  if (!mission) throw Errors.notFound("Missão");
  const active = await db.missionProgress.findFirst({ where: { userId, missionId, status: "ACTIVE" } });
  if (active) throw Errors.conflict("Você já está nesta missão.");
  const activeCount = await db.missionProgress.count({ where: { userId, status: "ACTIVE" } });
  if (activeCount >= 5) throw Errors.badRequest("Você pode ter no máximo 5 missões ativas.");
  return db.missionProgress.create({ data: { userId, missionId, endsAt: new Date(Date.now() + mission.durationDays * 86400_000) } });
}

export async function abandonMission(userId: string, progressId: string) {
  const res = await db.missionProgress.updateMany({ where: { id: progressId, userId, status: "ACTIVE" }, data: { status: "ABANDONED" } });
  if (res.count === 0) throw Errors.notFound("Missão ativa");
}
