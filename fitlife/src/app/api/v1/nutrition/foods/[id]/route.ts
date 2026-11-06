import { route } from "@/server/http";
import { deleteFood, toggleFavorite } from "@/server/services/nutrition";
export const PATCH = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => toggleFavorite(user.id, params.id));
export const DELETE = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => {
  await deleteFood(user.id, params.id);
  return { ok: true };
});
