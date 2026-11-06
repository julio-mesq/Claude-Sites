import { route, body } from "@/server/http";
import { goalUpdateSchema } from "@/lib/validations/tracking";
import { deleteGoal, updateGoal } from "@/server/services/progress";
export const PATCH = route<{ id: string }>({ role: "USER" }, async ({ req, user, params }) => updateGoal(user.id, params.id, await body(req, goalUpdateSchema)));
export const DELETE = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => {
  await deleteGoal(user.id, params.id);
  return { ok: true };
});
