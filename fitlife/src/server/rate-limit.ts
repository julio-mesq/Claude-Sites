import "server-only";
import { db } from "./db";
import { Errors } from "./errors";

/**
 * Rate limiting com janela fixa persistido no PostgreSQL (funciona com múltiplas instâncias).
 * Para tráfego muito alto, troque por Redis mantendo a mesma interface.
 */
export async function rateLimit(key: string, limit: number, windowSec: number) {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSec * 1000);
  const rows = await db.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO rate_limits (key, count, "resetAt") VALUES (${key}, 1, ${resetAt})
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits."resetAt" < ${now} THEN 1 ELSE rate_limits.count + 1 END,
      "resetAt" = CASE WHEN rate_limits."resetAt" < ${now} THEN ${resetAt} ELSE rate_limits."resetAt" END
    RETURNING count, "resetAt"`;
  const row = rows[0];
  if (row && row.count > limit) {
    throw Errors.rateLimited(Math.max(1, Math.ceil((row.resetAt.getTime() - now.getTime()) / 1000)));
  }
}

export async function cleanupRateLimits() {
  await db.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } });
}
