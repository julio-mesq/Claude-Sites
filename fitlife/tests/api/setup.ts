import { db } from "./client";

// Limpa contadores de rate limit e usuários de testes anteriores.
export default async function setup() {
  await db.rateLimit.deleteMany({});
  await db.user.deleteMany({ where: { email: { endsWith: "@fitlife.test" } } });
  await db.$disconnect();
}
