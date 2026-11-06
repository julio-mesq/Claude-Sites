import { route } from "@/server/http";
import { getSession } from "@/server/services/workouts";
export const GET = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => getSession(user.id, params.id));
