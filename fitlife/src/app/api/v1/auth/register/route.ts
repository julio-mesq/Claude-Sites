import { route, body } from "@/server/http";
import { registerSchema } from "@/lib/validations/auth";
import { register } from "@/server/services/auth";
// O limite de cadastros por IP é aplicado uma única vez, no serviço de autenticação.
export const POST = route({}, async ({ req, ip }) => {
  const data = await body(req, registerSchema);
  await register(data, ip);
  return { ok: true, next: "/onboarding" };
});
