import { z } from "zod";
import { route, query } from "@/server/http";
import { MUSCLE_GROUPS } from "@/lib/validations/fitness";
import { listExercises } from "@/server/services/workouts";
const q = z.object({ q: z.string().max(60).optional(), group: z.enum(MUSCLE_GROUPS).optional(), difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(), equipment: z.string().max(40).optional() });
export const GET = route({ role: "USER" }, async ({ req, user }) => ({ items: await listExercises(user.id, query(req, q)) }));
