import { route } from "@/server/http";
import { deletePost } from "@/server/services/community";
export const DELETE = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => {
  await deletePost(user.id, params.id);
  return { ok: true };
});
