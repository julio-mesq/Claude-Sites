import { route, body } from "@/server/http";
import { habitSchema } from "@/lib/validations/tracking";
import { archiveHabit, updateHabit } from "@/server/services/routine";
export const PATCH = route<{ id: string }>({ role: "USER" }, async ({ req, user, params }) => {
  await updateHabit(user.id, params.id, await body(req, habitSchema.partial()));
  return { ok: true };
});
export const DELETE = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => {
  await archiveHabit(user.id, params.id);
  return { ok: true };
});
