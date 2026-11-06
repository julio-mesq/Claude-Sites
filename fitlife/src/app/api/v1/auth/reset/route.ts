import { route, body } from "@/server/http";
import { resetSchema } from "@/lib/validations/auth";
import { resetPassword } from "@/server/services/auth";
export const POST = route({}, async ({ req, ip }) => {
  const d = await body(req, resetSchema);
  await resetPassword(d.token, d.password, ip);
  return { ok: true };
});
