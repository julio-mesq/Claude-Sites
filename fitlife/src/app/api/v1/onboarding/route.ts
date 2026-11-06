import { route, body } from "@/server/http";
import { onboardingSchema } from "@/lib/validations/profile";
import { completeOnboarding } from "@/server/services/profile";
export const POST = route({ role: "USER" }, async ({ req, user }) => {
  const d = await body(req, onboardingSchema);
  return completeOnboarding(user.id, d);
});
