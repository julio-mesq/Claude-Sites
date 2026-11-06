import { route } from "@/server/http";
import { abandonMission } from "@/server/services/routine";
export const DELETE = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => {
  await abandonMission(user.id, params.id);
  return { ok: true };
});
