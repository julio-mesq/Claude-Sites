import { z } from "zod";
import { route, body, query } from "@/server/http";
import { foodItemSchema } from "@/lib/validations/nutrition";
import { createFood, recentFoods, searchFoods } from "@/server/services/nutrition";
import { externalFoodEnabled, searchExternalFoods } from "@/server/services/food-db";
export const GET = route({ role: "USER" }, async ({ req, user }) => {
  const { q, favorites } = query(req, z.object({ q: z.string().max(60).default(""), favorites: z.enum(["1", "0"]).optional() }));
  const [items, recent, external] = await Promise.all([
    searchFoods(user.id, q, favorites === "1"),
    q ? Promise.resolve([]) : recentFoods(user.id),
    q.length >= 3 ? searchExternalFoods(q) : Promise.resolve([]),
  ]);
  return { items, recent, external, externalEnabled: externalFoodEnabled };
});
export const POST = route({ role: "USER" }, async ({ req, user }) => createFood(user.id, await body(req, foodItemSchema)));
