import { z } from "zod";
import { route, body } from "@/server/http";
import { getSettings, setSetting } from "@/server/services/admin";
const s = z.object({ key: z.enum(["community.enabled", "signup.enabled", "maintenance.message"]), value: z.union([z.boolean(), z.string().max(300)]) });
export const GET = route({ role: "ADMIN" }, async () => getSettings());
export const PUT = route({ role: "ADMIN" }, async ({ req, user }) => {
  const d = await body(req, s);
  await setSetting(user.id, d.key, d.value);
  return { ok: true };
});
