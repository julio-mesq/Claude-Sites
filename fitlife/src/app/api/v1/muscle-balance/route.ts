import { route } from "@/server/http";
import { muscleBalance } from "@/server/services/insights";
export const GET = route({ role: "USER" }, async ({ user }) => muscleBalance(user.id));
