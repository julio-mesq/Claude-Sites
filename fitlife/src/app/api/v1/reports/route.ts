import { route } from "@/server/http";
import { Errors } from "@/server/errors";
import { PLAN_LIMITS } from "@/server/permissions";
import { getPlan } from "@/server/services/billing";
import { advancedReport } from "@/server/services/insights";
export const GET = route({ role: "USER" }, async ({ user }) => {
  const plan = await getPlan(user.id);
  if (!PLAN_LIMITS[plan].advancedReports) throw Errors.planRequired("Pro");
  return advancedReport(user.id);
});
