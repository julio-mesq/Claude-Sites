"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Check, ChevronLeft, ChevronRight, Dumbbell, Moon, Plus, Target, Trash2, CalendarClock, Users } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Badge, Card, PageHeader, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Segmented, Switch } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm";
import { calendarEventSchema } from "@/lib/validations/tracking";
import { EVENT_LABEL } from "@/lib/labels";
import { addDaysKey, APP_TIMEZONE, cn, dateKey, formatDate, formatDuration, weekStartKey, zonedStartOfDay } from "@/lib/utils";

type Ev = { id: string; title: string; type: string; startsAt: string; endsAt: string | null; allDay: boolean; completedAt: string | null; notes: string | null; remindAt: string | null; workout: { id: string; name: string } | null };
type Ses = { id: string; name: string; startedAt: string; durationSec: number | null };
type View = "day" | "week" | "month";

const TYPE_STYLE: Record<string, { dot: string; chip: string; icon: typeof Dumbbell }> = {
  WORKOUT: { dot: "bg-neon", chip: "border-neon/30 bg-neon/10 text-neon", icon: Dumbbell },
  REST: { dot: "bg-violet", chip: "border-violet/30 bg-violet/10 text-violet", icon: Moon },
  GOAL: { dot: "bg-warning", chip: "border-warning/30 bg-warning/10 text-warning", icon: Target },
  REMINDER: { dot: "bg-info", chip: "border-info/30 bg-info/10 text-info", icon: Bell },
  APPOINTMENT: { dot: "bg-pink-400", chip: "border-pink-400/30 bg-pink-400/10 text-pink-300", icon: Users },
  DONE: { dot: "bg-neon-600", chip: "border-white/10 bg-white/5 text-mist", icon: Check },
};

const WD = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function CalendarApp({ workouts }: { workouts: { id: string; name: string }[] }) {
  const confirm = useConfirm();
  const today = dateKey();
  const [view, setView] = useState<View>("week");
  const [cursor, setCursor] = useState(today);
  const [data, setData] = useState<{ events: Ev[]; sessions: Ses[] } | null>(null);
  const [form, setForm] = useState<{ open: boolean; edit?: Ev; date?: string }>({ open: false });

  const range = useMemo(() => {
    if (view === "day") return { from: cursor, days: 1 };
    if (view === "week") return { from: weekStartKey(cursor), days: 7 };
    const first = `${cursor.slice(0, 7)}-01`;
    return { from: weekStartKey(first), days: 42 };
  }, [view, cursor]);

  const load = useCallback(async () => {
    setData(null);
    const from = zonedStartOfDay(range.from).toISOString();
    const to = zonedStartOfDay(addDaysKey(range.from, range.days)).toISOString();
    try {
      setData(await api(`/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao carregar.");
      setData({ events: [], sessions: [] });
    }
  }, [range]);
  useEffect(() => {
    load();
  }, [load]);

  const byDay = useMemo(() => {
    const m = new Map<string, { events: Ev[]; sessions: Ses[] }>();
    for (const e of data?.events ?? []) {
      const k = dateKey(new Date(e.startsAt));
      m.set(k, { events: [...(m.get(k)?.events ?? []), e], sessions: m.get(k)?.sessions ?? [] });
    }
    for (const s of data?.sessions ?? []) {
      const k = dateKey(new Date(s.startedAt));
      m.set(k, { events: m.get(k)?.events ?? [], sessions: [...(m.get(k)?.sessions ?? []), s] });
    }
    return m;
  }, [data]);

  const step = (dir: number) => setCursor((c) => (view === "day" ? addDaysKey(c, dir) : view === "week" ? addDaysKey(c, dir * 7) : (() => { const d = new Date(`${c.slice(0, 7)}-15T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() + dir); return d.toISOString().slice(0, 10); })()));
  const title = view === "month" ? formatDate(`${cursor.slice(0, 7)}-15`, { month: "long", year: "numeric" }) : view === "week" ? `${formatDate(range.from, { day: "2-digit", month: "short" })} – ${formatDate(addDaysKey(range.from, 6), { day: "2-digit", month: "short", year: "numeric" })}` : formatDate(cursor, { weekday: "long", day: "2-digit", month: "long" });

  async function toggleDone(e: Ev) {
    await api(`/calendar/${e.id}`, { method: "PATCH", body: { completed: !e.completedAt } });
    load();
  }

  const EventChip = ({ e, compact }: { e: Ev; compact?: boolean }) => {
    const s = TYPE_STYLE[e.completedAt ? "DONE" : e.type] ?? TYPE_STYLE.REMINDER!;
    return (
      <button onClick={() => setForm({ open: true, edit: e })} className={cn("flex w-full items-center gap-1.5 truncate rounded-lg border px-2 py-1 text-left text-[11px]", s.chip, e.completedAt && "line-through")}>
        <s.icon className="h-3 w-3 shrink-0" />
        {!compact && !e.allDay && <span className="shrink-0 opacity-70">{new Date(e.startsAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: APP_TIMEZONE })}</span>}
        <span className="truncate">{e.title}</span>
      </button>
    );
  };

  return (
    <div>
      <PageHeader eyebrow="Rotina" title="Calendário" subtitle="Programe treinos, descanso, metas e lembretes." action={<Button onClick={() => setForm({ open: true, date: cursor })}><Plus className="h-4 w-4" /> Novo evento</Button>} />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => step(-1)} aria-label="Anterior"><ChevronLeft className="h-5 w-5" /></Button>
          <Button variant="secondary" size="sm" onClick={() => setCursor(today)}>Hoje</Button>
          <Button variant="ghost" size="icon" onClick={() => step(1)} aria-label="Próximo"><ChevronRight className="h-5 w-5" /></Button>
          <h2 className="ml-2 font-display text-lg font-semibold first-letter:uppercase">{title}</h2>
        </div>
        <Segmented value={view} onChange={setView} options={[{ value: "day", label: "Dia" }, { value: "week", label: "Semana" }, { value: "month", label: "Mês" }]} />
      </div>
      <div className="mb-4 flex flex-wrap gap-3 text-xs text-mist">
        {Object.entries(EVENT_LABEL).map(([k, l]) => (
          <span key={k} className="flex items-center gap-1.5"><span className={cn("h-2 w-2 rounded-full", TYPE_STYLE[k]!.dot)} /> {l}</span>
        ))}
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-neon-600" /> Treino concluído</span>
      </div>
      {!data ? (
        <Skeleton className="h-96" />
      ) : view === "month" ? (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-7 border-b border-white/5 text-center text-[11px] uppercase tracking-wider text-mist">
            {WD.map((d) => <div key={d} className="py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: 42 }).map((_, i) => {
              const k = addDaysKey(range.from, i);
              const inMonth = k.slice(0, 7) === cursor.slice(0, 7);
              const d = byDay.get(k);
              return (
                <button key={k} onClick={() => { setCursor(k); setView("day"); }} className={cn("min-h-20 border-b border-r border-white/5 p-1.5 text-left align-top transition-colors hover:bg-white/[0.02] sm:min-h-28", !inMonth && "opacity-35")}>
                  <div className={cn("mb-1 grid h-6 w-6 place-items-center rounded-full text-xs", k === today && "bg-neon font-bold text-ink-950")}>{Number(k.slice(8))}</div>
                  <div className="hidden space-y-1 sm:block">
                    {d?.events.slice(0, 2).map((e) => (
                      <div key={e.id} className={cn("truncate rounded px-1.5 py-0.5 text-[10px]", (TYPE_STYLE[e.completedAt ? "DONE" : e.type] ?? TYPE_STYLE.REMINDER!).chip)}>{e.title}</div>
                    ))}
                    {d?.sessions.length ? <div className="truncate text-[10px] text-neon">✓ {d.sessions.length} treino(s)</div> : null}
                  </div>
                  <div className="flex gap-0.5 sm:hidden">
                    {d?.events.slice(0, 3).map((e) => <span key={e.id} className={cn("h-1.5 w-1.5 rounded-full", (TYPE_STYLE[e.type] ?? TYPE_STYLE.REMINDER!).dot)} />)}
                    {d?.sessions.length ? <span className="h-1.5 w-1.5 rounded-full bg-neon-600" /> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      ) : (
        <div className={cn("grid gap-3", view === "week" ? "md:grid-cols-7" : "")}>
          {Array.from({ length: range.days }).map((_, i) => {
            const k = addDaysKey(range.from, i);
            const d = byDay.get(k);
            return (
              <Card key={k} className={cn("flex flex-col p-3", k === today && "border-neon/30")}>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-mist">{WD[i % 7]}</div>
                    <div className={cn("font-display text-lg font-bold", k === today && "text-neon")}>{Number(k.slice(8))}</div>
                  </div>
                  <button onClick={() => setForm({ open: true, date: k })} className="rounded-lg p-1 text-mist hover:bg-white/5 hover:text-neon" aria-label={`Adicionar evento em ${k}`}><Plus className="h-4 w-4" /></button>
                </div>
                <div className="flex-1 space-y-1.5">
                  {d?.events.map((e) => (
                    <div key={e.id} className="flex items-center gap-1">
                      <EventChip e={e} />
                      {view === "day" && (
                        <Button variant="ghost" size="sm" onClick={() => toggleDone(e)} aria-label={e.completedAt ? "Desmarcar" : "Marcar como concluído"}>
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {d?.sessions.map((s) => (
                    <div key={s.id} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-mist">
                      ✓ {s.name} · {formatDuration(s.durationSec ?? 0)}
                    </div>
                  ))}
                  {!d && <div className="py-2 text-center text-[11px] text-mist-700">Livre</div>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <EventForm
        state={form}
        workouts={workouts}
        onClose={() => setForm({ open: false })}
        onSaved={load}
        onDelete={async (e) => {
          if (!(await confirm({ title: `Excluir "${e.title}"?`, confirmLabel: "Excluir", danger: true }))) return;
          await api(`/calendar/${e.id}`, { method: "DELETE" });
          setForm({ open: false });
          load();
        }}
        onToggle={async (e) => {
          await toggleDone(e);
          setForm({ open: false });
        }}
      />
    </div>
  );
}

function EventForm({ state, workouts, onClose, onSaved, onDelete, onToggle }: { state: { open: boolean; edit?: Ev; date?: string }; workouts: { id: string; name: string }[]; onClose: () => void; onSaved: () => void; onDelete: (e: Ev) => void; onToggle: (e: Ev) => void }) {
  const e = state.edit;
  const [f, setF] = useState({ title: "", type: "WORKOUT", date: dateKey(), time: "18:00", duration: "60", allDay: false, workoutId: "", notes: "", remind: "60" });
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!state.open) return;
    setErr(null);
    if (e) {
      const s = new Date(e.startsAt);
      setF({ title: e.title, type: e.type, date: dateKey(s), time: s.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: APP_TIMEZONE }), duration: e.endsAt ? String(Math.round((new Date(e.endsAt).getTime() - s.getTime()) / 60000)) : "60", allDay: e.allDay, workoutId: e.workout?.id ?? "", notes: e.notes ?? "", remind: e.remindAt ? String(Math.round((s.getTime() - new Date(e.remindAt).getTime()) / 60000)) : "" });
    } else setF((p) => ({ ...p, title: "", date: state.date ?? dateKey(), notes: "", workoutId: "" }));
  }, [state, e]);
  async function save() {
    const startsAt = new Date(zonedStartOfDay(f.date).getTime() + (f.allDay ? 0 : (Number(f.time.slice(0, 2)) * 60 + Number(f.time.slice(3, 5))) * 60000));
    const payload = { title: f.title || (f.workoutId ? workouts.find((w) => w.id === f.workoutId)?.name : "") || "", type: f.type, startsAt, endsAt: f.allDay ? null : new Date(startsAt.getTime() + Number(f.duration || 0) * 60000), allDay: f.allDay, workoutId: f.type === "WORKOUT" && f.workoutId ? f.workoutId : null, notes: f.notes || null, remindMinutesBefore: f.remind === "" ? null : Number(f.remind) };
    const p = calendarEventSchema.safeParse(payload);
    if (!p.success) return setErr(p.error.issues[0]?.message ?? "Revise os campos.");
    try {
      if (e) await api(`/calendar/${e.id}`, { method: "PATCH", body: p.data });
      else await api("/calendar", { method: "POST", body: p.data });
      toast.success(e ? "Evento atualizado." : "Evento criado.");
      onSaved();
      onClose();
    } catch (x) {
      setErr(x instanceof ApiError ? x.message : "Erro.");
    }
  }
  return (
    <Modal
      open={state.open}
      onClose={onClose}
      title={e ? "Editar evento" : "Novo evento"}
      footer={
        <>
          {e && <Button variant="danger" onClick={() => onDelete(e)}><Trash2 className="h-4 w-4" /> Excluir</Button>}
          {e && <Button variant="secondary" onClick={() => onToggle(e)}><Check className="h-4 w-4" /> {e.completedAt ? "Desmarcar" : "Concluído"}</Button>}
          <Button onClick={save}>Salvar</Button>
        </>
      }
    >
      <div className="space-y-3">
        {err && <p className="text-sm text-danger">{err}</p>}
        {e?.completedAt && <Badge tone="neon">Concluído</Badge>}
        <Field label="Tipo" htmlFor="ev-type">
          <Select id="ev-type" value={f.type} onChange={(x) => setF({ ...f, type: x.target.value })}>
            {Object.entries(EVENT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
        {f.type === "WORKOUT" && workouts.length > 0 && (
          <Field label="Treino" htmlFor="ev-w">
            <Select id="ev-w" value={f.workoutId} onChange={(x) => setF({ ...f, workoutId: x.target.value })}>
              <option value="">Nenhum (atividade livre)</option>
              {workouts.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </Select>
          </Field>
        )}
        <Field label="Título" htmlFor="ev-t">
          <Input id="ev-t" value={f.title} onChange={(x) => setF({ ...f, title: x.target.value })} placeholder={f.type === "REST" ? "Dia de descanso" : "Ex.: Corrida no parque"} />
        </Field>
        <Switch checked={f.allDay} onChange={(v) => setF({ ...f, allDay: v })} label="Dia inteiro" />
        <div className="grid grid-cols-3 gap-3">
          <Field label="Data" htmlFor="ev-d">
            <Input id="ev-d" type="date" value={f.date} onChange={(x) => setF({ ...f, date: x.target.value })} />
          </Field>
          {!f.allDay && (
            <>
              <Field label="Hora" htmlFor="ev-h">
                <Input id="ev-h" type="time" value={f.time} onChange={(x) => setF({ ...f, time: x.target.value })} />
              </Field>
              <Field label="Duração (min)" htmlFor="ev-du">
                <Input id="ev-du" type="number" min={0} value={f.duration} onChange={(x) => setF({ ...f, duration: x.target.value })} />
              </Field>
            </>
          )}
        </div>
        <Field label="Lembrete" htmlFor="ev-r" hint="Você recebe uma notificação no FitLife no horário do lembrete.">
          <Select id="ev-r" value={f.remind} onChange={(x) => setF({ ...f, remind: x.target.value })}>
            <option value="">Sem lembrete</option>
            <option value="0">No horário</option>
            <option value="15">15 min antes</option>
            <option value="60">1 hora antes</option>
            <option value="1440">1 dia antes</option>
          </Select>
        </Field>
        <Field label="Observações" htmlFor="ev-n">
          <Textarea id="ev-n" value={f.notes} onChange={(x) => setF({ ...f, notes: x.target.value })} maxLength={500} />
        </Field>
        <p className="flex items-center gap-1.5 text-[11px] text-mist-700"><CalendarClock className="h-3.5 w-3.5" /> Treinos concluídos aparecem automaticamente no calendário.</p>
      </div>
    </Modal>
  );
}
