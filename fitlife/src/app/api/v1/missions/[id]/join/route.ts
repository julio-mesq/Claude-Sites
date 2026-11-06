import { route } from "@/server/http";
import { joinMission } from "@/server/services/routine";
import { refreshMissions } from "@/server/services/gamification";
export const POST = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => {
  const mp = await joinMission(user.id, params.id);
  await refreshMissions(user.id);
  return mp;
});
