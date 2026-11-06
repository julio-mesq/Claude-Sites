import { z } from "zod";
import { route, body } from "@/server/http";
import { resolveReport } from "@/server/services/admin";
export const POST = route<{ id: string }>({ role: "MODERATOR" }, async ({ req, user, params }) => {
  await resolveReport(user.id, params.id, (await body(req, z.object({ action: z.enum(["hide", "dismiss", "restore"]) }))).action);
  return { ok: true };
});
