import { z } from "zod";
import { route, body } from "@/server/http";
import { deleteEvent, updateEvent } from "@/server/services/routine";
const patch = z.object({
  title: z.string().trim().min(2).max(100).optional(),
  type: z.enum(["WORKOUT", "REST", "GOAL", "REMINDER", "APPOINTMENT"]).optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().nullable().optional(),
  allDay: z.boolean().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  remindMinutesBefore: z.coerce.number().int().min(0).max(10080).nullable().optional(),
  completed: z.boolean().optional(),
});
export const PATCH = route<{ id: string }>({ role: "USER" }, async ({ req, user, params }) => updateEvent(user.id, params.id, await body(req, patch)));
export const DELETE = route<{ id: string }>({ role: "USER" }, async ({ user, params }) => {
  await deleteEvent(user.id, params.id);
  return { ok: true };
});
