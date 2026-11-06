"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Apple, Beef, Check, Droplets, Flame, Footprints, ListChecks, Moon, Pencil, Plus, Salad, StretchHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm";
import { habitSchema } from "@/lib/validations/tracking";
import { addDaysKey, cn, formatDate } from "@/lib/utils";

type H = { id: string; name: string; icon: string; color: string; frequency: "DAILY" | "WEEKLY"; targetPerPeriod: number; doneToday: boolean; streak: number; bestStreak: number; weekCount: number; consistency30: number; heatmap: { date: string; done: boolean }[] };

export const HABIT_ICONS: Record<string, typeof Check> = { check: Check, droplets: Droplets, moon: Moon, footprints: Footprints, stretch: StretchHorizontal, apple: Apple, salad: Salad, beef: Beef, flame: Flame };
const COLORS = ["#B6FF3B", "#3BC8FF", "#9B8CFF", "#FFB83B", "#FF7AB6", "#77D63B"];

export function HabitsApp({ initial, today }: { initial: H[]; today: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [habits, setHabits] = useState(initial);
  const [form, setForm] = useState<{ open: boolean; edit?: H }>({ open: false });
  const week = Array.from({ length: 7 }, (_, i) => addDaysKey(today, -6 + i));

  async function toggle(h: H, date: string) {
    const prev = habits;
    setHabits((l) => l.map((x) => (x.id === h.id ? { ...x, heatmap: x.heatmap.map((c) => (c.date === date ? { ...c, done: !c.done } : c)), doneToday: date === today ? !x.doneToday : x.doneToday } : x)));
    try {
      await api(`/habits/${h.id}/toggle`, { method: "POST", body: { date } });
      router.refresh();
      const fresh = await api<{ items: H[] }>("/habits");
      setHabits(fresh.items);
    } catch (e) {
      setHabits(prev);
      toast.error(e instanceof ApiError ? e.message : "Erro.");
    }
  }

  const doneToday = habits.filter((h) => h.doneToday).length;
  return (
    <div>
      <PageHeader eyebrow="Rotina" title="Hábitos" subtitle="Pequenas ações diárias, grandes resultados." action={<Button onClick={() => setForm({ open: true })}><Plus className="h-4 w-4" /> Novo hábito</Button>} />
      {habits.length > 0 && (
        <div className="mb-5 grid grid-cols-3 gap-3">
          <Card className="p-4"><div className="text-xs text-mist">Hoje</div><div className="mt-1 font-display text-2xl font-bold">{doneToday}/{habits.length}</div></Card>
          <Card className="p-4"><div className="text-xs text-mist">Maior sequência atual</div><div className="mt-1 font-display text-2xl font-bold">{Math.max(0, ...habits.filter((h) => h.frequency === "DAILY").map((h) => h.streak))} <span className="text-sm text-mist">dias</span></div></Card>
          <Card className="p-4"><div className="text-xs text-mist">Consistência média (30d)</div><div className="mt-1 font-display text-2xl font-bold">{Math.round(habits.reduce((a, h) => a + h.consistency30, 0) / habits.length)}%</div></Card>
        </div>
      )}
      {habits.length === 0 ? (
        <Card><EmptyState icon={<ListChecks className="h-6 w-6" />} title="Nenhum hábito ativo" description="Crie hábitos como beber água, caminhar ou dormir 7h." action={<Button size="sm" onClick={() => setForm({ open: true })}>Criar hábito</Button>} /></Card>
      ) : (
        <div className="space-y-3">
          {habits.map((h) => {
            const Icon = HABIT_ICONS[h.icon] ?? Check;
            return (
              <Card key={h.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <button onClick={() => toggle(h, today)} aria-pressed={h.doneToday} aria-label={`${h.doneToday ? "Desmarcar" : "Marcar"} ${h.name} hoje`} className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 transition-all active:scale-95", h.doneToday ? "border-transparent text-ink-950" : "border-white/10 text-mist hover:border-white/30")} style={h.doneToday ? { background: h.color, boxShadow: `0 0 20px -4px ${h.color}` } : undefined}>
                      {h.doneToday ? <Check className="h-6 w-6" strokeWidth={3} /> : <Icon className="h-5 w-5" />}
                    </button>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{h.name}</div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {h.frequency === "DAILY" ? <Badge tone={h.streak > 0 ? "warning" : "neutral"}><Flame className="h-3 w-3" /> {h.streak} dias</Badge> : <Badge>{h.weekCount}/{h.targetPerPeriod} na semana</Badge>}
                        <Badge>Recorde {h.bestStreak}</Badge>
                        <Badge>{h.consistency30}% em 30 dias</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {week.map((d) => {
                      const done = h.heatmap.find((c) => c.date === d)?.done;
                      return (
                        <button key={d} onClick={() => toggle(h, d)} className={cn("flex h-11 w-9 flex-col items-center justify-center rounded-xl border text-[10px] transition-colors sm:w-10", done ? "border-transparent text-ink-950" : "border-white/8 text-mist hover:border-white/20", d === today && !done && "border-neon/40")} style={done ? { background: h.color } : undefined} aria-label={`${h.name} em ${d}: ${done ? "feito" : "não feito"}`} aria-pressed={!!done}>
                          <span>{formatDate(d, { weekday: "narrow" })}</span>
                          <span className="font-semibold">{Number(d.slice(8))}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-1 lg:ml-2">
                    <Button variant="ghost" size="icon" onClick={() => setForm({ open: true, edit: h })} aria-label={`Editar ${h.name}`}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" aria-label={`Arquivar ${h.name}`} onClick={async () => { if (!(await confirm({ title: `Arquivar "${h.name}"?`, description: "O histórico é mantido.", confirmLabel: "Arquivar", danger: true }))) return; await api(`/habits/${h.id}`, { method: "DELETE" }); setHabits((l) => l.filter((x) => x.id !== h.id)); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="mt-4 flex gap-[3px]" aria-hidden>
                  {h.heatmap.map((c) => <span key={c.date} title={c.date} className="h-2.5 flex-1 rounded-sm" style={{ background: c.done ? h.color : "rgba(255,255,255,0.06)", opacity: c.done ? 0.9 : 1 }} />)}
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-mist-700"><span>30 dias atrás</span><span>Hoje</span></div>
              </Card>
            );
          })}
          <p className="text-center text-xs text-mist-700">Você pode ajustar registros dos últimos 7 dias.</p>
        </div>
      )}
      <HabitForm state={form} onClose={() => setForm({ open: false })} onSaved={async () => setHabits((await api<{ items: H[] }>("/habits")).items)} />
    </div>
  );
}

function HabitForm({ state, onClose, onSaved }: { state: { open: boolean; edit?: H }; onClose: () => void; onSaved: () => void }) {
  const e = state.edit;
  const [f, setF] = useState({ name: "", icon: "check", color: "#B6FF3B", frequency: "DAILY", targetPerPeriod: "1" });
  const [err, setErr] = useState<string | null>(null);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const k = `${state.open}-${e?.id ?? "new"}`;
  if (k !== lastKey) {
    setLastKey(k);
    setF(e ? { name: e.name, icon: e.icon, color: e.color, frequency: e.frequency, targetPerPeriod: String(e.targetPerPeriod) } : { name: "", icon: "check", color: "#B6FF3B", frequency: "DAILY", targetPerPeriod: "1" });
    setErr(null);
  }
  async function save() {
    const p = habitSchema.safeParse({ ...f, targetPerPeriod: f.frequency === "DAILY" ? 1 : f.targetPerPeriod });
    if (!p.success) return setErr(p.error.issues[0]?.message ?? "Revise.");
    try {
      if (e) await api(`/habits/${e.id}`, { method: "PATCH", body: p.data });
      else await api("/habits", { method: "POST", body: p.data });
      onSaved();
      onClose();
    } catch (x) {
      setErr(x instanceof ApiError ? (x.code === "PLAN_REQUIRED" ? `Limite de hábitos do seu plano. ${x.message}` : x.message) : "Erro.");
    }
  }
  return (
    <Modal open={state.open} onClose={onClose} title={e ? "Editar hábito" : "Novo hábito"} footer={<Button onClick={save}>Salvar</Button>}>
      <div className="space-y-4">
        {err && <p className="text-sm text-danger">{err}</p>}
        <Field label="Nome" htmlFor="hb-n"><Input id="hb-n" value={f.name} onChange={(x) => setF({ ...f, name: x.target.value })} placeholder="Ex.: Alongar 10 minutos" /></Field>
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-mist">Ícone</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(HABIT_ICONS).map(([k2, I]) => (
              <button key={k2} type="button" onClick={() => setF({ ...f, icon: k2 })} aria-pressed={f.icon === k2} aria-label={k2} className={cn("grid h-10 w-10 place-items-center rounded-xl border", f.icon === k2 ? "border-neon bg-neon/10 text-neon" : "border-white/8 text-mist")}><I className="h-5 w-5" /></button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-mist">Cor</div>
          <div className="flex gap-2">
            {COLORS.map((c) => <button key={c} type="button" onClick={() => setF({ ...f, color: c })} aria-label={`Cor ${c}`} aria-pressed={f.color === c} className={cn("h-8 w-8 rounded-full ring-offset-2 ring-offset-ink-900", f.color === c && "ring-2 ring-white")} style={{ background: c }} />)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Frequência" htmlFor="hb-f">
            <Select id="hb-f" value={f.frequency} onChange={(x) => setF({ ...f, frequency: x.target.value })}><option value="DAILY">Diário</option><option value="WEEKLY">Semanal</option></Select>
          </Field>
          {f.frequency === "WEEKLY" && <Field label="Vezes por semana" htmlFor="hb-t"><Input id="hb-t" type="number" min={1} max={7} value={f.targetPerPeriod} onChange={(x) => setF({ ...f, targetPerPeriod: x.target.value })} /></Field>}
        </div>
      </div>
    </Modal>
  );
}
