import { route, body } from "@/server/http";
import { shoppingItemSchema } from "@/lib/validations/nutrition";
import { addShopping, deleteShopping, listShopping } from "@/server/services/nutrition";
export const GET = route({ role: "USER" }, async ({ user }) => ({ items: await listShopping(user.id) }));
export const POST = route({ role: "USER" }, async ({ req, user }) => addShopping(user.id, await body(req, shoppingItemSchema)));
export const DELETE = route({ role: "USER" }, async ({ user }) => {
  await deleteShopping(user.id, "checked");
  return { ok: true };
});
