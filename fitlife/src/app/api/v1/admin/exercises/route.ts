import { route, body } from "@/server/http";
import { db } from "@/server/db";
import { exerciseAdminSchema } from "@/lib/validations/fitness";
import { upsertExercise } from "@/server/services/admin";
export const GET = route({ role: "ADMIN" }, async () => ({ items: await db.exercise.findMany({ where: { authorId: null }, orderBy: [{ muscleGroup: "asc" }, { name: "asc" }] }) }));
export const POST = route({ role: "ADMIN" }, async ({ req, user }) => upsertExercise(user.id, null, await body(req, exerciseAdminSchema)));
