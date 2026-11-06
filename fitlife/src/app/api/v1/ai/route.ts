import { route } from "@/server/http";
import { aiHistory, aiStatus, clearAiHistory } from "@/server/ai/service";
export const GET = route({ role: "USER" }, async ({ user }) => ({ status: await aiStatus(user.id), messages: await aiHistory(user.id) }));
export const DELETE = route({ role: "USER" }, async ({ user }) => {
  await clearAiHistory(user.id);
  return { ok: true };
});
