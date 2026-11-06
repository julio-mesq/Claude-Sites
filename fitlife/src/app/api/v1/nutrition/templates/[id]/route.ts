import { z } from "zod";
import { route, body } from "@/server/http";
import { dateOnly, MEAL_TYPES } from "@/lib/validations/nutrition";
import { applyMealTemplate, deleteMealTemplate } from "@/server/services/nutrition";
export const POST = route<{ id: string }>({ role: "USER" }, async ({ req, user, params }) => {
  const d = await body(req, z.object({ date: dateOnly, mealType: z.enum(MEAL_TYPES) }));
  await applyMealTemplate(user.id, params.id, d.date, d.mealType);
  return { ok: true };
});
export const DELETE = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => {
  await deleteMealTemplate(user.id, params.id);
  return { ok: true };
});
