"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { api } from "@/lib/api";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { APP_TIMEZONE, cn } from "@/lib/utils";

type N = { id: string; title: string; body: string; href: string | null; readAt: string | null; createdAt: string; type: string };

export function NotificationsList({ initial }: { initial: { items: N[]; nextCursor: string | null; unread: number } }) {
  const [items, setItems] = useState(initial.items);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const unread = items.filter((i) => !i.readAt).length;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Central"
        title="Notificações"
        action={
          unread > 0 && (
            <Button variant="secondary" onClick={async () => { await api("/notifications/read", { method: "POST", body: { ids: "all" } }); setItems((l) => l.map((i) => ({ ...i, readAt: i.readAt ?? new Date().toISOString() }))); }}>
              <CheckCheck className="h-4 w-4" /> Marcar todas como lidas
            </Button>
          )
        }
      />
      {items.length === 0 ? (
        <Card><EmptyState icon={<Bell className="h-6 w-6" />} title="Tudo em dia" description="Conquistas, lembretes e atividades da comunidade aparecem aqui." /></Card>
      ) : (
        <Card className="divide-y divide-white/5">
          {items.map((n) => {
            const inner = (
              <div className={cn("flex gap-3 p-4", !n.readAt && "bg-neon/[0.03]")}>
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.readAt ? "bg-white/10" : "bg-neon")} />
                <div>
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="mt-0.5 text-sm text-mist">{n.body}</div>
                  <div className="mt-1 text-[11px] text-mist-700">{new Date(n.createdAt).toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: APP_TIMEZONE })}</div>
                </div>
              </div>
            );
            const mark = () => !n.readAt && api("/notifications/read", { method: "POST", body: { ids: [n.id] } }).catch(() => undefined);
            return n.href ? <Link key={n.id} href={n.href} onClick={mark} className="block hover:bg-white/[0.02]">{inner}</Link> : <div key={n.id} onClick={mark}>{inner}</div>;
          })}
        </Card>
      )}
      {cursor && (
        <Button variant="secondary" className="mt-4 w-full" onClick={async () => { const r = await api<{ items: N[]; nextCursor: string | null }>(`/notifications?cursor=${cursor}`); setItems((l) => [...l, ...r.items]); setCursor(r.nextCursor); }}>
          Carregar mais
        </Button>
      )}
    </div>
  );
}
