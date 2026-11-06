import { route } from "@/server/http";
import { getExercise } from "@/server/services/workouts";
export const GET = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => getExercise(user.id, params.id));
