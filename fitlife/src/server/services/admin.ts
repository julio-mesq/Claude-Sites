import "server-only";
import type { Plan, Prisma, Role, UserStatus } from "@prisma/client";
import type { z } from "zod";
import { db } from "../db";
import { Errors } from "../errors";
import { audit } from "../audit";
import type { exerciseAdminSchema } from "@/lib/validations/fitness";
import { addDaysKey, dateKey, zonedStartOfDay } from "@/lib/utils";

export async function overview() {
  const today = dateKey();
  const d30 = zonedStartOfDay(addDaysKey(today, -29));
  const d7 = zonedStartOfDay(addDaysKey(today, -6));
  const [users, new7, active7, workouts30, openReports, subs, signups] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: d7 } } }),
    db.user.count({ where: { lastActiveAt: { gte: d7 } } }),
    db.workoutSession.count({ where: { status: "COMPLETED", startedAt: { gte: d30 } } }),
    db.report.count({ where: { status: "OPEN" } }),
    db.subscription.groupBy({ by: ["plan"], _count: true, where: { status: { in: ["ACTIVE", "TRIALING"] } } }),
    db.$queryRaw<{ d: string; n: bigint }[]>`SELECT to_char(("createdAt" AT TIME ZONE 'America/Sao_Paulo')::date, 'YYYY-MM-DD') AS d, COUNT(*) AS n FROM users WHERE "createdAt" >= ${d30} GROUP BY 1 ORDER BY 1`,
  ]);
  const map = new Map(signups.map((s) => [s.d, Number(s.n)]));
  return {
    users,
    new7,
    active7,
    workouts30,
    openReports,
    plans: Object.fromEntries(subs.map((s) => [s.plan, s._count])) as Partial<Record<Plan, number>>,
    signups: Array.from({ length: 30 }, (_, i) => {
      const k = addDaysKey(today, -29 + i);
      return { date: k, count: map.get(k) ?? 0 };
    }),
  };
}

export async function listUsers(q?: string, page = 1) {
  const where: Prisma.UserWhereInput = q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] } : {};
  const take = 25;
  const [items, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, lastActiveAt: true, level: true, emailVerifiedAt: true, subscription: { select: { plan: true, status: true } }, _count: { select: { workoutSessions: true } } },
    }),
    db.user.count({ where }),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / take)) };
}

export async function updateUser(actorId: string, userId: string, data: { role?: Role; status?: UserStatus; plan?: Plan }) {
  if (actorId === userId && (data.role || data.status)) throw Errors.badRequest("Você não pode alterar o próprio papel ou status.");
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) throw Errors.notFound("Usuário");
  if (target.role === "ADMIN" && data.role && data.role !== "ADMIN") {
    const admins = await db.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) throw Errors.badRequest("É necessário manter pelo menos um administrador.");
  }
  if (data.role || data.status) await db.user.update({ where: { id: userId }, data: { ...(data.role ? { role: data.role } : {}), ...(data.status ? { status: data.status } : {}) } });
  if (data.status === "SUSPENDED") await db.session.deleteMany({ where: { userId } });
  if (data.plan) {
    // Concessão manual (cortesia/suporte). Não registra pagamento — apenas o plano, com auditoria.
    await db.subscription.upsert({ where: { userId }, create: { userId, plan: data.plan, status: "ACTIVE", provider: "manual" }, update: { plan: data.plan, status: "ACTIVE", provider: "manual", currentPeriodEnd: null } });
  }
  await audit("admin.user_updated", { actorId, target: userId, meta: data });
}

export async function listReports(status: "OPEN" | "RESOLVED" | "DISMISSED" = "OPEN") {
  return db.report.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      reporter: { select: { name: true, email: true } },
      post: { select: { id: true, content: true, hiddenAt: true, author: { select: { id: true, name: true, email: true } } } },
      comment: { select: { id: true, content: true, hiddenAt: true, author: { select: { id: true, name: true, email: true } } } },
    },
  });
}

export async function resolveReport(actorId: string, reportId: string, action: "hide" | "dismiss" | "restore") {
  const r = await db.report.findUnique({ where: { id: reportId } });
  if (!r) throw Errors.notFound("Denúncia");
  if (action === "hide") {
    if (r.postId) await db.communityPost.update({ where: { id: r.postId }, data: { hiddenAt: new Date(), hiddenReason: `Moderação: ${r.reason}` } });
    if (r.commentId) await db.comment.update({ where: { id: r.commentId }, data: { hiddenAt: new Date() } });
  }
  if (action === "restore" || action === "dismiss") {
    if (r.postId) await db.communityPost.update({ where: { id: r.postId }, data: { hiddenAt: null, hiddenReason: null } });
    if (r.commentId) await db.comment.update({ where: { id: r.commentId }, data: { hiddenAt: null } });
  }
  const status = action === "hide" ? "RESOLVED" : "DISMISSED";
  await db.report.updateMany({ where: { OR: [{ id: reportId }, ...(r.postId ? [{ postId: r.postId, status: "OPEN" as const }] : []), ...(r.commentId ? [{ commentId: r.commentId, status: "OPEN" as const }] : [])] }, data: { status, resolvedAt: new Date(), resolvedById: actorId } });
  await audit("moderation.report_" + action, { actorId, target: reportId });
}

export async function listAudit(opts: { action?: string; page?: number }) {
  const take = 50;
  const page = opts.page ?? 1;
  const where: Prisma.AuditLogWhereInput = opts.action ? { action: { startsWith: opts.action } } : {};
  const [items, total] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * take, take, include: { actor: { select: { email: true } } } }),
    db.auditLog.count({ where }),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / take)) };
}

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);

export async function upsertExercise(actorId: string, id: string | null, data: z.infer<typeof exerciseAdminSchema>) {
  if (id) {
    const ex = await db.exercise.update({ where: { id }, data });
    await audit("admin.exercise_updated", { actorId, target: id });
    return ex;
  }
  let slug = slugify(data.name);
  if (await db.exercise.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
  const ex = await db.exercise.create({ data: { ...data, slug } });
  await audit("admin.exercise_created", { actorId, target: ex.id });
  return ex;
}

export async function deleteExercise(actorId: string, id: string) {
  const used = await db.workoutSet.count({ where: { exerciseId: id } }) + (await db.workoutExercise.count({ where: { exerciseId: id } }));
  if (used > 0) {
    await db.exercise.update({ where: { id }, data: { isPublished: false } });
    await audit("admin.exercise_unpublished", { actorId, target: id });
    return { unpublished: true };
  }
  await db.exercise.delete({ where: { id } });
  await audit("admin.exercise_deleted", { actorId, target: id });
  return { deleted: true };
}

export async function listMissionsAdmin() {
  return db.mission.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { progress: true } } } });
}

export async function upsertMission(actorId: string, id: string | null, data: Prisma.MissionCreateInput) {
  const m = id ? await db.mission.update({ where: { id }, data }) : await db.mission.create({ data });
  await audit(id ? "admin.mission_updated" : "admin.mission_created", { actorId, target: m.id });
  return m;
}

export async function getSettings() {
  const rows = await db.appSetting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function setSetting(actorId: string, key: string, value: Prisma.InputJsonValue) {
  await db.appSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
  await audit("admin.setting_updated", { actorId, target: key, meta: { value } });
}
