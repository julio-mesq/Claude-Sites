import { route, body } from "@/server/http";
import { listMissionsAdmin, upsertMission } from "@/server/services/admin";
import { missionSchema } from "@/lib/validations/fitness";
export const GET = route({ role: "ADMIN" }, async () => ({ items: await listMissionsAdmin() }));
export const POST = route({ role: "ADMIN" }, async ({ req, user }) => upsertMission(user.id, null, await body(req, missionSchema)));
