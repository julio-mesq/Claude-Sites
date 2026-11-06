import { route } from "@/server/http";
import { deleteShopping, toggleShopping } from "@/server/services/nutrition";
export const PATCH = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => toggleShopping(user.id, params.id));
export const DELETE = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => {
  await deleteShopping(user.id, params.id);
  return { ok: true };
});
