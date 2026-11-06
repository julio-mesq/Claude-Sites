import "server-only";
import type { z } from "zod";
import type { UserGoal } from "@prisma/client";
import { db } from "../db";
import { Errors } from "../errors";
import { PLAN_LIMITS } from "../permissions";
import { deleteStoredFile, storeImage } from "../storage";
import type { goalSchema, goalUpdateSchema, measurementSchema } from "@/lib/validations/tracking";
import { dateKey } from "@/lib/utils";
import { addMilestone, afterActivity, awardXp, XP } from "./gamification";
import { getPlan } from "./billing";
import { notify } from "./notifications";

const FIELDS = ["weightKg", "bodyFatPct", "chestCm", "waistCm", "hipsCm", "armCm", "thighCm", "calfCm", "neckCm"] as const;
export const FIELD_LABEL: Record<(typeof FIELDS)[number], string> = {
  weightKg: "Peso",
  bodyFatPct: "% de gordura",
  chestCm: "Peito",
  waistCm: "Cintura",
  hipsCm: "Quadril",
  armCm: "Braço",
  thighCm: "Coxa",
  calfCm: "Panturrilha",
  neckCm: "Pescoço",
};

export async function listMeasurements(userId: string) {
  return db.bodyMeasurement.findMany({ where: { userId }, orderBy: { measuredAt: "asc" } });
}

export async function addMeasurement(userId: string, data: z.infer<typeof measurementSchema>) {
  const previous = await db.bodyMeasurement.findMany({ where: { userId, measuredAt: { lt: data.measuredAt } }, orderBy: { measuredAt: "desc" }, take: 10 });
  const m = await db.bodyMeasurement.create({ data: { ...data, userId } });
  if (data.weightKg) await db.profile.update({ where: { userId }, data: { weightKg: data.weightKg } }).catch(() => undefined);
  if (data.heightCm) await db.profile.update({ where: { userId }, data: { heightCm: data.heightCm } }).catch(() => undefined);

  // Marco na jornada quando há variação relevante (sem juízo de valor clínico).
  const lastWaist = previous.find((p) => p.waistCm != null)?.waistCm;
  if (lastWaist && data.waistCm && Math.abs(lastWaist - data.waistCm) >= 2) {
    await addMilestone(userId, "MEASUREMENT", "Mudança na cintura", `${lastWaist} cm → ${data.waistCm} cm`, `measure:waist:${m.id}`, { from: lastWaist, to: data.waistCm });
  }
  await awardXp(userId, XP.measurement, "Avaliação corporal", `measure:${dateKey(data.measuredAt)}`);
  await syncGoalsFromData(userId);
  await afterActivity(userId);
  return m;
}

export async function deleteMeasurement(userId: string, id: string) {
  const res = await db.bodyMeasurement.deleteMany({ where: { id, userId } });
  if (res.count === 0) throw Errors.notFound("Medida");
}

/** Compara duas avaliações (ou primeira x última) campo a campo. */
export async function compareMeasurements(userId: string, aId?: string, bId?: string) {
  const all = await listMeasurements(userId);
  if (all.length < 2) return null;
  const a = (aId && all.find((m) => m.id === aId)) || all[0]!;
  const b = (bId && all.find((m) => m.id === bId)) || all[all.length - 1]!;
  return {
    a,
    b,
    diff: FIELDS.map((f) => ({ field: f, label: FIELD_LABEL[f], a: a[f], b: b[f], delta: a[f] != null && b[f] != null ? Math.round((b[f]! - a[f]!) * 10) / 10 : null })),
  };
}

// ───────────── Fotos (privadas por padrão) ─────────────

export async function listPhotos(userId: string) {
  return db.progressPhoto.findMany({ where: { userId }, orderBy: { takenAt: "desc" }, select: { id: true, pose: true, takenAt: true, notes: true, visibility: true, sizeBytes: true } });
}

export async function uploadPhoto(userId: string, file: File, meta: { pose: string; takenAt: Date; notes?: string | null }) {
  const plan = await getPlan(userId);
  const used = (await db.progressPhoto.aggregate({ where: { userId }, _sum: { sizeBytes: true } }))._sum.sizeBytes ?? 0;
  if (used + file.size > PLAN_LIMITS[plan].photoStorageMb * 1024 * 1024) throw Errors.planRequired(plan === "FREE" ? "Pro" : "Elite");
  const stored = await storeImage(`photos/${userId}`, file);
  return db.progressPhoto.create({ data: { userId, ...stored, pose: meta.pose, takenAt: meta.takenAt, notes: meta.notes ?? null, visibility: "PRIVATE" } });
}

export async function getPhotoForOwner(userId: string, id: string) {
  const p = await db.progressPhoto.findFirst({ where: { id, userId } });
  if (!p) throw Errors.notFound("Foto");
  return p;
}

export async function deletePhoto(userId: string, id: string) {
  const p = await getPhotoForOwner(userId, id);
  await db.progressPhoto.delete({ where: { id: p.id } });
  await deleteStoredFile(p.storagePath);
}

// ───────────── Metas ─────────────

function isReached(g: Pick<UserGoal, "startValue" | "targetValue" | "currentValue">) {
  return g.targetValue >= g.startValue ? g.currentValue >= g.targetValue : g.currentValue <= g.targetValue;
}

export function goalPct(g: Pick<UserGoal, "startValue" | "targetValue" | "currentValue">) {
  const span = g.targetValue - g.startValue;
  if (span === 0) return 100;
  return Math.max(0, Math.min(100, ((g.currentValue - g.startValue) / span) * 100));
}

export async function listGoals(userId: string) {
  const goals = await db.userGoal.findMany({ where: { userId, status: { not: "ARCHIVED" } }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] });
  return goals.map((g) => ({ ...g, pct: goalPct(g) }));
}

export async function createGoal(userId: string, data: z.infer<typeof goalSchema>) {
  const goal = await db.userGoal.create({ data: { ...data, userId, currentValue: data.currentValue ?? data.startValue } });
  await syncGoalsFromData(userId);
  return goal;
}

export async function updateGoal(userId: string, id: string, data: z.infer<typeof goalUpdateSchema>) {
  const g = await db.userGoal.findFirst({ where: { id, userId } });
  if (!g) throw Errors.notFound("Meta");
  if (g.status === "COMPLETED" && data.currentValue !== undefined) throw Errors.badRequest("Meta já concluída.");
  if (data.currentValue !== undefined && g.metric !== "custom") throw Errors.badRequest("Esta meta é atualizada automaticamente pelos seus registros.");
  const updated = await db.userGoal.update({ where: { id }, data });
  await checkGoalCompletion(userId, updated);
  return updated;
}

export async function deleteGoal(userId: string, id: string) {
  const res = await db.userGoal.deleteMany({ where: { id, userId } });
  if (res.count === 0) throw Errors.notFound("Meta");
}

async function checkGoalCompletion(userId: string, g: UserGoal) {
  if (g.status !== "ACTIVE" || !isReached(g)) return;
  const res = await db.userGoal.updateMany({ where: { id: g.id, status: "ACTIVE" }, data: { status: "COMPLETED", completedAt: new Date() } });
  if (res.count !== 1) return;
  await awardXp(userId, 100, "Meta atingida", `goal:${g.id}`);
  await addMilestone(userId, "GOAL_REACHED", `Meta atingida: ${g.title}`, `${g.startValue} → ${g.currentValue} ${g.unit}`, `goal:${g.id}`, { goalId: g.id });
  await notify(userId, { type: "goal", title: "Meta atingida! 🎯", body: g.title, href: "/app/progress" });
  await afterActivity(userId);
}

/** Atualiza metas automáticas com base nos dados persistidos. */
export async function syncGoalsFromData(userId: string) {
  const goals = await db.userGoal.findMany({ where: { userId, status: "ACTIVE", metric: { in: ["weight", "body_fat", "waist", "workouts"] } } });
  if (goals.length === 0) return;
  const latest = await db.bodyMeasurement.findMany({ where: { userId }, orderBy: { measuredAt: "desc" }, take: 30 });
  for (const g of goals) {
    let value: number | null | undefined = null;
    if (g.metric === "weight") value = latest.find((m) => m.weightKg != null)?.weightKg;
    if (g.metric === "body_fat") value = latest.find((m) => m.bodyFatPct != null)?.bodyFatPct;
    if (g.metric === "waist") value = latest.find((m) => m.waistCm != null)?.waistCm;
    if (g.metric === "workouts") value = g.startValue + (await db.workoutSession.count({ where: { userId, status: "COMPLETED", startedAt: { gte: g.createdAt } } }));
    if (value == null || value === g.currentValue) continue;
    const updated = await db.userGoal.update({ where: { id: g.id }, data: { currentValue: value } });
    await checkGoalCompletion(userId, updated);
  }
}
