import { route } from "@/server/http";
import { leaderboard } from "@/server/services/insights";
export const GET = route({ role: "USER" }, async ({ user }) => ({ items: await leaderboard(user.id) }));
