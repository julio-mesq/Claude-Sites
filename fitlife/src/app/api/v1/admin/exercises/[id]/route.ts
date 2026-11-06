import { route, body } from "@/server/http";
import { exerciseAdminSchema } from "@/lib/validations/fitness";
import { deleteExercise, upsertExercise } from "@/server/services/admin";
export const PUT = route<{ id: string }>({ role: "ADMIN" }, async ({ req, user, params }) => upsertExercise(user.id, params.id, await body(req, exerciseAdminSchema)));
export const DELETE = route<{ id: string }>({ role: "ADMIN" }, async ({ user, params }) => deleteExercise(user.id, params.id));
