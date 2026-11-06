import { route } from "@/server/http";
import { publicProfile } from "@/server/services/community";
export const GET = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => publicProfile(user.id, params.id));
