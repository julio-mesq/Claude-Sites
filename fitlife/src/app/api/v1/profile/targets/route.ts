import { route } from "@/server/http";
import { recalculateTargets } from "@/server/services/profile";
export const POST = route({ role: "USER" }, async ({ user }) => recalculateTargets(user.id));
