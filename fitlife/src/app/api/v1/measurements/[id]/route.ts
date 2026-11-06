import { route } from "@/server/http";
import { deleteMeasurement } from "@/server/services/progress";
export const DELETE = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => {
  await deleteMeasurement(user.id, params.id);
  return { ok: true };
});
