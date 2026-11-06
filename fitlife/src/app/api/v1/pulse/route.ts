import { route } from "@/server/http";
import { pulse } from "@/server/services/insights";
export const GET = route({ role: "USER" }, async ({ user }) => pulse(user.id));
