import { route, body } from "@/server/http";
import { goalSchema } from "@/lib/validations/tracking";
import { createGoal, listGoals } from "@/server/services/progress";
export const GET = route({ role: "USER" }, async ({ user }) => ({ items: await listGoals(user.id) }));
export const POST = route({ role: "USER" }, async ({ req, user }) => createGoal(user.id, await body(req, goalSchema)));
