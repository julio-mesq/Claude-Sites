import { route, body } from "@/server/http";
import { deleteAccountSchema } from "@/lib/validations/auth";
import { deleteAccount } from "@/server/services/auth";
export const DELETE = route({ role: "USER", limit: { name: "delete-account", max: 5, windowSec: 3600 } }, async ({ req, user }) => {
  const d = await body(req, deleteAccountSchema);
  await deleteAccount(user.id, d.password);
  return { ok: true };
});
