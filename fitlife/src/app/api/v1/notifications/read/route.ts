import { z } from "zod";
import { route, body } from "@/server/http";
import { markRead } from "@/server/services/notifications";
export const POST = route({ role: "USER" }, async ({ req, user }) => {
  const d = await body(req, z.object({ ids: z.union([z.literal("all"), z.array(z.string().max(40)).max(100)]) }));
  await markRead(user.id, d.ids);
  return { ok: true };
});
