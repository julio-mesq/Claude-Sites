import { route } from "@/server/http";
import { dispatchDueReminders, listNotifications } from "@/server/services/notifications";
export const GET = route({ role: "USER" }, async ({ req, user }) => {
  await dispatchDueReminders(user.id);
  return listNotifications(user.id, { cursor: req.nextUrl.searchParams.get("cursor") ?? undefined });
});
