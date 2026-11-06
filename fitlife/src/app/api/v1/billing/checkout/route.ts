import { z } from "zod";
import { route, body } from "@/server/http";
import { createCheckout } from "@/server/services/billing";
export const POST = route({ role: "USER", limit: { name: "checkout", max: 10, windowSec: 600 } }, async ({ req, user }) => createCheckout(user.id, (await body(req, z.object({ plan: z.enum(["PRO", "ELITE"]) }))).plan));
