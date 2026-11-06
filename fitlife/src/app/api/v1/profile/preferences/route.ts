import { route, body } from "@/server/http";
import { preferencesSchema } from "@/lib/validations/profile";
import { updatePreferences } from "@/server/services/profile";
export const PATCH = route({ role: "USER" }, async ({ req, user }) => {
  await updatePreferences(user.id, await body(req, preferencesSchema));
  return { ok: true };
});
