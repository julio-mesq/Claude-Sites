import { route } from "@/server/http";
import { deleteEntry } from "@/server/services/nutrition";
export const DELETE = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => {
  await deleteEntry(user.id, params.id);
  return { ok: true };
});
