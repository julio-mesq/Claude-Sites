import { z } from "zod";
import { route, body } from "@/server/http";
import { MUSCLE_GROUPS } from "@/lib/validations/fitness";
import { quickWorkout } from "@/server/services/planner";
const s = z.object({ minutes: z.coerce.number().int().min(10).max(120), focus: z.enum([...MUSCLE_GROUPS, "FULL"] as const), equipment: z.enum(["available", "bodyweight"]) });
export const POST = route({ role: "USER", limit: { name: "quick", max: 60, windowSec: 600 } }, async ({ req, user }) => quickWorkout(user.id, await body(req, s)));
