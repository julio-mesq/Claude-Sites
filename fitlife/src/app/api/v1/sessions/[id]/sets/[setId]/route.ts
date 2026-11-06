import { route } from "@/server/http";
import { deleteSet } from "@/server/services/workouts";
export const DELETE = route<{ id: string; setId: string }>({ role: "USER" }, async ({ user, params }) => {
  await deleteSet(user.id, params.id, params.setId);
  return { ok: true };
});
