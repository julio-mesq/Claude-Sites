import "server-only";
import { db } from "../db";

export async function notify(userId: string, n: { type: string; title: string; body: string; href?: string }) {
  return db.notification.create({ data: { userId, ...n } });
}

export async function listNotifications(userId: string, opts: { cursor?: string; take?: number } = {}) {
  const take = Math.min(opts.take ?? 20, 50);
  const items = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
  });
  const unread = await db.notification.count({ where: { userId, readAt: null } });
  return { items: items.slice(0, take), nextCursor: items.length > take ? items[take - 1]!.id : null, unread };
}

export async function markRead(userId: string, ids: string[] | "all") {
  await db.notification.updateMany({
    where: { userId, readAt: null, ...(ids === "all" ? {} : { id: { in: ids } }) },
    data: { readAt: new Date() },
  });
}

/** Gera notificações de lembretes do calendário vencidos (chamado de forma preguiçosa ao abrir o app). */
export async function dispatchDueReminders(userId: string) {
  const pref = await db.userPreference.findUnique({ where: { userId }, select: { reminderNotifications: true } });
  const due = await db.calendarEvent.findMany({
    where: { userId, remindAt: { lte: new Date() }, reminderSentAt: null, completedAt: null },
    take: 20,
  });
  for (const ev of due) {
    const updated = await db.calendarEvent.updateMany({ where: { id: ev.id, reminderSentAt: null }, data: { reminderSentAt: new Date() } });
    // Com lembretes desativados, o evento é marcado como processado sem gerar notificação.
    if (updated.count === 1 && pref?.reminderNotifications !== false) {
      await notify(userId, {
        type: "reminder",
        title: `Lembrete: ${ev.title}`,
        body: `Agendado para ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(ev.startsAt)}.`,
        href: "/app/calendar",
      });
    }
  }
}
