import { route, body } from "@/server/http";
import { habitToggleSchema } from "@/lib/validations/tracking";
import { toggleHabit } from "@/server/services/routine";
export const POST = route<{ id: string }>({ role: "USER", limit: { name: "habit-toggle", max: 200, windowSec: 600 } }, async ({ req, user, params }) => {
  const d = await body(req, habitToggleSchema);
  return toggleHabit(user.id, params.id, d.date);
});
