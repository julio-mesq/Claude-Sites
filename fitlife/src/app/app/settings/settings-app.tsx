"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreditCard, Download, KeyRound, Laptop, LogOut, Shield, SlidersHorizontal, Trash2, UserX } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui/card";
import { Button, buttonClass } from "@/components/ui/button";
import { Field, Input, Select, TextField } from "@/components/ui/input";
import { Switch } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { changePasswordSchema } from "@/lib/validations/auth";
import { APP_TIMEZONE } from "@/lib/utils";

type Prefs = { reducedMotion: boolean; weeklyWorkoutTarget: number; dailyWaterMl: number; communityEnabled: boolean; profileVisibility: string; showInRanking: boolean; emailNotifications: boolean; reminderNotifications: boolean; aiUseHistory: boolean; marketingConsent: boolean };
type S = { id: string; userAgent: string | null; ip: string | null; createdAt: string; lastSeenAt: string; current: boolean };

function device(ua: string | null) {
  if (!ua) return "Dispositivo desconhecido";
  const os = /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "Outro";
  const br = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Navegador";
  return `${br} · ${os}`;
}

export function SettingsApp({ prefs: initial, sessions: initialSessions, blocked: initialBlocked }: { prefs: Prefs; sessions: S[]; blocked: { id: string; name: string }[] }) {
  const router = useRouter();
  const [prefs, setPrefs] = useState(initial);
  const [sessions, setSessions] = useState(initialSessions);
  const [blocked, setBlocked] = useState(initialBlocked);
  const [pw, setPw] = useState({ currentPassword: "", password: "", confirmPassword: "" });
  const [pwErr, setPwErr] = useState<Record<string, string>>({});
  const [del, setDel] = useState(false);

  async function update(patch: Partial<Prefs>) {
    const prev = prefs;
    setPrefs({ ...prefs, ...patch });
    try {
      await api("/profile/preferences", { method: "PATCH", body: patch });
      if ("reducedMotion" in patch) document.documentElement.dataset.reducedMotion = String(patch.reducedMotion);
      toast.success("Preferência salva.");
      router.refresh();
    } catch (e) {
      setPrefs(prev);
      toast.error(e instanceof ApiError ? e.message : "Erro.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader eyebrow="Conta" title="Configurações" action={<Link href="/app/settings/billing" className={buttonClass("secondary")}><CreditCard className="h-4 w-4" /> Assinatura</Link>} />
      <Card id="preferencias">
        <CardHeader title="Preferências" icon={<SlidersHorizontal className="h-4 w-4" />} />
        <div className="divide-y divide-white/5 px-5 pb-3">
          <Switch checked={prefs.reducedMotion} onChange={(v) => update({ reducedMotion: v })} label="Reduzir animações" description="Desativa animações, transições e o elemento 3D. O sistema também respeita a preferência do seu dispositivo." />
          <Switch checked={prefs.reminderNotifications} onChange={(v) => update({ reminderNotifications: v })} label="Lembretes do calendário" description="Notificações no FitLife para eventos com lembrete." />
          <Switch checked={prefs.emailNotifications} onChange={(v) => update({ emailNotifications: v })} label="E-mails importantes" description="Segurança da conta e assinatura." />
          <div className="grid gap-3 py-4 sm:grid-cols-2">
            <Field label="Meta de treinos por semana" htmlFor="s-w">
              <Select id="s-w" value={prefs.weeklyWorkoutTarget} onChange={(e) => update({ weeklyWorkoutTarget: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}x</option>)}
              </Select>
            </Field>
            <Field label="Meta diária de água" htmlFor="s-a">
              <Select id="s-a" value={prefs.dailyWaterMl} onChange={(e) => update({ dailyWaterMl: Number(e.target.value) })}>
                {[1500, 2000, 2500, 3000, 3500, 4000].concat(prefs.dailyWaterMl % 500 ? [prefs.dailyWaterMl] : []).sort((a, b) => a - b).map((n) => <option key={n} value={n}>{(n / 1000).toLocaleString("pt-BR")} L</option>)}
              </Select>
            </Field>
          </div>
        </div>
      </Card>

      <Card id="privacidade">
        <CardHeader title="Privacidade e dados (LGPD)" icon={<Shield className="h-4 w-4" />} />
        <div className="divide-y divide-white/5 px-5">
          <Switch checked={prefs.aiUseHistory} onChange={(v) => update({ aiUseHistory: v })} label="Permitir que o Fit AI use meu histórico" description="Objetivos, treinos recentes, metas e recordes personalizam as respostas. Nunca há acesso a dados de outros usuários." />
          <Switch checked={prefs.communityEnabled} onChange={(v) => update({ communityEnabled: v })} label="Participar da comunidade" description="Desativado, seu perfil e publicações ficam ocultos." />
          <div className="py-4">
            <Field label="Visibilidade do perfil" htmlFor="s-v">
              <Select id="s-v" value={prefs.profileVisibility} onChange={(e) => update({ profileVisibility: e.target.value })} disabled={!prefs.communityEnabled}>
                <option value="PRIVATE">Privado</option>
                <option value="FOLLOWERS">Somente seguidores</option>
                <option value="PUBLIC">Público</option>
              </Select>
            </Field>
          </div>
          <Switch checked={prefs.showInRanking} onChange={(v) => update({ showInRanking: v })} label="Aparecer no ranking semanal" description="Exibe seu nome (ou @usuário), nível e XP semanal." />
          <Switch checked={prefs.marketingConsent} onChange={(v) => update({ marketingConsent: v })} label="Receber novidades e ofertas" description="Consentimento opcional e revogável." />
          <div className="flex flex-col gap-3 py-5 sm:flex-row">
            <a href="/api/v1/account/export" className={buttonClass("secondary", "md", "flex-1")} download>
              <Download className="h-4 w-4" /> Exportar meus dados (JSON)
            </a>
            <Button variant="danger" className="flex-1" onClick={() => setDel(true)}>
              <Trash2 className="h-4 w-4" /> Excluir minha conta
            </Button>
          </div>
          {blocked.length > 0 && (
            <div className="py-4">
              <div className="mb-2 text-xs font-medium uppercase tracking-wider text-mist">Usuários bloqueados</div>
              <ul className="space-y-2">
                {blocked.map((b) => (
                  <li key={b.id} className="flex items-center justify-between text-sm">
                    {b.name}
                    <Button size="sm" variant="ghost" onClick={async () => { await api(`/community/users/${b.id}/block`, { method: "DELETE" }); setBlocked((l) => l.filter((x) => x.id !== b.id)); }}>
                      <UserX className="h-4 w-4" /> Desbloquear
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      <Card id="seguranca">
        <CardHeader title="Segurança" icon={<KeyRound className="h-4 w-4" />} />
        <form
          className="grid gap-3 p-5 sm:grid-cols-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const p = changePasswordSchema.safeParse(pw);
            if (!p.success) return setPwErr(Object.fromEntries(p.error.issues.map((i) => [i.path[0] as string, i.message])));
            setPwErr({});
            try {
              await api("/auth/password", { method: "PUT", body: p.data });
              toast.success("Senha alterada. Outras sessões foram encerradas.");
              setPw({ currentPassword: "", password: "", confirmPassword: "" });
              setSessions((l) => l.filter((s) => s.current));
            } catch (err) {
              toast.error(err instanceof ApiError ? err.message : "Erro.");
            }
          }}
        >
          <TextField label="Senha atual" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} error={pwErr.currentPassword} />
          <TextField label="Nova senha" type="password" autoComplete="new-password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} error={pwErr.password} />
          <TextField label="Confirmar" type="password" autoComplete="new-password" value={pw.confirmPassword} onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })} error={pwErr.confirmPassword} />
          <div className="sm:col-span-3"><Button type="submit">Alterar senha</Button></div>
        </form>
        <div className="border-t border-white/5 p-5">
          <div className="mb-3 text-xs font-medium uppercase tracking-wider text-mist">Sessões ativas</div>
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-ink-900/60 p-3">
                <div className="flex items-center gap-3">
                  <Laptop className="h-5 w-5 text-mist" />
                  <div>
                    <div className="flex items-center gap-2 text-sm">{device(s.userAgent)} {s.current && <Badge tone="neon">Esta sessão</Badge>}</div>
                    <div className="text-[11px] text-mist">Último acesso {new Date(s.lastSeenAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: APP_TIMEZONE })}{s.ip ? ` · IP ${s.ip}` : ""}</div>
                  </div>
                </div>
                {!s.current && (
                  <Button size="sm" variant="ghost" onClick={async () => { await api(`/auth/sessions/${s.id}`, { method: "DELETE" }); setSessions((l) => l.filter((x) => x.id !== s.id)); toast.success("Sessão encerrada."); }}>
                    <LogOut className="h-4 w-4" /> Encerrar
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </Card>
      <DeleteAccount open={del} onClose={() => setDel(false)} />
    </div>
  );
}

function DeleteAccount({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Excluir conta definitivamente"
      description="Todos os seus dados — treinos, refeições, medidas, fotos, conquistas e publicações — serão apagados de forma permanente. Esta ação não pode ser desfeita."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            variant="danger"
            loading={loading}
            disabled={confirm !== "EXCLUIR" || !password}
            onClick={async () => {
              setLoading(true);
              try {
                await api("/account", { method: "DELETE", body: { password, confirm } });
                window.location.href = "/?conta-excluida=1";
              } catch (e) {
                toast.error(e instanceof ApiError ? e.message : "Erro.");
                setLoading(false);
              }
            }}
          >
            Excluir para sempre
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-mist">Recomendamos exportar seus dados antes.</p>
        <Field label="Senha" htmlFor="del-p"><Input id="del-p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></Field>
        <Field label='Digite "EXCLUIR" para confirmar' htmlFor="del-c"><Input id="del-c" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
