import "server-only";
import type { z } from "zod";
import type { MuscleGroup, Prisma } from "@prisma/client";
import { db } from "../db";
import { Errors } from "../errors";
import { PLAN_LIMITS } from "../permissions";
import type { finishSessionSchema, logSetSchema, workoutSchema } from "@/lib/validations/fitness";
import { estimate1Rm } from "@/lib/fitness-math";
import { dateKey, zonedStartOfDay } from "@/lib/utils";
import { addMilestone, afterActivity, awardXp, MIN_VALID_SESSION_SEC, XP } from "./gamification";
import { getPlan } from "./billing";

// ───────────── Biblioteca ─────────────

export async function listExercises(userId: string, f: { q?: string; group?: MuscleGroup; difficulty?: string; equipment?: string }) {
  const where: Prisma.ExerciseWhereInput = {
    isPublished: true,
    OR: [{ authorId: null }, { authorId: userId }],
    ...(f.group ? { muscleGroup: f.group } : {}),
    ...(f.difficulty ? { difficulty: f.difficulty as never } : {}),
    ...(f.equipment ? { equipment: { contains: f.equipment, mode: "insensitive" } } : {}),
    ...(f.q ? { name: { contains: f.q, mode: "insensitive" } } : {}),
  };
  return db.exercise.findMany({ where, orderBy: [{ muscleGroup: "asc" }, { name: "asc" }], take: 200 });
}

export async function getExercise(userId: string, idOrSlug: string) {
  const ex = await db.exercise.findFirst({ where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }], isPublished: true, AND: [{ OR: [{ authorId: null }, { authorId: userId }] }] } });
  if (!ex) throw Errors.notFound("Exercício");
  const [pr, recent] = await Promise.all([
    db.personalRecord.findUnique({ where: { userId_exerciseId: { userId, exerciseId: ex.id } } }),
    db.workoutSet.findMany({ where: { exerciseId: ex.id, session: { userId, status: "COMPLETED" } }, orderBy: { completedAt: "desc" }, take: 30, select: { reps: true, loadKg: true, completedAt: true, durationSec: true, distanceKm: true } }),
  ]);
  return { exercise: ex, pr, recent };
}

// ───────────── Treinos ─────────────

const workoutInclude = { exercises: { orderBy: { position: "asc" }, include: { exercise: true } } } as const;

export async function listWorkouts(userId: string) {
  return db.workout.findMany({ where: { userId, archivedAt: null }, orderBy: [{ isTemplate: "desc" }, { updatedAt: "desc" }], include: workoutInclude });
}

export async function getWorkout(userId: string, id: string) {
  const w = await db.workout.findFirst({ where: { id, userId, archivedAt: null }, include: workoutInclude });
  if (!w) throw Errors.notFound("Treino");
  return w;
}

async function assertExercisesAccessible(userId: string, ids: string[]) {
  const unique = [...new Set(ids)];
  const count = await db.exercise.count({ where: { id: { in: unique }, OR: [{ authorId: null }, { authorId: userId }] } });
  if (count !== unique.length) throw Errors.badRequest("Um ou mais exercícios são inválidos.");
}

export async function createWorkout(userId: string, data: z.infer<typeof workoutSchema>) {
  const plan = await getPlan(userId);
  const count = await db.workout.count({ where: { userId, archivedAt: null } });
  if (count >= PLAN_LIMITS[plan].maxCustomWorkouts) throw Errors.planRequired(plan === "FREE" ? "Pro" : "Elite");
  await assertExercisesAccessible(userId, data.items.map((i) => i.exerciseId));
  const { items, ...rest } = data;
  return db.workout.create({
    data: { ...rest, userId, exercises: { create: items.map((it, i) => ({ ...it, position: i })) } },
    include: workoutInclude,
  });
}

export async function updateWorkout(userId: string, id: string, data: z.infer<typeof workoutSchema>) {
  await getWorkout(userId, id);
  await assertExercisesAccessible(userId, data.items.map((i) => i.exerciseId));
  const { items, ...rest } = data;
  // Substitui a lista inteira (mantém a ordem definida pelo usuário).
  return db.$transaction(async (tx) => {
    await tx.workoutExercise.deleteMany({ where: { workoutId: id } });
    return tx.workout.update({
      where: { id },
      data: { ...rest, exercises: { create: items.map((it, i) => ({ ...it, position: i })) } },
      include: workoutInclude,
    });
  });
}

/** Exclusão lógica: preserva o histórico de sessões que referenciam o treino. */
export async function deleteWorkout(userId: string, id: string) {
  await getWorkout(userId, id);
  await db.workout.update({ where: { id }, data: { archivedAt: new Date() } });
}

export async function duplicateWorkout(userId: string, id: string) {
  const w = await getWorkout(userId, id);
  return createWorkout(userId, {
    name: `${w.name} (cópia)`.slice(0, 80),
    description: w.description,
    focus: w.focus,
    isTemplate: false,
    estimatedMinutes: w.estimatedMinutes,
    items: w.exercises.map((e) => ({ exerciseId: e.exerciseId, sets: e.sets, reps: e.reps, loadKg: e.loadKg, restSec: e.restSec, notes: e.notes })),
  });
}

// ───────────── Sessões (execução) ─────────────

export async function startSession(userId: string, input: { workoutId?: string; name?: string }) {
  const open = await db.workoutSession.findFirst({ where: { userId, status: "IN_PROGRESS" } });
  if (open) {
    // Sessões esquecidas há mais de 6h são encerradas como abandonadas.
    if (Date.now() - open.startedAt.getTime() > 6 * 3600_000) {
      await db.workoutSession.update({ where: { id: open.id }, data: { status: "ABANDONED", endedAt: new Date() } });
    } else {
      return open;
    }
  }
  let name = input.name ?? "Treino livre";
  if (input.workoutId) name = (await getWorkout(userId, input.workoutId)).name;
  return db.workoutSession.create({ data: { userId, workoutId: input.workoutId ?? null, name } });
}

export async function getSession(userId: string, id: string) {
  const s = await db.workoutSession.findFirst({
    where: { id, userId },
    include: { sets: { orderBy: { completedAt: "asc" }, include: { exercise: { select: { id: true, name: true, muscleGroup: true, isCardio: true } } } }, workout: { include: workoutInclude } },
  });
  if (!s) throw Errors.notFound("Sessão");
  return s;
}

export async function getActiveSession(userId: string) {
  return db.workoutSession.findFirst({ where: { userId, status: "IN_PROGRESS" }, select: { id: true, name: true, startedAt: true } });
}

export async function logSet(userId: string, sessionId: string, input: z.infer<typeof logSetSchema>) {
  const s = await db.workoutSession.findFirst({ where: { id: sessionId, userId } });
  if (!s) throw Errors.notFound("Sessão");
  if (s.status !== "IN_PROGRESS") throw Errors.badRequest("Esta sessão já foi encerrada.");
  await assertExercisesAccessible(userId, [input.exerciseId]);
  const set = await db.workoutSet.create({
    data: { sessionId, exerciseId: input.exerciseId, setNumber: input.setNumber, reps: input.reps ?? null, loadKg: input.loadKg ?? null, durationSec: input.durationSec ?? null, distanceKm: input.distanceKm ?? null },
  });
  return set;
}

export async function deleteSet(userId: string, sessionId: string, setId: string) {
  const res = await db.workoutSet.deleteMany({ where: { id: setId, sessionId, session: { userId, status: "IN_PROGRESS" } } });
  if (res.count === 0) throw Errors.notFound("Série");
}

export async function finishSession(userId: string, sessionId: string, input: z.infer<typeof finishSessionSchema>) {
  const s = await db.workoutSession.findFirst({ where: { id: sessionId, userId }, include: { sets: { include: { exercise: true } } } });
  if (!s) throw Errors.notFound("Sessão");
  if (s.status !== "IN_PROGRESS") throw Errors.badRequest("Esta sessão já foi encerrada.");
  const endedAt = new Date();
  const durationSec = Math.min(Math.round((endedAt.getTime() - s.startedAt.getTime()) / 1000), 6 * 3600);
  const totalVolumeKg = s.sets.reduce((acc, x) => acc + (x.loadKg ?? 0) * (x.reps ?? 0), 0);
  const cardioKm = s.sets.reduce((acc, x) => acc + (x.distanceKm ?? 0), 0);
  const status = input.status === "COMPLETED" && s.sets.length === 0 ? "ABANDONED" : input.status;

  await db.workoutSession.update({
    where: { id: s.id },
    data: { status, endedAt, durationSec, totalVolumeKg, cardioKm, perceivedEffort: input.perceivedEffort ?? null, notes: input.notes ?? null },
  });

  const result = { status, durationSec, totalVolumeKg, cardioKm, xp: 0, newRecords: [] as { exercise: string; loadKg: number; reps: number }[] };
  if (status !== "COMPLETED") return result;

  // Recordes pessoais (1RM estimado).
  const best = new Map<string, { loadKg: number; reps: number; e1rm: number; name: string }>();
  for (const set of s.sets) {
    if (!set.loadKg || !set.reps || set.exercise.isCardio) continue;
    const e1rm = estimate1Rm(set.loadKg, set.reps);
    const cur = best.get(set.exerciseId);
    if (!cur || e1rm > cur.e1rm) best.set(set.exerciseId, { loadKg: set.loadKg, reps: set.reps, e1rm, name: set.exercise.name });
  }
  for (const [exerciseId, b] of best) {
    const pr = await db.personalRecord.findUnique({ where: { userId_exerciseId: { userId, exerciseId } } });
    if (!pr || b.e1rm > pr.estimated1Rm) {
      await db.personalRecord.upsert({
        where: { userId_exerciseId: { userId, exerciseId } },
        create: { userId, exerciseId, loadKg: b.loadKg, reps: b.reps, estimated1Rm: b.e1rm },
        update: { loadKg: b.loadKg, reps: b.reps, estimated1Rm: b.e1rm, achievedAt: new Date() },
      });
      if (pr) {
        result.newRecords.push({ exercise: b.name, loadKg: b.loadKg, reps: b.reps });
        await addMilestone(userId, "PERSONAL_RECORD", `Novo recorde: ${b.name}`, `${b.loadKg} kg × ${b.reps} (1RM est. ${b.e1rm} kg)`, `pr:${s.id}:${exerciseId}`, { exerciseId, loadKg: b.loadKg, reps: b.reps });
      }
    }
  }

  // XP com proteção anti-abuso: sessões muito curtas não pontuam e há limite diário.
  if (durationSec >= MIN_VALID_SESSION_SEC) {
    const todayStart = zonedStartOfDay(dateKey());
    const xpToday = await db.xpEvent.count({ where: { userId, reason: "Treino concluído", createdAt: { gte: todayStart } } });
    if (xpToday < XP.maxXpWorkoutsPerDay) {
      const bonus = Math.min(XP.workoutMaxBonus, Math.floor(durationSec / 120));
      result.xp = await awardXp(userId, XP.workoutBase + bonus, "Treino concluído", `session:${s.id}`);
      await db.workoutSession.update({ where: { id: s.id }, data: { xpAwarded: result.xp } });
    }
  }

  const completed = await db.workoutSession.count({ where: { userId, status: "COMPLETED", durationSec: { gte: MIN_VALID_SESSION_SEC } } });
  if (completed === 1 && durationSec >= MIN_VALID_SESSION_SEC) await addMilestone(userId, "FIRST_WORKOUT", "Primeiro treino", `Você concluiu "${s.name}".`, "first-workout", { sessionId: s.id });

  // Marca o evento do calendário de hoje correspondente como concluído.
  if (s.workoutId) {
    const start = zonedStartOfDay(dateKey());
    await db.calendarEvent.updateMany({
      where: { userId, workoutId: s.workoutId, completedAt: null, startsAt: { gte: start, lt: new Date(start.getTime() + 86400_000) } },
      data: { completedAt: endedAt },
    });
  }
  await afterActivity(userId);
  return result;
}

export async function listHistory(userId: string, opts: { cursor?: string; take?: number } = {}) {
  const take = Math.min(opts.take ?? 20, 50);
  const items = await db.workoutSession.findMany({
    where: { userId, status: { in: ["COMPLETED", "ABANDONED"] } },
    orderBy: { startedAt: "desc" },
    take: take + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    include: { _count: { select: { sets: true } } },
  });
  return { items: items.slice(0, take), nextCursor: items.length > take ? items[take - 1]!.id : null };
}

export async function listRecords(userId: string) {
  return db.personalRecord.findMany({ where: { userId }, include: { exercise: { select: { name: true, muscleGroup: true, slug: true } } }, orderBy: { achievedAt: "desc" } });
}

/** Sugere o próximo treino: o da agenda de hoje, ou o treino menos recentemente executado. */
export async function nextWorkout(userId: string) {
  const start = zonedStartOfDay(dateKey());
  const scheduled = await db.calendarEvent.findFirst({
    where: { userId, type: "WORKOUT", completedAt: null, workoutId: { not: null }, startsAt: { gte: start }, workout: { archivedAt: null } },
    orderBy: { startsAt: "asc" },
    include: { workout: { include: workoutInclude } },
  });
  if (scheduled?.workout) return { workout: scheduled.workout, scheduledFor: scheduled.startsAt };
  const workouts = await db.workout.findMany({ where: { userId, archivedAt: null }, include: { ...workoutInclude, sessions: { where: { status: "COMPLETED" }, orderBy: { startedAt: "desc" }, take: 1, select: { startedAt: true } } } });
  if (workouts.length === 0) return null;
  workouts.sort((a, b) => (a.sessions[0]?.startedAt.getTime() ?? 0) - (b.sessions[0]?.startedAt.getTime() ?? 0));
  return { workout: workouts[0]!, scheduledFor: null };
}
