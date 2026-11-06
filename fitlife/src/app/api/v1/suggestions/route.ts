import { z } from "zod";
import { route, body } from "@/server/http";
import { MUSCLE_GROUPS } from "@/lib/validations/fitness";
import { loadSuggestions } from "@/server/services/insights";
const s = z.object({ items: z.array(z.object({ exerciseId: z.string().max(40), reps: z.string().max(20), muscleGroup: z.enum(MUSCLE_GROUPS), loadKg: z.number().nullable() })).max(40) });
export const POST = route({ role: "USER" }, async ({ req, user }) => loadSuggestions(user.id, (await body(req, s)).items));
