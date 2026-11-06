"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, CheckCircle2, Dumbbell, EyeOff, FileText, Flag, Pencil, Plus, RotateCcw, Search, Settings2, Target, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Badge, Card, CardHeader, EmptyState, PageHeader, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Segmented, Stat, Switch } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm";
import { Bars } from "@/components/charts/charts";
import { DIFFICULTY_LABEL, MUSCLE_LABEL, PLAN_LABEL, ROLE_LABEL } from "@/lib/labels";
import { exerciseAdminSchema, missionSchema } from "@/lib/validations/fitness";
import { APP_TIMEZONE, cn, formatDate } from "@/lib/utils";

type Overview = { users: number; new7: number; active7: number; workouts30: number; openReports: number; plans: Record<string, number>; signups: { date: string; count: number }[] };
type Tab = "overview" | "users" | "moderation" | "exercises" | "missions" | "audit" | "settings";

export function AdminApp({ role, me, overview }: { role: string; me: string; overview: Overview }) {
  const isAdmin = role === "ADMIN";
  const [tab, setTab] = useState<Tab>("overview");
  const tabs: { value: Tab; label: string }[] = [
    { value: "overview", label: "Visão geral" },
    { value: "moderation", label: `Moderação${overview.openReports ? ` (${overview.openReports})` : ""}` },
    ...(isAdmin
      ? ([
          { value: "users", label: "Usuários" },
          { value: "exercises", label: "Exercícios" },
          { value: "missions", label: "Desafios" },
          { value: "audit", label: "Logs" },
          { value: "settings", label: "Configurações" },
        ] as { value: Tab; label: string }[])
      : []),
  ];
  return (
    <div>
      <PageHeader eyebrow="Administração" title="Painel FitLife" subtitle="Todas as ações são verificadas no servidor e registradas em auditoria." />
      <div className="mb-6 overflow-x-auto"><Segmented value={tab} onChange={setTab} options={tabs} /></div>
      {tab === "overview" && <OverviewTab o={overview} />}
      {tab === "moderation" && <Moderation />}
      {tab === "users" && isAdmin && <UsersTab me={me} />}
      {tab === "exercises" && isAdmin && <ExercisesTab />}
      {tab === "missions" && isAdmin && <MissionsTab />}
      {tab === "audit" && isAdmin && <AuditTab />}
      {tab === "settings" && isAdmin && <SettingsTab />}
    </div>
  );
}

function OverviewTab({ o }: { o: Overview }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Usuários" value={o.users} icon={<Users className="h-4 w-4" />} />
        <Stat label="Novos (7 dias)" value={o.new7} icon={<UserPlus className="h-4 w-4" />} tone="info" />
        <Stat label="Ativos (7 dias)" value={o.active7} icon={<Activity className="h-4 w-4" />} tone="violet" />
        <Stat label="Treinos (30 dias)" value={o.workouts30} icon={<Dumbbell className="h-4 w-4" />} tone="warning" />
        <Stat label="Denúncias abertas" value={o.openReports} icon={<Flag className="h-4 w-4" />} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader title="Novos cadastros (30 dias)" />
          <div className="p-4"><Bars data={o.signups} xKey="date" yKey="count" label="Cadastros" xFormat="day-month" height={220} /></div>
        </Card>
        <Card>
          <CardHeader title="Assinaturas ativas" />
          <ul className="space-y-3 p-5">
            {(["FREE", "PRO", "ELITE"] as const).map((p) => (
              <li key={p} className="flex justify-between text-sm"><span className="text-mist">{PLAN_LABEL[p]}</span><span className="font-display font-bold">{o.plans[p] ?? 0}</span></li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

type Report = { id: string; reason: string; details: string | null; status: string; createdAt: string; reporter: { name: string; email: string } | null; post: { id: string; content: string; hiddenAt: string | null; author: { name: string; email: string } } | null; comment: { id: string; content: string; hiddenAt: string | null; author: { name: string; email: string } } | null };

function Moderation() {
  const [status, setStatus] = useState<"OPEN" | "RESOLVED" | "DISMISSED">("OPEN");
  const [items, setItems] = useState<Report[] | null>(null);
  const load = useCallback(() => api<{ items: Report[] }>(`/admin/reports?status=${status}`).then((r) => setItems(r.items)), [status]);
  useEffect(() => {
    setItems(null);
    load();
  }, [load]);
  async function act(id: string, action: "hide" | "dismiss" | "restore") {
    try {
      await api(`/admin/reports/${id}`, { method: "POST", body: { action } });
      toast.success("Ação registrada.");
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro.");
    }
  }
  return (
    <div>
      <Segmented size="sm" value={status} onChange={setStatus} className="mb-4" options={[{ value: "OPEN", label: "Abertas" }, { value: "RESOLVED", label: "Resolvidas" }, { value: "DISMISSED", label: "Descartadas" }]} />
      {!items ? <Skeleton className="h-40" /> : items.length === 0 ? <Card><EmptyState icon={<CheckCircle2 className="h-6 w-6" />} title="Nenhuma denúncia" /></Card> : (
        <div className="space-y-3">
          {items.map((r) => {
            const target = r.post ?? r.comment;
            return (
              <Card key={r.id} className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="danger">{r.reason}</Badge>
                  <Badge>{r.post ? "Publicação" : "Comentário"}</Badge>
                  {target?.hiddenAt && <Badge tone="warning">Oculto</Badge>}
                  <span className="ml-auto text-xs text-mist">{formatDate(new Date(r.createdAt), { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <blockquote className="mt-3 rounded-xl border border-white/5 bg-ink-900/60 p-3 text-sm">{target?.content ?? "(conteúdo removido)"}</blockquote>
                <div className="mt-2 text-xs text-mist">Autor: {target?.author.name} ({target?.author.email}) · Denunciado por: {r.reporter?.name ?? "conta excluída"}</div>
                {r.details && <p className="mt-1 text-xs text-mist">Detalhes: {r.details}</p>}
                {status === "OPEN" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="danger" onClick={() => act(r.id, "hide")}><EyeOff className="h-4 w-4" /> Ocultar conteúdo</Button>
                    <Button size="sm" variant="secondary" onClick={() => act(r.id, "dismiss")}><RotateCcw className="h-4 w-4" /> Descartar e restaurar</Button>
                  </div>
                )}
                {status === "RESOLVED" && <Button size="sm" variant="secondary" className="mt-4" onClick={() => act(r.id, "restore")}><RotateCcw className="h-4 w-4" /> Restaurar conteúdo</Button>}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

type U = { id: string; name: string; email: string; role: string; status: string; createdAt: string; lastActiveAt: string | null; level: number; emailVerifiedAt: string | null; subscription: { plan: string; status: string } | null; _count: { workoutSessions: number } };

function UsersTab({ me }: { me: string }) {
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: U[]; total: number; pages: number } | null>(null);
  const load = useCallback(() => api<NonNullable<typeof data>>(`/admin/users?page=${page}${q ? `&q=${encodeURIComponent(q)}` : ""}`).then(setData), [page, q]);
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);
  async function patch(u: U, body: Record<string, string>, msg: string) {
    if (!(await confirm({ title: msg, description: `${u.name} (${u.email})`, confirmLabel: "Confirmar", danger: body.status === "SUSPENDED" }))) return;
    try {
      await api(`/admin/users/${u.id}`, { method: "PATCH", body });
      toast.success("Usuário atualizado.");
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro.");
    }
  }
  return (
    <Card>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Buscar por nome ou e-mail" className="pl-10" aria-label="Buscar usuários" />
        </div>
        <span className="text-sm text-mist">{data?.total ?? "…"} usuários</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-y border-white/5 text-left text-xs text-mist">
            <tr><th className="px-4 py-2.5 font-medium">Usuário</th><th className="px-4 py-2.5 font-medium">Papel</th><th className="px-4 py-2.5 font-medium">Plano</th><th className="px-4 py-2.5 font-medium">Status</th><th className="px-4 py-2.5 font-medium">Treinos</th><th className="px-4 py-2.5 font-medium">Cadastro</th><th className="px-4 py-2.5 font-medium">Último acesso</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {!data ? <tr><td colSpan={7} className="p-4"><Skeleton className="h-24" /></td></tr> : data.items.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3"><div className="font-medium">{u.name} {u.id === me && <Badge tone="neon">Você</Badge>}</div><div className="text-xs text-mist">{u.email} {!u.emailVerifiedAt && "· não verificado"}</div></td>
                <td className="px-4 py-3">
                  <Select className="h-9 w-40 text-xs" value={u.role} disabled={u.id === me} onChange={(e) => patch(u, { role: e.target.value }, `Alterar papel para ${ROLE_LABEL[e.target.value]}?`)} aria-label="Papel">
                    {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <Select className="h-9 w-36 text-xs" value={u.subscription?.plan ?? "FREE"} onChange={(e) => patch(u, { plan: e.target.value }, `Conceder plano ${PLAN_LABEL[e.target.value]} (cortesia)?`)} aria-label="Plano">
                    {Object.entries(PLAN_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </Select>
                </td>
                <td className="px-4 py-3">
                  {u.id !== me && (
                    <button onClick={() => patch(u, { status: u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" }, u.status === "ACTIVE" ? "Suspender conta?" : "Reativar conta?")}>
                      <Badge tone={u.status === "ACTIVE" ? "neon" : "danger"}>{u.status === "ACTIVE" ? "Ativo" : "Suspenso"}</Badge>
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums">{u._count.workoutSessions}</td>
                <td className="px-4 py-3 text-mist">{formatDate(new Date(u.createdAt), { day: "2-digit", month: "short", year: "2-digit" })}</td>
                <td className="px-4 py-3 text-mist">{u.lastActiveAt ? formatDate(new Date(u.lastActiveAt), { day: "2-digit", month: "short" }) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && data.pages > 1 && (
        <div className="flex items-center justify-end gap-2 p-4">
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span className="text-xs text-mist">{page}/{data.pages}</span>
          <Button size="sm" variant="secondary" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Próxima</Button>
        </div>
      )}
    </Card>
  );
}

type Ex = { id: string; name: string; muscleGroup: string; secondaryMuscles: string[]; equipment: string; difficulty: string; description: string; instructions: string[]; cautions: string[]; defaultSets: number; defaultReps: string; defaultRestSec: number; isCardio: boolean; isPublished: boolean };

function ExercisesTab() {
  const confirm = useConfirm();
  const [items, setItems] = useState<Ex[] | null>(null);
  const [edit, setEdit] = useState<Ex | "new" | null>(null);
  const load = () => api<{ items: Ex[] }>("/admin/exercises").then((r) => setItems(r.items));
  useEffect(() => {
    load();
  }, []);
  return (
    <div>
      <div className="mb-4 flex justify-end"><Button onClick={() => setEdit("new")}><Plus className="h-4 w-4" /> Novo exercício</Button></div>
      {!items ? <Skeleton className="h-60" /> : (
        <Card className="divide-y divide-white/5">
          {items.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 p-3.5">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium">{e.name} {!e.isPublished && <Badge tone="warning">Despublicado</Badge>}</div>
                <div className="text-xs text-mist">{MUSCLE_LABEL[e.muscleGroup]} · {e.equipment} · {DIFFICULTY_LABEL[e.difficulty]}</div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEdit(e)} aria-label={`Editar ${e.name}`}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" aria-label={`Remover ${e.name}`} onClick={async () => { if (!(await confirm({ title: `Remover "${e.name}"?`, description: "Se já houver uso em treinos, o exercício será apenas despublicado.", confirmLabel: "Remover", danger: true }))) return; const r = await api<{ unpublished?: boolean }>(`/admin/exercises/${e.id}`, { method: "DELETE" }); toast.success(r.unpublished ? "Exercício em uso: despublicado." : "Exercício excluído."); load(); }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </Card>
      )}
      <ExerciseForm value={edit} onClose={() => setEdit(null)} onSaved={load} />
    </div>
  );
}

function ExerciseForm({ value, onClose, onSaved }: { value: Ex | "new" | null; onClose: () => void; onSaved: () => void }) {
  const blank = { name: "", muscleGroup: "CHEST", equipment: "", difficulty: "BEGINNER", description: "", instructions: "", cautions: "", defaultSets: "3", defaultReps: "10-12", defaultRestSec: "60", isCardio: false, isPublished: true };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState<string | null>(null);
  const [last, setLast] = useState<unknown>(null);
  if (value !== last) {
    setLast(value);
    setErr(null);
    setF(value && value !== "new" ? { name: value.name, muscleGroup: value.muscleGroup, equipment: value.equipment, difficulty: value.difficulty, description: value.description, instructions: value.instructions.join("\n"), cautions: value.cautions.join("\n"), defaultSets: String(value.defaultSets), defaultReps: value.defaultReps, defaultRestSec: String(value.defaultRestSec), isCardio: value.isCardio, isPublished: value.isPublished } : blank);
  }
  async function save() {
    const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
    const p = exerciseAdminSchema.safeParse({ ...f, instructions: lines(f.instructions), cautions: lines(f.cautions), secondaryMuscles: value && value !== "new" ? value.secondaryMuscles : [] });
    if (!p.success) return setErr(`${p.error.issues[0]?.path.join(".")}: ${p.error.issues[0]?.message}`);
    try {
      if (value && value !== "new") await api(`/admin/exercises/${value.id}`, { method: "PUT", body: p.data });
      else await api("/admin/exercises", { method: "POST", body: p.data });
      toast.success("Exercício salvo.");
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Erro.");
    }
  }
  return (
    <Modal open={!!value} onClose={onClose} title={value === "new" ? "Novo exercício" : "Editar exercício"} size="lg" footer={<Button onClick={save}>Salvar</Button>}>
      <div className="space-y-3">
        {err && <p className="text-sm text-danger">{err}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome" htmlFor="ax-n"><Input id="ax-n" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Equipamento" htmlFor="ax-e" hint='Use "+" para combinar, ex.: Halteres + Banco'><Input id="ax-e" value={f.equipment} onChange={(e) => setF({ ...f, equipment: e.target.value })} /></Field>
          <Field label="Grupo muscular" htmlFor="ax-g"><Select id="ax-g" value={f.muscleGroup} onChange={(e) => setF({ ...f, muscleGroup: e.target.value })}>{Object.entries(MUSCLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
          <Field label="Dificuldade" htmlFor="ax-d"><Select id="ax-d" value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value })}>{Object.entries(DIFFICULTY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
        </div>
        <Field label="Descrição" htmlFor="ax-de"><Textarea id="ax-de" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Instruções (uma por linha)" htmlFor="ax-i"><Textarea id="ax-i" rows={5} value={f.instructions} onChange={(e) => setF({ ...f, instructions: e.target.value })} /></Field>
          <Field label="Cuidados (um por linha)" htmlFor="ax-c"><Textarea id="ax-c" rows={5} value={f.cautions} onChange={(e) => setF({ ...f, cautions: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Séries" htmlFor="ax-s"><Input id="ax-s" type="number" value={f.defaultSets} onChange={(e) => setF({ ...f, defaultSets: e.target.value })} /></Field>
          <Field label="Repetições" htmlFor="ax-r"><Input id="ax-r" value={f.defaultReps} onChange={(e) => setF({ ...f, defaultReps: e.target.value })} /></Field>
          <Field label="Descanso (s)" htmlFor="ax-rs"><Input id="ax-rs" type="number" value={f.defaultRestSec} onChange={(e) => setF({ ...f, defaultRestSec: e.target.value })} /></Field>
        </div>
        <Switch checked={f.isCardio} onChange={(v) => setF({ ...f, isCardio: v })} label="Exercício aeróbico (registra tempo e distância)" />
        <Switch checked={f.isPublished} onChange={(v) => setF({ ...f, isPublished: v })} label="Publicado na biblioteca" />
      </div>
    </Modal>
  );
}

type Mi = { id: string; code: string; name: string; description: string; metric: string; targetValue: number; durationDays: number; xpReward: number; icon: string; isActive: boolean; _count: { progress: number } };
const METRIC_LABEL: Record<string, string> = { WORKOUTS: "Treinos", WORKOUT_MINUTES: "Minutos de treino", CARDIO_KM: "Km aeróbicos", MEALS_LOGGED: "Alimentos registrados", WATER_DAYS: "Dias na meta de água", HABIT_CHECKINS: "Check-ins de hábitos", ROUTINE_COMPLETIONS: "Treinos da rotina" };

function MissionsTab() {
  const [items, setItems] = useState<Mi[] | null>(null);
  const [edit, setEdit] = useState<Mi | "new" | null>(null);
  const load = () => api<{ items: Mi[] }>("/admin/missions").then((r) => setItems(r.items));
  useEffect(() => {
    load();
  }, []);
  const blank = { code: "", name: "", description: "", metric: "WORKOUTS", targetValue: "3", durationDays: "7", xpReward: "100", icon: "target", isActive: true };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState<string | null>(null);
  const [last, setLast] = useState<unknown>(null);
  if (edit !== last) {
    setLast(edit);
    setErr(null);
    setF(edit && edit !== "new" ? { code: edit.code, name: edit.name, description: edit.description, metric: edit.metric, targetValue: String(edit.targetValue), durationDays: String(edit.durationDays), xpReward: String(edit.xpReward), icon: edit.icon, isActive: edit.isActive } : blank);
  }
  async function save() {
    const p = missionSchema.safeParse(f);
    if (!p.success) return setErr(p.error.issues[0]?.message ?? "Erro.");
    try {
      if (edit && edit !== "new") await api(`/admin/missions/${edit.id}`, { method: "PUT", body: p.data });
      else await api("/admin/missions", { method: "POST", body: p.data });
      setEdit(null);
      load();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Erro.");
    }
  }
  return (
    <div>
      <div className="mb-4 flex justify-end"><Button onClick={() => setEdit("new")}><Plus className="h-4 w-4" /> Nova missão</Button></div>
      {!items ? <Skeleton className="h-40" /> : (
        <Card className="divide-y divide-white/5">
          {items.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <div className="flex items-center gap-2 font-medium"><Target className="h-4 w-4 text-neon" /> {m.name} {!m.isActive && <Badge tone="warning">Inativa</Badge>}</div>
                <div className="text-xs text-mist">{METRIC_LABEL[m.metric]} ≥ {m.targetValue} em {m.durationDays} dias · +{m.xpReward} XP · {m._count.progress} participações</div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEdit(m)} aria-label={`Editar ${m.name}`}><Pencil className="h-4 w-4" /></Button>
            </div>
          ))}
        </Card>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === "new" ? "Nova missão" : "Editar missão"} footer={<Button onClick={save}>Salvar</Button>}>
        <div className="space-y-3">
          {err && <p className="text-sm text-danger">{err}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Código" htmlFor="am-c"><Input id="am-c" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} disabled={edit !== "new"} /></Field>
            <Field label="Nome" htmlFor="am-n"><Input id="am-n" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          </div>
          <Field label="Descrição" htmlFor="am-d"><Textarea id="am-d" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <Field label="Métrica (acompanhada automaticamente)" htmlFor="am-m"><Select id="am-m" value={f.metric} onChange={(e) => setF({ ...f, metric: e.target.value })}>{Object.entries(METRIC_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Objetivo" htmlFor="am-t"><Input id="am-t" type="number" value={f.targetValue} onChange={(e) => setF({ ...f, targetValue: e.target.value })} /></Field>
            <Field label="Duração (dias)" htmlFor="am-du"><Input id="am-du" type="number" value={f.durationDays} onChange={(e) => setF({ ...f, durationDays: e.target.value })} /></Field>
            <Field label="XP" htmlFor="am-x"><Input id="am-x" type="number" value={f.xpReward} onChange={(e) => setF({ ...f, xpReward: e.target.value })} /></Field>
          </div>
          <Switch checked={f.isActive} onChange={(v) => setF({ ...f, isActive: v })} label="Disponível para os usuários" />
        </div>
      </Modal>
    </div>
  );
}

type Log = { id: string; action: string; target: string | null; ip: string | null; createdAt: string; meta: unknown; actor: { email: string } | null };

function AuditTab() {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: Log[]; pages: number; total: number } | null>(null);
  useEffect(() => {
    const t = setTimeout(() => api<NonNullable<typeof data>>(`/admin/audit?page=${page}${action ? `&action=${encodeURIComponent(action)}` : ""}`).then(setData), 250);
    return () => clearTimeout(t);
  }, [action, page]);
  return (
    <Card>
      <div className="flex items-center gap-3 p-4">
        <FileText className="h-5 w-5 text-mist" />
        <Input value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} placeholder="Filtrar por ação (ex.: auth., admin.)" className="max-w-xs" aria-label="Filtrar ação" />
        <span className="ml-auto text-xs text-mist">{data?.total ?? "…"} registros</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-xs">
          <thead className="border-y border-white/5 text-left text-mist"><tr><th className="px-4 py-2 font-medium">Data</th><th className="px-4 py-2 font-medium">Ação</th><th className="px-4 py-2 font-medium">Ator</th><th className="px-4 py-2 font-medium">Alvo</th><th className="px-4 py-2 font-medium">IP</th></tr></thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {data?.items.map((l) => (
              <tr key={l.id}><td className="px-4 py-2 text-mist">{new Date(l.createdAt).toLocaleString("pt-BR", { timeZone: APP_TIMEZONE })}</td><td className={cn("px-4 py-2", l.action.includes("failed") && "text-danger")}>{l.action}</td><td className="px-4 py-2">{l.actor?.email ?? "—"}</td><td className="px-4 py-2 text-mist">{l.target ?? "—"}</td><td className="px-4 py-2 text-mist">{l.ip ?? "—"}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && data.pages > 1 && (
        <div className="flex items-center justify-end gap-2 p-4">
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span className="text-xs text-mist">{page}/{data.pages}</span>
          <Button size="sm" variant="secondary" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Próxima</Button>
        </div>
      )}
    </Card>
  );
}

function SettingsTab() {
  const [s, setS] = useState<Record<string, unknown> | null>(null);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    api<Record<string, unknown>>("/admin/settings").then((r) => { setS(r); setMsg(String(r["maintenance.message"] ?? "")); });
  }, []);
  async function put(key: string, value: boolean | string) {
    await api("/admin/settings", { method: "PUT", body: { key, value } });
    setS((p) => ({ ...p, [key]: value }));
    toast.success("Configuração salva.");
  }
  if (!s) return <Skeleton className="h-40" />;
  return (
    <Card className="max-w-2xl">
      <CardHeader title="Configurações gerais" icon={<Settings2 className="h-4 w-4" />} />
      <div className="divide-y divide-white/5 px-5 pb-5">
        <Switch checked={s["signup.enabled"] !== false} onChange={(v) => put("signup.enabled", v)} label="Novos cadastros abertos" description="Desative para pausar o registro de novas contas." />
        <Switch checked={s["community.enabled"] !== false} onChange={(v) => put("community.enabled", v)} label="Comunidade habilitada" description="Desative para suspender publicações e comentários para todos." />
        <div className="pt-4">
          <Field label="Mensagem de aviso (banner)" htmlFor="as-m" hint="Exibida no topo do app para todos os usuários. Deixe vazio para ocultar.">
            <div className="flex gap-2">
              <Input id="as-m" value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={300} />
              <Button variant="secondary" onClick={() => put("maintenance.message", msg)}>Salvar</Button>
            </div>
          </Field>
        </div>
      </div>
    </Card>
  );
}
