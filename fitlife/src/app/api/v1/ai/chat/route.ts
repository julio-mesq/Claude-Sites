import { route, body } from "@/server/http";
import { aiMessageSchema } from "@/lib/validations/tracking";
import { askAi } from "@/server/ai/service";
export const POST = route({ role: "USER", limit: { name: "ai", max: 20, windowSec: 60 } }, async ({ req, user }) => {
  const { message } = await body(req, aiMessageSchema);
  const stream = await askAi(user.id, message);
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-Accel-Buffering": "no" } });
});
