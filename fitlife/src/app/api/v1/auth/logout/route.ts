import { route } from "@/server/http";
import { logout } from "@/server/services/auth";
export const POST = route({}, async ({ user }) => {
  await logout(user?.id);
  return { ok: true };
});
