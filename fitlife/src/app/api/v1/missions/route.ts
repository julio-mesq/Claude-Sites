import { route } from "@/server/http";
import { listMissions } from "@/server/services/routine";
import { refreshMissions } from "@/server/services/gamification";
export const GET = route({ role: "USER" }, async ({ user }) => {
  await refreshMissions(user.id);
  return listMissions(user.id);
});
