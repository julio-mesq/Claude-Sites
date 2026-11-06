import { z } from "zod";
import { route, body } from "@/server/http";
import { listMealTemplates, saveMealTemplate } from "@/server/services/nutrition";
export const GET = route({ role: "USER" }, async ({ user }) => ({ items: await listMealTemplates(user.id) }));
export const POST = route({ role: "USER" }, async ({ req, user }) => {
  const d = await body(req, z.object({ mealId: z.string().max(40), name: z.string().trim().min(2).max(80) }));
  return saveMealTemplate(user.id, d.mealId, d.name);
});
