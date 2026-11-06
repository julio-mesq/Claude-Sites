import { route } from "@/server/http";
import { weeklyReview } from "@/server/services/insights";
export const GET = route({ role: "USER" }, async ({ user }) => weeklyReview(user.id));
