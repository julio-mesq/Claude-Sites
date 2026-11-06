import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "../db";
import { env } from "../env";
import { Errors } from "../errors";
import { audit } from "../audit";
import { logger } from "../logger";
import { dummyVerify, hashPassword, verifyPassword } from "../auth/password";
import { createSession, destroyCurrentSession } from "../auth/session";
import { consumeToken, issueToken } from "../auth/tokens";
import { resetEmail, sendMail, verificationEmail } from "../mail";
import { rateLimit } from "../rate-limit";
import { appSettings } from "./app-settings";

export async function register(input: { name: string; email: string; password: string }, ip: string | null) {
  if (!(await appSettings()).signupEnabled) throw Errors.forbidden("Novos cadastros estão temporariamente pausados.");
  await rateLimit(`register:${ip ?? "unknown"}`, 5, 3600);
  const exists = await db.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (exists) throw Errors.conflict("Já existe uma conta com este e-mail.");
  const passwordHash = await hashPassword(input.password);
  const now = new Date();
  let user;
  try {
    user = await db.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
        preferences: { create: {} },
        profile: { create: {} },
        subscription: { create: { plan: "FREE", status: "ACTIVE" } },
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") throw Errors.conflict("Já existe uma conta com este e-mail.");
    throw err;
  }
  await createSession(user.id);
  await sendVerification(user.id);
  await audit("auth.register", { actorId: user.id, ip });
  return { id: user.id };
}

export async function sendVerification(userId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.emailVerifiedAt) return { alreadyVerified: true, delivered: false };
  await rateLimit(`verify-mail:${userId}`, 3, 3600);
  const token = await issueToken(userId, "EMAIL_VERIFY");
  const link = `${env.APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
  const { delivered } = await sendMail({ to: user.email, ...verificationEmail(user.name.split(" ")[0]!, link) });
  return { alreadyVerified: false, delivered };
}

export async function verifyEmail(token: string) {
  const userId = await consumeToken(token, "EMAIL_VERIFY");
  if (!userId) throw Errors.badRequest("Link de confirmação inválido ou expirado.");
  await db.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  await audit("auth.email_verified", { actorId: userId });
  return { ok: true };
}

export async function login(input: { email: string; password: string }, ip: string | null) {
  await rateLimit(`login-ip:${ip ?? "unknown"}`, 20, 900);
  await rateLimit(`login-email:${input.email}`, 8, 900);
  const user = await db.user.findUnique({ where: { email: input.email } });
  if (!user) {
    await dummyVerify(input.password);
    throw Errors.badRequest("E-mail ou senha incorretos.");
  }
  const ok = await verifyPassword(user.passwordHash, input.password);
  if (!ok) {
    await audit("auth.login_failed", { actorId: user.id, ip });
    throw Errors.badRequest("E-mail ou senha incorretos.");
  }
  if (user.status !== "ACTIVE") throw Errors.forbidden("Esta conta está suspensa. Entre em contato com o suporte.");
  await createSession(user.id);
  await db.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
  await audit("auth.login", { actorId: user.id, ip });
  return { onboarded: !!user.onboardedAt, role: user.role };
}

export async function logout(userId?: string) {
  await destroyCurrentSession();
  if (userId) await audit("auth.logout", { actorId: userId });
}

/** Sempre responde igual, exista ou não a conta (evita enumeração de e-mails). */
export async function forgotPassword(email: string, ip: string | null) {
  await rateLimit(`forgot-ip:${ip ?? "unknown"}`, 10, 3600);
  await rateLimit(`forgot-email:${email}`, 3, 3600);
  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.status !== "ACTIVE") return;
  const token = await issueToken(user.id, "PASSWORD_RESET");
  const link = `${env.APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
  await sendMail({ to: user.email, ...resetEmail(user.name.split(" ")[0]!, link) }).catch((err) => logger.error("mail.reset_failed", { err }));
  await audit("auth.password_reset_requested", { actorId: user.id, ip });
}

export async function resetPassword(token: string, password: string, ip: string | null) {
  await rateLimit(`reset-ip:${ip ?? "unknown"}`, 10, 3600);
  const userId = await consumeToken(token, "PASSWORD_RESET");
  if (!userId) throw Errors.badRequest("Link de redefinição inválido ou expirado. Solicite um novo.");
  await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(password), emailVerifiedAt: new Date() } });
  // Encerra todas as sessões existentes após a redefinição.
  await db.session.deleteMany({ where: { userId } });
  await audit("auth.password_reset", { actorId: userId, ip });
}

export async function changePassword(userId: string, currentSessionId: string, current: string, next: string) {
  await rateLimit(`change-pw:${userId}`, 5, 900);
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await verifyPassword(user.passwordHash, current))) throw Errors.badRequest("Senha atual incorreta.");
  await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(next) } });
  await db.session.deleteMany({ where: { userId, id: { not: currentSessionId } } });
  await audit("auth.password_changed", { actorId: userId });
}

export async function listSessions(userId: string, currentSessionId: string) {
  const sessions = await db.session.findMany({ where: { userId, expiresAt: { gt: new Date() } }, orderBy: { lastSeenAt: "desc" } });
  return sessions.map((s) => ({ id: s.id, userAgent: s.userAgent, ip: s.ip, createdAt: s.createdAt, lastSeenAt: s.lastSeenAt, current: s.id === currentSessionId }));
}

export async function revokeSession(userId: string, sessionId: string) {
  const res = await db.session.deleteMany({ where: { id: sessionId, userId } });
  if (res.count === 0) throw Errors.notFound("Sessão");
  await audit("auth.session_revoked", { actorId: userId, target: sessionId });
}

export async function deleteAccount(userId: string, password: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await verifyPassword(user.passwordHash, password))) throw Errors.badRequest("Senha incorreta.");
  if (user.role === "ADMIN") {
    const admins = await db.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) throw Errors.badRequest("Você é o único administrador. Promova outro administrador antes de excluir a conta.");
  }
  const photos = await db.progressPhoto.findMany({ where: { userId }, select: { storagePath: true } });
  await audit("account.deleted", { actorId: null, target: userId, meta: { emailDomain: user.email.split("@")[1] ?? "" } });
  // Exclusão em cascata remove todos os dados pessoais (LGPD art. 18, VI).
  await db.user.delete({ where: { id: userId } });
  const { deleteStoredFile } = await import("../storage");
  await Promise.all(photos.map((p) => deleteStoredFile(p.storagePath)));
  await destroyCurrentSession();
}
