import { route } from "@/server/http";
import { toggleFollow } from "@/server/services/community";
export const POST = route<{ id: string }>({ role: "USER", limit: { name: "follow", max: 60, windowSec: 600 } }, async ({ user, params }) => toggleFollow(user.id, params.id));
