import { route, body } from "@/server/http";
import { recoverySchema } from "@/lib/validations/tracking";
import { recoveryOverview, upsertRecovery } from "@/server/services/routine";
export const GET = route({ role: "USER" }, async ({ user }) => recoveryOverview(user.id));
export const POST = route({ role: "USER" }, async ({ req, user }) => upsertRecovery(user.id, await body(req, recoverySchema)));
