import { route, body } from "@/server/http";
import { logSetSchema } from "@/lib/validations/fitness";
import { logSet } from "@/server/services/workouts";
export const POST = route<{ id: string }>({ role: "USER", limit: { name: "sets", max: 300, windowSec: 600 } }, async ({ req, user, params }) => logSet(user.id, params.id, await body(req, logSetSchema)));
