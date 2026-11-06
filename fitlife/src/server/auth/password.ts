import "server-only";
import { hash, verify } from "@node-rs/argon2";

// Argon2id com parâmetros recomendados pela OWASP (m=19MiB, t=2, p=1).
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 } as const;

export function hashPassword(password: string) {
  return hash(password, OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string) {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

// Hash fictício usado para equalizar o tempo de resposta quando o e-mail não existe.
let dummy: string | null = null;
export async function dummyVerify(password: string) {
  dummy ??= await hashPassword("fitlife-timing-equalizer");
  await verifyPassword(dummy, password);
}
