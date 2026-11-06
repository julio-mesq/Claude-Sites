import { route, body } from "@/server/http";
import { mealEntrySchema } from "@/lib/validations/nutrition";
import { addEntry } from "@/server/services/nutrition";
export const POST = route({ role: "USER", limit: { name: "entries", max: 200, windowSec: 600 } }, async ({ req, user }) => addEntry(user.id, await body(req, mealEntrySchema)));
