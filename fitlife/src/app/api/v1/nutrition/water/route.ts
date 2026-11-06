import { route, body } from "@/server/http";
import { waterSchema } from "@/lib/validations/nutrition";
import { addWater } from "@/server/services/nutrition";
export const POST = route({ role: "USER", limit: { name: "water", max: 120, windowSec: 600 } }, async ({ req, user }) => {
  const d = await body(req, waterSchema);
  return addWater(user.id, d.date, d.amountMl);
});
