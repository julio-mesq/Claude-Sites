import type { Metadata } from "next";
import { requireUser } from "@/server/auth/guard";
import { dispatchDueReminders, listNotifications } from "@/server/services/notifications";
import { NotificationsList } from "./list";

export const metadata: Metadata = { title: "Notificações" };

export default async function NotificationsPage() {
  const user = await requireUser();
  await dispatchDueReminders(user.id);
  const data = await listNotifications(user.id, { take: 50 });
  return <NotificationsList initial={JSON.parse(JSON.stringify(data))} />;
}
