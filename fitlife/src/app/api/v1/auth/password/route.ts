import { route, body } from "@/server/http";
import { changePasswordSchema } from "@/lib/validations/auth";
import { changePassword } from "@/server/services/auth";
export const PUT = route({ role: "USER" }, async ({ req, user }) => {
  const d = await body(req, changePasswordSchema);
  await changePassword(user.id, user.sessionId, d.currentPassword, d.password);
  return { ok: true };
});
