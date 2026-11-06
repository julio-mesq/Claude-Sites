import { route, body } from "@/server/http";
import { upsertMission } from "@/server/services/admin";
import { missionSchema } from "@/lib/validations/fitness";
export const PUT = route<{ id: string }>({ role: "ADMIN" }, async ({ req, user, params }) => upsertMission(user.id, params.id, await body(req, missionSchema)));
