import { z } from "zod";
import { route, query } from "@/server/http";
import { dateOnly } from "@/lib/validations/nutrition";
import { getDay } from "@/server/services/nutrition";
import { dateKey } from "@/lib/utils";
export const GET = route({ role: "USER" }, async ({ req, user }) => {
  const { date } = query(req, z.object({ date: dateOnly.optional() }));
  return getDay(user.id, date ?? dateKey());
});
