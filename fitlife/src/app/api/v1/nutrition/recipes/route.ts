import { route, body } from "@/server/http";
import { recipeSchema } from "@/lib/validations/nutrition";
import { createRecipe, listRecipes } from "@/server/services/nutrition";
export const GET = route({ role: "USER" }, async ({ user }) => ({ items: await listRecipes(user.id) }));
export const POST = route({ role: "USER" }, async ({ req, user }) => createRecipe(user.id, await body(req, recipeSchema)));
