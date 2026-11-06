import { route, body } from "@/server/http";
import { targetsSchema } from "@/lib/validations/nutrition";
import { setTargets } from "@/server/services/nutrition";
import { dateKey } from "@/lib/utils";
export const PUT = route({ role: "USER" }, async ({ req, user }) => {
  await setTargets(user.id, dateKey(), await body(req, targetsSchema));
  return { ok: true };
});
