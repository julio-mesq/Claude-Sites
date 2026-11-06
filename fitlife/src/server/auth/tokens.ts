import "server-only";
import type { TokenType } from "@prisma/client";
import { db } from "../db";
import { randomToken, sha256 } from "./crypto";

const TTL_MIN: Record<TokenType, number> = { EMAIL_VERIFY: 60 * 24, PASSWORD_RESET: 30 };

export async function issueToken(userId: string, type: TokenType) {
  // Invalida tokens anteriores do mesmo tipo.
  await db.verificationToken.deleteMany({ where: { userId, type, usedAt: null } });
  const token = randomToken();
  await db.verificationToken.create({
    data: { userId, type, tokenHash: sha256(token), expiresAt: new Date(Date.now() + TTL_MIN[type] * 60_000) },
  });
  return token;
}

/** Consome um token de uso único. Retorna o userId se válido. */
export async function consumeToken(token: string, type: TokenType) {
  const record = await db.verificationToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (!record || record.type !== type || record.usedAt || record.expiresAt < new Date()) return null;
  const updated = await db.verificationToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  return updated.count === 1 ? record.userId : null;
}
