import { z } from "zod";
import { route, body } from "@/server/http";
import { updateUser } from "@/server/services/admin";
const s = z.object({ role: z.enum(["USER", "PROFESSIONAL", "MODERATOR", "ADMIN"]).optional(), status: z.enum(["ACTIVE", "SUSPENDED"]).optional(), plan: z.enum(["FREE", "PRO", "ELITE"]).optional() });
export const PATCH = route<{ id: string }>({ role: "ADMIN" }, async ({ req, user, params }) => {
  await updateUser(user.id, params.id, await body(req, s));
  return { ok: true };
});
