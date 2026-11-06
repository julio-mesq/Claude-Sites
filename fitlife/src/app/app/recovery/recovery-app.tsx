"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BedDouble, Info, Lightbulb, Moon } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Card, CardHeader, EmptyState, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/misc";
import { Bars } from "@/components/charts/charts";
import { recoverySchema } from "@/lib/validations/tracking";
import { addDaysKey, cn, formatDate } from "@/lib/utils";

type Log = { id: string; date: string; sleepHours: number; fatigue: number; soreness: number; recoveryFeeling: number; isRestDay: boolean; notes: string | null };
type Data = { logs: Log[]; summary: { avgSleep: number | null; avgFatigue: number | null; avgSoreness: number | null; restDays: number; trainingDaysLast7: number }; tips: string[]; today: Log | null };

function Scale({ label, value, onChange, low, high }: { label: string; value: number; onChange: (v: number) => void; low: string; high: string }) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium uppercase tracking-wider text-mist">{label}</div>
      <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} onClick={() => onChange(n)} className={cn("h-11 rounded-xl border text-sm font-semibold transition-all", value === n ? "border-neon bg-neon/15 text-neon" : "border-white/8 text-mist hover:border-white/20")}>
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-mist-700"><span>{low}</span><span>{high}</span></div>
    </div>
  );
}

export function RecoveryApp({ data, today }: { data: Data; today: string }) {
  const router = useRouter();
  const t = data.today;
  const [f, setF] = useState({ date: today, sleepHours: String(t?.sleepHours ?? 7.5), fatigue: t?.fatigue ?? 3, soreness: t?.soreness ?? 2, recoveryFeeling: t?.recoveryFeeling ?? 3, isRestDay: t?.isRestDay ?? false, notes: t?.notes ?? "" });
  const [loading, setLoading] = useState(false);
  const chart = Array.from({ length: 14 }, (_, i) => {
    const d = addDaysKey(today, -13 + i);
    return { date: d, sleep: data.logs.find((l) => l.date === d)?.sleepHours ?? 0 };
  });
  async function save() {
    const p = recoverySchema.safeParse({ ...f, notes: f.notes || null });
    if (!p.success) return toast.error(p.error.issues[0]?.message ?? "Revise.");
    setLoading(true);
    try {
      await api("/recovery", { method: "POST", body: p.data });
      toast.success("Registro de recuperação salvo.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div>
      <PageHeader eyebrow="Smart Recovery" title="Recuperação e descanso" subtitle="Registre como você se sente. Descanso também é treino." />
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-info/20 bg-info/5 p-4 text-sm text-mist">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
        As informações são subjetivas e servem para você observar tendências. O FitLife não avalia se você está apto a treinar. Em caso de dor persistente ou sintomas, procure um profissional de saúde.
      </div>
      <div className="grid gap-5 lg:grid-cols-[400px_1fr]">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-semibold"><Moon className="h-5 w-5 text-violet" /> Check-in {f.date === today ? "de hoje" : formatDate(f.date)}</h2>
          <div className="mt-5 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Data" htmlFor="rc-d"><Input id="rc-d" type="date" max={today} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
              <Field label="Horas de sono" htmlFor="rc-s"><Input id="rc-s" type="number" min={0} max={24} step={0.5} value={f.sleepHours} onChange={(e) => setF({ ...f, sleepHours: e.target.value })} /></Field>
            </div>
            <Scale label="Cansaço percebido" value={f.fatigue} onChange={(v) => setF({ ...f, fatigue: v })} low="Descansado" high="Exausto" />
            <Scale label="Dor muscular percebida" value={f.soreness} onChange={(v) => setF({ ...f, soreness: v })} low="Nenhuma" high="Intensa" />
            <Scale label="Sensação de recuperação" value={f.recoveryFeeling} onChange={(v) => setF({ ...f, recoveryFeeling: v })} low="Ruim" high="Ótima" />
            <Switch checked={f.isRestDay} onChange={(v) => setF({ ...f, isRestDay: v })} label="Dia de descanso" description="Marque quando não houver treino planejado." />
            <Textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Observações (opcional)" maxLength={300} aria-label="Observações" />
            <Button className="w-full" onClick={save} loading={loading}>Salvar check-in</Button>
          </div>
        </Card>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Sono médio (7d)", data.summary.avgSleep != null ? `${data.summary.avgSleep}h` : "—"],
              ["Cansaço médio", data.summary.avgFatigue ?? "—"],
              ["Dor média", data.summary.avgSoreness ?? "—"],
              ["Dias treinados (7d)", data.summary.trainingDaysLast7],
            ].map(([l, v]) => (
              <Card key={l as string} className="p-4"><div className="text-xs text-mist">{l}</div><div className="mt-1 font-display text-2xl font-bold">{v}</div></Card>
            ))}
          </div>
          <Card>
            <CardHeader title="Sugestões gerais" icon={<Lightbulb className="h-4 w-4" />} />
            <div className="p-5">
              {data.tips.length === 0 ? <p className="text-sm text-mist">Faça seu primeiro check-in para receber sugestões gerais.</p> : (
                <ul className="space-y-2">{data.tips.map((tip) => <li key={tip} className="flex gap-2 text-sm text-mist"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />{tip}</li>)}</ul>
              )}
            </div>
          </Card>
          <Card>
            <CardHeader title="Sono nos últimos 14 dias" subtitle="horas" icon={<BedDouble className="h-4 w-4" />} />
            <div className="p-4">{data.logs.length === 0 ? <EmptyState title="Sem registros ainda" /> : <Bars data={chart} xKey="date" yKey="sleep" label="Sono" unit="h" xFormat="day-month" />}</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
