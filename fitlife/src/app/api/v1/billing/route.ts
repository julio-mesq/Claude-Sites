import { route } from "@/server/http";
import { getBilling, PLANS } from "@/server/services/billing";
export const GET = route({ role: "USER" }, async ({ user }) => ({ ...(await getBilling(user.id)), plans: PLANS }));
