import "server-only";
import type { MuscleGroup } from "@prisma/client";
import { db } from "../db";
import { addDaysKey, dateKey, keyToDate, weekStartKey, zonedStartOfDay } from "@/lib/utils";
import { levelProgress, streakFromKeys } from "@/lib/fitness-math";
import { activityDayKeys } from "./gamification";
import { getDay } from "./nutrition";
import { nextWorkout } from "./workouts";
import { goalPct } from "./progress";

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// ───────────── FitLife Pulse ─────────────

/**
 * Índice de consistência (0–100) calculado a partir dos registros do usuário.
 * Não é indicador de saúde nem de aptidão física.
 */
export async function pulse(userId: string, todayKey = dateKey()) {
  const pref = await db.userPreference.findUnique({ where: { userId } });
  const weeklyTarget = pref?.weeklyWorkoutTarget ?? 3;
  const waterTarget = pref?.dailyWaterMl ?? 2500;
  const from14 = addDaysKey(todayKey, -13);
  const from7 = addDaysKey(todayKey, -6);

  const [sessions, activeKeys, habits, habitLogs, mealDays, waterDays] = await Promise.all([
    db.workoutSession.findMany({ where: { userId, status: "COMPLETED", startedAt: { gte: zonedStartOfDay(from14) } }, select: { startedAt: true } }),
    activityDayKeys(userId, 60),
    db.habit.count({ where: { userId, archivedAt: null, frequency: "DAILY" } }),
    db.habitLog.count({ where: { userId, date: { gte: keyToDate(from7) }, habit: { frequency: "DAILY", archivedAt: null } } }),
    db.$queryRaw<{ n: bigint }[]>`SELECT COUNT(DISTINCT m.date) AS n FROM meals m WHERE m."userId" = ${userId} AND m."isCustomTemplate" = false AND m.date >= ${keyToDate(from7)}::date AND EXISTS (SELECT 1 FROM meal_entries e WHERE e."mealId" = m.id)`,
    db.$queryRaw<{ n: bigint }[]>`SELECT COUNT(*) AS n FROM (SELECT date FROM water_logs WHERE "userId" = ${userId} AND date >= ${keyToDate(from7)}::date GROUP BY date HAVING SUM("amountMl") >= ${waterTarget}) t`,
  ]);

  const activeLast14 = activeKeys.filter((k) => k >= from14 && k <= todayKey).length;
  const parts = [
    { key: "training", label: "Frequência de treino", weight: 35, value: clamp01(sessions.length / (weeklyTarget * 2)), detail: `${sessions.length} de ${weeklyTarget * 2} treinos em 14 dias` },
    { key: "consistency", label: "Dias ativos", weight: 25, value: clamp01(activeLast14 / 14), detail: `${activeLast14} de 14 dias com registros` },
    { key: "habits", label: "Hábitos", weight: 20, value: habits === 0 ? 0 : clamp01(habitLogs / (habits * 7)), detail: habits === 0 ? "Nenhum hábito diário ativo" : `${habitLogs} de ${habits * 7} check-ins na semana` },
    { key: "nutrition", label: "Diário alimentar", weight: 10, value: clamp01(Number(mealDays[0]?.n ?? 0) / 7), detail: `${Number(mealDays[0]?.n ?? 0)} de 7 dias registrados` },
    { key: "hydration", label: "Hidratação", weight: 10, value: clamp01(Number(waterDays[0]?.n ?? 0) / 7), detail: `${Number(waterDays[0]?.n ?? 0)} de 7 dias na meta` },
  ];
  const score = Math.round(parts.reduce((acc, p) => acc + p.value * p.weight, 0));
  const hasData = activeKeys.length > 0;
  const weakest = [...parts].sort((a, b) => a.value - b.value)[0]!;
  const label = !hasData ? "Sem dados" : score >= 80 ? "Em ritmo forte" : score >= 55 ? "Consistente" : score >= 30 ? "Ganhando ritmo" : "Começando";
  return {
    score,
    label,
    hasData,
    streak: streakFromKeys(activeKeys, todayKey),
    parts: parts.map((p) => ({ ...p, pct: Math.round(p.value * 100) })),
    focus: hasData ? `Seu maior potencial de melhora agora: ${weakest.label.toLowerCase()} (${weakest.detail}).` : "Registre um treino, refeição ou hábito para ativar o seu Pulse.",
    last14: Array.from({ length: 14 }, (_, i) => {
      const k = addDaysKey(from14, i);
      return { date: k, active: activeKeys.includes(k) };
    }),
  };
}

// ───────────── Dashboard ─────────────

export async function dashboard(userId: string) {
  const today = dateKey();
  const weekStart = weekStartKey(today);
  const weekStartAt = zonedStartOfDay(weekStart);
  const eightWeeksAgo = addDaysKey(weekStart, -7 * 7);

  const [user, pref, measurements, sessions, totalCompleted, totalAgg, goals, nutrition, next, pulseData, unreadNotifications] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, xp: true, level: true, profile: { select: { avatarPath: true, goal: true, weightKg: true } } } }),
    db.userPreference.findUnique({ where: { userId } }),
    db.bodyMeasurement.findMany({ where: { userId }, orderBy: { measuredAt: "asc" }, take: 120 }),
    db.workoutSession.findMany({ where: { userId, status: "COMPLETED", startedAt: { gte: zonedStartOfDay(eightWeeksAgo) } }, select: { startedAt: true, durationSec: true, totalVolumeKg: true } }),
    db.workoutSession.count({ where: { userId, status: "COMPLETED" } }),
    db.workoutSession.aggregate({ where: { userId, status: "COMPLETED" }, _sum: { durationSec: true } }),
    db.userGoal.findMany({ where: { userId, status: { in: ["ACTIVE", "COMPLETED"] } }, orderBy: { createdAt: "desc" }, take: 6 }),
    getDay(userId, today),
    nextWorkout(userId),
    pulse(userId, today),
    db.notification.count({ where: { userId, readAt: null } }),
  ]);

  const weekly = Array.from({ length: 8 }, (_, i) => {
    const ws = addDaysKey(eightWeeksAgo, i * 7);
    const we = addDaysKey(ws, 7);
    const inWeek = sessions.filter((s) => {
      const k = dateKey(s.startedAt);
      return k >= ws && k < we;
    });
    return { week: ws, workouts: inWeek.length, minutes: Math.round(inWeek.reduce((a, s) => a + (s.durationSec ?? 0), 0) / 60) };
  });
  const dow = [0, 0, 0, 0, 0, 0, 0];
  for (const s of sessions) dow[(new Date(`${dateKey(s.startedAt)}T00:00:00Z`).getUTCDay() + 6) % 7]!++;
  const thisWeek = sessions.filter((s) => s.startedAt >= weekStartAt);
  const weightSeries = measurements.filter((m) => m.weightKg != null).map((m) => ({ date: dateKey(m.measuredAt), value: m.weightKg! }));
  const measureSeries = measurements
    .filter((m) => m.waistCm != null || m.chestCm != null || m.armCm != null || m.hipsCm != null)
    .map((m) => ({ date: dateKey(m.measuredAt), waist: m.waistCm, chest: m.chestCm, arm: m.armCm, hips: m.hipsCm }));
  const currentWeight = weightSeries.at(-1)?.value ?? user.profile?.weightKg ?? null;
  const firstWeight = weightSeries[0]?.value ?? null;

  return {
    user: { name: user.name, firstName: user.name.split(" ")[0], avatar: !!user.profile?.avatarPath, ...levelProgress(user.xp), xp: user.xp, goal: user.profile?.goal ?? null },
    unreadNotifications,
    stats: {
      currentWeight,
      weightDelta: currentWeight != null && firstWeight != null ? Math.round((currentWeight - firstWeight) * 10) / 10 : null,
      totalWorkouts: totalCompleted,
      streak: pulseData.streak,
      totalMinutes: Math.round((totalAgg._sum.durationSec ?? 0) / 60),
      weekMinutes: Math.round(thisWeek.reduce((a, s) => a + (s.durationSec ?? 0), 0) / 60),
      goalsCompleted: goals.filter((g) => g.status === "COMPLETED").length,
      goalsTotal: goals.length,
      weekWorkouts: thisWeek.length,
      weeklyTarget: pref?.weeklyWorkoutTarget ?? 3,
    },
    charts: {
      weight: weightSeries,
      weekly,
      weekday: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d, i) => ({ day: d, workouts: dow[i]! })),
      measurements: measureSeries,
      goals: goals.map((g) => ({ id: g.id, title: g.title, pct: Math.round(goalPct(g)), status: g.status, current: g.currentValue, target: g.targetValue, unit: g.unit })),
    },
    nutrition: { totals: nutrition.totals, targets: nutrition.targets, waterMl: nutrition.waterMl },
    next: next
      ? {
          id: next.workout.id,
          name: next.workout.name,
          focus: next.workout.focus,
          minutes: next.workout.estimatedMinutes,
          exercises: next.workout.exercises.length,
          groups: [...new Set(next.workout.exercises.map((e) => e.exercise.muscleGroup))],
          scheduledFor: next.scheduledFor,
        }
      : null,
    pulse: pulseData,
  };
}

// ───────────── Body Journey ─────────────

export async function journey(userId: string, opts: { cursor?: string; take?: number; kind?: string } = {}) {
  const take = Math.min(opts.take ?? 30, 60);
  const items = await db.journeyMilestone.findMany({
    where: { userId, ...(opts.kind ? { kind: opts.kind as never } : {}) },
    orderBy: { occurredAt: "desc" },
    take: take + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
  });
  return { items: items.slice(0, take), nextCursor: items.length > take ? items[take - 1]!.id : null };
}

// ───────────── Revisão semanal (funcionalidade extra) ─────────────

export async function weeklyReview(userId: string, todayKey = dateKey()) {
  const thisStart = weekStartKey(todayKey);
  const lastStart = addDaysKey(thisStart, -7);
  const range = async (from: string, to: string) => {
    const [s, habitLogs, meals, water] = await Promise.all([
      db.workoutSession.findMany({ where: { userId, status: "COMPLETED", startedAt: { gte: zonedStartOfDay(from), lt: zonedStartOfDay(to) } }, select: { durationSec: true, totalVolumeKg: true, cardioKm: true } }),
      db.habitLog.count({ where: { userId, date: { gte: keyToDate(from), lt: keyToDate(to) } } }),
      db.mealEntry.count({ where: { meal: { userId, isCustomTemplate: false, date: { gte: keyToDate(from), lt: keyToDate(to) } } } }),
      db.waterLog.aggregate({ where: { userId, date: { gte: keyToDate(from), lt: keyToDate(to) } }, _sum: { amountMl: true } }),
    ]);
    return {
      workouts: s.length,
      minutes: Math.round(s.reduce((a, x) => a + (x.durationSec ?? 0), 0) / 60),
      volumeKg: Math.round(s.reduce((a, x) => a + x.totalVolumeKg, 0)),
      cardioKm: Math.round(s.reduce((a, x) => a + x.cardioKm, 0) * 10) / 10,
      habitCheckins: habitLogs,
      mealsLogged: meals,
      waterL: Math.round(((water._sum.amountMl ?? 0) / 1000) * 10) / 10,
    };
  };
  const [current, previous] = await Promise.all([range(thisStart, addDaysKey(thisStart, 7)), range(lastStart, thisStart)]);
  const highlights: string[] = [];
  if (current.workouts > previous.workouts) highlights.push(`Você treinou ${current.workouts - previous.workouts} vez(es) a mais que na semana passada.`);
  if (current.volumeKg > previous.volumeKg && previous.volumeKg > 0) highlights.push(`Volume total de carga subiu ${Math.round(((current.volumeKg - previous.volumeKg) / previous.volumeKg) * 100)}%.`);
  if (current.habitCheckins > previous.habitCheckins) highlights.push("Seus hábitos estão mais consistentes do que na semana anterior.");
  if (highlights.length === 0 && current.workouts + current.habitCheckins + current.mealsLogged === 0) highlights.push("Semana nova, página em branco. Comece com um treino curto ou um check-in de hábito.");
  return { weekStart: thisStart, current, previous, highlights };
}

// ───────────── Sobrecarga progressiva (funcionalidade extra) ─────────────

/**
 * Sugestão de carga por "dupla progressão": se o usuário atingiu o topo da faixa de repetições
 * em todas as séries da última sessão, sugere +2,5 kg (membros superiores) ou +5 kg (inferiores).
 */
export async function loadSuggestions(userId: string, items: { exerciseId: string; reps: string; muscleGroup: MuscleGroup; loadKg: number | null }[]) {
  const out: Record<string, { lastLoad: number | null; lastReps: number[]; suggestedLoad: number | null; reason: string }> = {};
  for (const it of items) {
    const lastSession = await db.workoutSession.findFirst({
      where: { userId, status: "COMPLETED", sets: { some: { exerciseId: it.exerciseId } } },
      orderBy: { startedAt: "desc" },
      select: { sets: { where: { exerciseId: it.exerciseId }, orderBy: { setNumber: "asc" }, select: { reps: true, loadKg: true } } },
    });
    const sets = lastSession?.sets ?? [];
    const top = Number(it.reps.split("-").at(-1)?.replace(/\D/g, "")) || null;
    const lastLoad = sets.reduce<number | null>((m, s) => (s.loadKg != null && (m == null || s.loadKg > m) ? s.loadKg : m), null);
    const lastReps = sets.map((s) => s.reps ?? 0);
    if (!sets.length || lastLoad == null) {
      out[it.exerciseId] = { lastLoad: null, lastReps, suggestedLoad: it.loadKg, reason: it.loadKg ? "Carga planejada no treino." : "Sem histórico: escolha uma carga confortável." };
      continue;
    }
    const lower = it.muscleGroup === "LEGS" || it.muscleGroup === "GLUTES";
    if (top && lastReps.length > 0 && lastReps.every((r) => r >= top)) {
      out[it.exerciseId] = { lastLoad, lastReps, suggestedLoad: lastLoad + (lower ? 5 : 2.5), reason: `Você completou ${top} repetições em todas as séries. Experimente aumentar a carga com segurança.` };
    } else {
      out[it.exerciseId] = { lastLoad, lastReps, suggestedLoad: lastLoad, reason: "Mantenha a carga e busque mais repetições com boa técnica." };
    }
  }
  return out;
}

// ───────────── Mapa de equilíbrio muscular (funcionalidade extra) ─────────────

export async function muscleBalance(userId: string, days = 30) {
  const since = new Date(Date.now() - days * 86400_000);
  const rows = await db.$queryRaw<{ g: MuscleGroup; sets: bigint }[]>`
    SELECT e."muscleGroup" AS g, COUNT(*) AS sets FROM workout_sets s
    JOIN workout_sessions ws ON ws.id = s."sessionId" JOIN exercises e ON e.id = s."exerciseId"
    WHERE ws."userId" = ${userId} AND ws.status = 'COMPLETED' AND ws."startedAt" >= ${since}
    GROUP BY e."muscleGroup"`;
  const groups: MuscleGroup[] = ["CHEST", "BACK", "SHOULDERS", "BICEPS", "TRICEPS", "LEGS", "GLUTES", "ABS", "CARDIO", "MOBILITY"];
  const map = new Map(rows.map((r) => [r.g, Number(r.sets)]));
  const max = Math.max(1, ...map.values());
  const data = groups.map((g) => ({ group: g, sets: map.get(g) ?? 0, intensity: (map.get(g) ?? 0) / max }));
  const trained = data.filter((d) => d.sets > 0 && d.group !== "CARDIO" && d.group !== "MOBILITY");
  const neglected = trained.length >= 2 ? data.filter((d) => d.sets === 0 && d.group !== "CARDIO" && d.group !== "MOBILITY").map((d) => d.group) : [];
  return { days, data, neglected, totalSets: [...map.values()].reduce((a, b) => a + b, 0) };
}

// ───────────── Relatórios avançados (Pro) ─────────────

export async function advancedReport(userId: string) {
  const since = new Date(Date.now() - 90 * 86400_000);
  const sessions = await db.workoutSession.findMany({
    where: { userId, status: "COMPLETED", startedAt: { gte: since } },
    orderBy: { startedAt: "asc" },
    select: { startedAt: true, durationSec: true, totalVolumeKg: true, perceivedEffort: true, cardioKm: true },
  });
  const records = await db.personalRecord.findMany({ where: { userId }, include: { exercise: { select: { name: true } } }, orderBy: { estimated1Rm: "desc" }, take: 10 });
  const byWeek = new Map<string, { volume: number; minutes: number; sessions: number; effort: number[] }>();
  for (const s of sessions) {
    const wk = weekStartKey(dateKey(s.startedAt));
    const cur = byWeek.get(wk) ?? { volume: 0, minutes: 0, sessions: 0, effort: [] };
    cur.volume += s.totalVolumeKg;
    cur.minutes += Math.round((s.durationSec ?? 0) / 60);
    cur.sessions += 1;
    if (s.perceivedEffort) cur.effort.push(s.perceivedEffort);
    byWeek.set(wk, cur);
  }
  return {
    weeks: [...byWeek.entries()].map(([week, v]) => ({ week, volume: Math.round(v.volume), minutes: v.minutes, sessions: v.sessions, avgEffort: v.effort.length ? Math.round((v.effort.reduce((a, b) => a + b, 0) / v.effort.length) * 10) / 10 : null })),
    records: records.map((r) => ({ exercise: r.exercise.name, loadKg: r.loadKg, reps: r.reps, e1rm: r.estimated1Rm, date: r.achievedAt })),
    totals: {
      sessions: sessions.length,
      minutes: Math.round(sessions.reduce((a, s) => a + (s.durationSec ?? 0), 0) / 60),
      volumeKg: Math.round(sessions.reduce((a, s) => a + s.totalVolumeKg, 0)),
      cardioKm: Math.round(sessions.reduce((a, s) => a + s.cardioKm, 0) * 10) / 10,
    },
    balance: await muscleBalance(userId, 90),
  };
}

// ───────────── Ranking opcional ─────────────

export async function leaderboard(userId: string) {
  const since = new Date(Date.now() - 7 * 86400_000);
  const rows = await db.$queryRaw<{ id: string; name: string; username: string | null; level: number; xp: bigint }[]>`
    SELECT u.id, u.name, p.username, u.level, COALESCE(SUM(x.amount),0) AS xp
    FROM users u JOIN user_preferences up ON up."userId" = u.id LEFT JOIN profiles p ON p."userId" = u.id
    LEFT JOIN xp_events x ON x."userId" = u.id AND x."createdAt" >= ${since}
    WHERE up."showInRanking" = true AND u.status = 'ACTIVE'
    GROUP BY u.id, u.name, p.username, u.level ORDER BY xp DESC, u.level DESC LIMIT 20`;
  return rows.map((r, i) => ({ rank: i + 1, id: r.id, name: r.username ? `@${r.username}` : r.name.split(" ")[0], level: r.level, weeklyXp: Number(r.xp), isMe: r.id === userId }));
}
