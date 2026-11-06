import { z } from "zod";
import { route, query } from "@/server/http";
import { history } from "@/server/services/nutrition";
import { dateKey } from "@/lib/utils";
export const GET = route({ role: "USER" }, async ({ req, user }) => {
  const { days } = query(req, z.object({ days: z.coerce.number().int().min(7).max(90).default(14) }));
  return { items: await history(user.id, days, dateKey()) };
});
