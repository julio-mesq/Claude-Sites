import { route } from "@/server/http";
import { toggleLike } from "@/server/services/community";
export const POST = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => toggleLike(user.id, params.id));
