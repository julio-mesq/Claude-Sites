import { z } from "zod";
import { route, body } from "@/server/http";
import { dateOnly } from "@/lib/validations/nutrition";
import { copyDay } from "@/server/services/nutrition";
export const POST = route({ role: "USER" }, async ({ req, user }) => {
  const d = await body(req, z.object({ from: dateOnly, to: dateOnly }));
  return copyDay(user.id, d.from, d.to);
});
