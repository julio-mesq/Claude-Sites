import { route, body } from "@/server/http";
import { habitSchema } from "@/lib/validations/tracking";
import { createHabit, listHabits } from "@/server/services/routine";
export const GET = route({ role: "USER" }, async ({ user }) => ({ items: await listHabits(user.id) }));
export const POST = route({ role: "USER" }, async ({ req, user }) => createHabit(user.id, await body(req, habitSchema)));
