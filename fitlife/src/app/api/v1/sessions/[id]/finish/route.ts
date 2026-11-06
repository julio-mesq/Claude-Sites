import { route, body } from "@/server/http";
import { finishSessionSchema } from "@/lib/validations/fitness";
import { finishSession } from "@/server/services/workouts";
export const POST = route<{ id: string }>({ role: "USER" }, async ({ req, user, params }) => finishSession(user.id, params.id, await body(req, finishSessionSchema)));
