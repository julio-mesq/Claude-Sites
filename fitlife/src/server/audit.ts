import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { logger } from "./logger";

export async function audit(action: string, opts: { actorId?: string | null; target?: string; meta?: Prisma.InputJsonValue; ip?: string | null } = {}) {
  try {
    await db.auditLog.create({
      data: { action, actorId: opts.actorId ?? null, target: opts.target, meta: opts.meta, ip: opts.ip ?? null },
    });
  } catch (err) {
    logger.error("audit.write_failed", { action, err });
  }
}
