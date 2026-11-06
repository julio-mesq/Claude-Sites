import { z } from "zod";
import { route, body, query } from "@/server/http";
import { calendarEventSchema } from "@/lib/validations/tracking";
import { createEvent, listEvents } from "@/server/services/routine";
export const GET = route({ role: "USER" }, async ({ req, user }) => {
  const q = query(req, z.object({ from: z.coerce.date(), to: z.coerce.date() }).refine((r) => r.to > r.from && r.to.getTime() - r.from.getTime() <= 45 * 86400_000, "Intervalo inválido (máx. 45 dias)."));
  return listEvents(user.id, q.from, q.to);
});
export const POST = route({ role: "USER" }, async ({ req, user }) => createEvent(user.id, await body(req, calendarEventSchema)));
