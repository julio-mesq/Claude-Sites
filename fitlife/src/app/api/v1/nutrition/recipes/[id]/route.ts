import { route } from "@/server/http";
import { addRecipeToShopping, deleteRecipe } from "@/server/services/nutrition";
export const POST = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => addRecipeToShopping(user.id, params.id));
export const DELETE = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => {
  await deleteRecipe(user.id, params.id);
  return { ok: true };
});
