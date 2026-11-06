import { route } from "@/server/http";
import { listRecords } from "@/server/services/workouts";
export const GET = route({ role: "USER" }, async ({ user }) => ({ items: await listRecords(user.id) }));
