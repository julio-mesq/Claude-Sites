import { route } from "@/server/http";
import { listSessions } from "@/server/services/auth";
export const GET = route({ role: "USER" }, async ({ user }) => ({ items: await listSessions(user.id, user.sessionId) }));
