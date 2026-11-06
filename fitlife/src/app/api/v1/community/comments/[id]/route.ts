import { route } from "@/server/http";
import { deleteComment } from "@/server/services/community";
export const DELETE = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => {
  await deleteComment(user.id, params.id);
  return { ok: true };
});
