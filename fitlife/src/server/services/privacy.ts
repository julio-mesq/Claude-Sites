import "server-only";
import { db } from "../db";
import { audit } from "../audit";
import { rateLimit } from "../rate-limit";

/** Exportação completa dos dados pessoais em JSON (portabilidade — LGPD art. 18, V). */
export async function exportUserData(userId: string) {
  await rateLimit(`export:${userId}`, 5, 3600);
  const data = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, role: true, createdAt: true, emailVerifiedAt: true, xp: true, level: true, termsAcceptedAt: true, privacyAcceptedAt: true,
      profile: true, preferences: true, subscription: true, payments: true,
      workouts: { include: { exercises: true } },
      workoutSessions: { include: { sets: true } },
      personalRecords: true,
      meals: { include: { entries: true } },
      foodItems: true, waterLogs: true, nutritionTargets: true, recipes: true, shoppingItems: true,
      measurements: true,
      photos: { select: { id: true, pose: true, takenAt: true, notes: true, mimeType: true, sizeBytes: true, createdAt: true } },
      goals: true, habits: { include: { logs: true } }, events: true, recoveryLogs: true,
      achievements: { include: { achievement: { select: { code: true, name: true } } } },
      missionProgress: { include: { mission: { select: { code: true, name: true } } } },
      xpEvents: true, journey: true, notifications: true, aiMessages: true,
      posts: true, comments: true, reactions: true,
      sessions: { select: { id: true, createdAt: true, lastSeenAt: true, userAgent: true, ip: true } },
    },
  });
  await audit("privacy.data_exported", { actorId: userId });
  return { exportedAt: new Date().toISOString(), format: "fitlife-export-v1", note: "Fotos de evolução podem ser baixadas individualmente na área Evolução.", data };
}
