import { route, body } from "@/server/http";
import { workoutSchema } from "@/lib/validations/fitness";
import { createWorkout, listWorkouts } from "@/server/services/workouts";
export const GET = route({ role: "USER" }, async ({ user }) => ({ items: await listWorkouts(user.id) }));
export const POST = route({ role: "USER" }, async ({ req, user }) => createWorkout(user.id, await body(req, workoutSchema)));
