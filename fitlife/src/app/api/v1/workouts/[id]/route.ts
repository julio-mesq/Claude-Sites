import { route, body } from "@/server/http";
import { workoutSchema } from "@/lib/validations/fitness";
import { deleteWorkout, getWorkout, updateWorkout } from "@/server/services/workouts";
export const GET = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => getWorkout(user.id, params.id));
export const PUT = route<{ id: string }>({ role: "USER" }, async ({ req, user, params }) => updateWorkout(user.id, params.id, await body(req, workoutSchema)));
export const DELETE = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => {
  await deleteWorkout(user.id, params.id);
  return { ok: true };
});
