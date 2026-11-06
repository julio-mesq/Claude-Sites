import { route } from "@/server/http";
import { dashboard } from "@/server/services/insights";
export const GET = route({ role: "USER" }, async ({ user }) => dashboard(user.id));
