import { route } from "@/server/http";
import { block, unblock } from "@/server/services/community";
export const POST = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => {
  await block(user.id, params.id);
  return { ok: true };
});
export const DELETE = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => {
  await unblock(user.id, params.id);
  return { ok: true };
});
