"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bell, ChevronDown, Grid3x3, LogOut, Shield, User, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { APP_TIMEZONE, cn, initials } from "@/lib/utils";
import { Logo } from "./logo";
import { MOBILE_TABS, NAV_GROUPS, isActive } from "./nav";

export type ShellUser = { name: string; email: string; role: string; level: number; xp: number; hasAvatar: boolean; emailVerified: boolean; reducedMotion: boolean; plan: string; activeSession: { id: string; name: string } | null; notice?: string | null };

export function Avatar({ name, has, size = 36, userId }: { name: string; has: boolean; size?: number; userId?: string }) {
  return has ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/api/v1/profile/avatar${userId ? `?u=${userId}` : ""}`} alt="" width={size} height={size} className="rounded-full object-cover ring-1 ring-white/10" style={{ width: size, height: size }} />
  ) : (
    <span className="grid place-items-center rounded-full bg-gradient-to-br from-neon to-neon-600 font-display text-xs font-bold text-ink-950" style={{ width: size, height: size }} aria-hidden>
      {initials(name)}
    </span>
  );
}

function Sidebar({ pathname, user }: { pathname: string; user: ShellUser }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/5 bg-ink-950/95 lg:flex">
      <div className="flex h-16 items-center px-5">
        <Logo href="/app" />
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Navegação do app">
        {NAV_GROUPS.map((g) => (
          <div key={g.title}>
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-mist-700">{g.title}</div>
            <ul className="space-y-0.5">
              {g.items.map((i) => {
                const active = isActive(pathname, i.href);
                return (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      aria-current={active ? "page" : undefined}
                      className={cn("group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors", active ? "bg-neon/10 text-snow" : "text-mist hover:bg-white/4 hover:text-snow")}
                    >
                      {active && <motion.span layoutId="nav-active" className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-neon" />}
                      <i.icon className={cn("h-[18px] w-[18px]", active ? "text-neon" : "text-mist-700 group-hover:text-mist")} />
                      {i.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {(user.role === "ADMIN" || user.role === "MODERATOR") && (
          <div>
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-mist-700">Gestão</div>
            <Link href="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-mist hover:bg-white/4 hover:text-snow">
              <Shield className="h-[18px] w-[18px] text-warning" /> Painel administrativo
            </Link>
          </div>
        )}
      </nav>
      <div className="m-3 rounded-2xl border border-white/5 bg-ink-900/80 p-3.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-mist">Nível {user.level}</span>
          <span className="font-medium text-neon">{user.xp} XP</span>
        </div>
        <div className="mt-2 text-[11px] text-mist-700">Plano {user.plan === "FREE" ? "Free" : user.plan === "PRO" ? "Pro" : "Elite"}</div>
      </div>
    </aside>
  );
}

function Notifications() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ items: { id: string; title: string; body: string; href: string | null; readAt: string | null; createdAt: string }[]; unread: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const load = () => api<typeof data>("/notifications").then(setData).catch(() => undefined);
  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const on = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", on);
    return () => document.removeEventListener("mousedown", on);
  }, []);
  async function readAll() {
    await api("/notifications/read", { method: "POST", body: { ids: "all" } });
    load();
  }
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative grid h-10 w-10 place-items-center rounded-xl text-mist hover:bg-white/5 hover:text-snow" aria-label={`Notificações${data?.unread ? ` (${data.unread} não lidas)` : ""}`} aria-expanded={open}>
        <Bell className="h-5 w-5" />
        {!!data?.unread && <span className="absolute right-2 top-2 grid h-4 min-w-4 place-items-center rounded-full bg-neon px-1 text-[10px] font-bold text-ink-950">{data.unread > 9 ? "9+" : data.unread}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="glass-strong fixed inset-x-3 top-16 z-50 overflow-hidden rounded-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <span className="text-sm font-semibold">Notificações</span>
              <div className="flex gap-3">
                {!!data?.unread && (
                  <button onClick={readAll} className="text-xs text-neon hover:underline">
                    Marcar todas como lidas
                  </button>
                )}
                <Link href="/app/notifications" onClick={() => setOpen(false)} className="text-xs text-mist hover:text-snow">
                  Ver todas
                </Link>
              </div>
            </div>
            <ul className="max-h-96 overflow-y-auto">
              {!data && <li className="p-4"><div className="skeleton h-12" /></li>}
              {data?.items.length === 0 && <li className="px-4 py-10 text-center text-sm text-mist">Nenhuma notificação por enquanto.</li>}
              {data?.items.slice(0, 8).map((n) => (
                <li key={n.id}>
                  <button
                    className={cn("flex w-full gap-3 border-b border-white/5 px-4 py-3 text-left hover:bg-white/3", !n.readAt && "bg-neon/[0.03]")}
                    onClick={async () => {
                      if (!n.readAt) await api("/notifications/read", { method: "POST", body: { ids: [n.id] } }).catch(() => undefined);
                      setOpen(false);
                      load();
                      if (n.href) router.push(n.href);
                    }}
                  >
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-neon")} />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{n.title}</span>
                      <span className="mt-0.5 block text-xs text-mist">{n.body}</span>
                      <span className="mt-1 block text-[10px] text-mist-700">{new Date(n.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: APP_TIMEZONE })}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileMenu({ user }: { user: ShellUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const on = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", on);
    return () => document.removeEventListener("mousedown", on);
  }, []);
  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-white/5" aria-expanded={open} aria-label="Menu do perfil">
        <Avatar name={user.name} has={user.hasAvatar} />
        <ChevronDown className="hidden h-4 w-4 text-mist sm:block" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="glass-strong absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl p-1.5">
            <div className="px-3 py-3">
              <div className="truncate text-sm font-semibold">{user.name}</div>
              <div className="truncate text-xs text-mist">{user.email}</div>
            </div>
            <div className="h-px bg-white/5" />
            {[
              { href: "/app/profile", label: "Meu perfil", icon: User },
              { href: "/app/settings", label: "Configurações", icon: Grid3x3 },
            ].map((i) => (
              <Link key={i.href} href={i.href} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-mist hover:bg-white/5 hover:text-snow">
                <i.icon className="h-4 w-4" /> {i.label}
              </Link>
            ))}
            {(user.role === "ADMIN" || user.role === "MODERATOR") && (
              <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-mist hover:bg-white/5 hover:text-snow">
                <Shield className="h-4 w-4" /> Painel administrativo
              </Link>
            )}
            <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-danger hover:bg-danger/10">
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileNav({ pathname, user }: { pathname: string; user: ShellUser }) {
  const [more, setMore] = useState(false);
  useEffect(() => setMore(false), [pathname]);
  return (
    <>
      <nav className="glass-strong safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/5 lg:hidden" aria-label="Navegação inferior">
        <ul className="grid grid-cols-5">
          {MOBILE_TABS.map((t) => {
            const active = isActive(pathname, t.href);
            return (
              <li key={t.href}>
                <Link href={t.href} aria-current={active ? "page" : undefined} className={cn("flex flex-col items-center gap-1 pb-1.5 pt-2.5 text-[10px] font-medium", active ? "text-neon" : "text-mist")}>
                  <span className={cn("grid h-8 w-12 place-items-center rounded-full transition-colors", active && "bg-neon/12")}>
                    <t.icon className="h-5 w-5" />
                  </span>
                  {t.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button onClick={() => setMore(true)} className="flex w-full flex-col items-center gap-1 pb-1.5 pt-2.5 text-[10px] font-medium text-mist" aria-label="Mais opções">
              <span className="grid h-8 w-12 place-items-center rounded-full">
                <Grid3x3 className="h-5 w-5" />
              </span>
              Mais
            </button>
          </li>
        </ul>
      </nav>
      <AnimatePresence>
        {more && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div className="absolute inset-0 bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMore(false)} />
            <motion.div role="dialog" aria-modal="true" aria-label="Todas as áreas" className="glass-strong safe-bottom absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl p-5" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}>
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display font-semibold">Todas as áreas</span>
                <button onClick={() => setMore(false)} className="p-1.5 text-mist" aria-label="Fechar">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {NAV_GROUPS.map((g) => (
                <div key={g.title} className="mb-4">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-mist-700">{g.title}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {g.items.map((i) => (
                      <Link key={i.href} href={i.href} className={cn("flex flex-col items-center gap-2 rounded-2xl border p-3 text-center text-[11px]", isActive(pathname, i.href) ? "border-neon/40 bg-neon/10 text-neon" : "border-white/5 bg-ink-900/70 text-mist")}>
                        <i.icon className="h-5 w-5" />
                        {i.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              {(user.role === "ADMIN" || user.role === "MODERATOR") && (
                <Link href="/admin" className="flex items-center justify-center gap-2 rounded-2xl border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
                  <Shield className="h-4 w-4" /> Painel administrativo
                </Link>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function EmailBanner() {
  const [sending, setSending] = useState(false);
  return (
    <div className="border-b border-warning/20 bg-warning/5 px-4 py-2 text-center text-xs text-warning sm:px-6">
      Confirme seu e-mail para proteger a conta e liberar a comunidade.{" "}
      <button
        disabled={sending}
        className="font-semibold underline underline-offset-2"
        onClick={async () => {
          setSending(true);
          try {
            const r = await api<{ delivered: boolean; alreadyVerified: boolean }>("/auth/resend-verification", { method: "POST" });
            toast.success(r.alreadyVerified ? "E-mail já confirmado." : r.delivered ? "E-mail de confirmação enviado." : "Link gerado. Sem SMTP configurado, o link aparece no log do servidor (ambiente de desenvolvimento).");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro ao reenviar.");
          } finally {
            setSending(false);
          }
        }}
      >
        Reenviar confirmação
      </button>
    </div>
  );
}

export function AppShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const pathname = usePathname();
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(user.reducedMotion);
  }, [user.reducedMotion]);
  const today = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: APP_TIMEZONE }).format(new Date());
  const inPlayer = pathname.startsWith("/app/workouts/session/");
  return (
    <div className="min-h-dvh">
      <Sidebar pathname={pathname} user={user} />
      <div className="lg:pl-64">
        <header className="glass-strong sticky top-0 z-30 border-b border-white/5">
          {user.notice && <div className="border-b border-info/20 bg-info/10 px-4 py-2 text-center text-xs text-info" role="status">{user.notice}</div>}
          {!user.emailVerified && <EmailBanner />}
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3 lg:hidden">
              <Logo href="/app" />
            </div>
            <div className="hidden min-w-0 lg:block">
              <div className="text-xs text-mist first-letter:uppercase">{today}</div>
            </div>
            <div className="flex items-center gap-1.5">
              {user.activeSession && !inPlayer && (
                <Link href={`/app/workouts/session/${user.activeSession.id}`} className="mr-1 hidden items-center gap-2 rounded-full border border-neon/40 bg-neon/10 px-3 py-1.5 text-xs font-medium text-neon sm:flex">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-neon" />
                  </span>
                  Treino em andamento
                </Link>
              )}
              <Notifications />
              <ProfileMenu user={user} />
            </div>
          </div>
        </header>
        <main id="conteudo" className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">
          <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}>
            {children}
          </motion.div>
        </main>
      </div>
      {!inPlayer && <MobileNav pathname={pathname} user={user} />}
      {user.activeSession && !inPlayer && (
        <Link href={`/app/workouts/session/${user.activeSession.id}`} className="fixed inset-x-4 bottom-20 z-30 flex items-center justify-between rounded-2xl border border-neon/40 bg-ink-900/95 px-4 py-3 text-sm shadow-glow backdrop-blur sm:hidden">
          <span className="font-medium">Treino em andamento: {user.activeSession.name}</span>
          <span className="text-neon">Voltar →</span>
        </Link>
      )}
    </div>
  );
}
