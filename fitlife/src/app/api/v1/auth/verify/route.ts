import { z } from "zod";
import { route, body } from "@/server/http";
import { verifyEmail } from "@/server/services/auth";
export const POST = route({ limit: { name: "verify", max: 20, windowSec: 3600 } }, async ({ req }) => {
  const { token } = await body(req, z.object({ token: z.string().min(20).max(200) }));
  return verifyEmail(token);
});
