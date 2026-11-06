import { route, body } from "@/server/http";
import { profileUpdateSchema } from "@/lib/validations/profile";
import { getProfileBundle, updateProfile } from "@/server/services/profile";
export const GET = route({ role: "USER" }, async ({ user }) => getProfileBundle(user.id));
export const PATCH = route({ role: "USER" }, async ({ req, user }) => {
  await updateProfile(user.id, await body(req, profileUpdateSchema));
  return { ok: true };
});
