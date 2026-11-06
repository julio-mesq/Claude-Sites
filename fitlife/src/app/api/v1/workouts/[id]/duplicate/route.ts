import { route } from "@/server/http";
import { duplicateWorkout } from "@/server/services/workouts";
export const POST = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => duplicateWorkout(user.id, params.id));
