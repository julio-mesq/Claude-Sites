import { route, body } from "@/server/http";
import { registerSchema } from "@/lib/validations/auth";
import { register } from "@/server/services/auth";
export const POST = route({ limit: { name: "register", max: 10, windowSec: 3600 } }, async ({ req, ip }) => {
  const data = await body(req, registerSchema);
  await register(data, ip);
  return { ok: true, next: "/onboarding" };
});
