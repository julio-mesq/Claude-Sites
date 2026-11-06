import { route, body } from "@/server/http";
import { loginSchema } from "@/lib/validations/auth";
import { login } from "@/server/services/auth";
export const POST = route({}, async ({ req, ip }) => {
  const data = await body(req, loginSchema);
  const r = await login(data, ip);
  return { ok: true, next: r.onboarded ? "/app" : "/onboarding" };
});
