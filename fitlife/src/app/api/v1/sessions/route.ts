import { route, body } from "@/server/http";
import { startSessionSchema } from "@/lib/validations/fitness";
import { getActiveSession, startSession } from "@/server/services/workouts";
export const GET = route({ role: "USER" }, async ({ user }) => ({ active: await getActiveSession(user.id) }));
export const POST = route({ role: "USER" }, async ({ req, user }) => startSession(user.id, await body(req, startSessionSchema)));
