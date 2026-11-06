import { route, body } from "@/server/http";
import { reportSchema } from "@/lib/validations/tracking";
import { report } from "@/server/services/community";
export const POST = route({ role: "USER" }, async ({ req, user }) => {
  await report(user.id, await body(req, reportSchema));
  return { ok: true };
});
