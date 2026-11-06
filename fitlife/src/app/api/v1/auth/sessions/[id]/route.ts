import { route } from "@/server/http";
import { revokeSession } from "@/server/services/auth";
export const DELETE = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => {
  await revokeSession(user.id, params.id);
  return { ok: true };
});
