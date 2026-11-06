"use client";

import { useMemo, useState } from "react";
import { Calculator, Disc3, Flame, Percent } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { bmr, activityFactor, estimate1Rm } from "@/lib/fitness-math";
import { formatNumber } from "@/lib/utils";

const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

export function Calculators() {
  const [load, setLoad] = useState("80");
  const [reps, setReps] = useState("6");
  const [target, setTarget] = useState("100");
  const [bar, setBar] = useState("20");
  const [tdee, setTdee] = useState({ sex: "MALE", weight: "75", height: "175", age: "30", days: "3" });

  const oneRm = estimate1Rm(Number(load) || 0, Number(reps) || 0);
  const plates = useMemo(() => {
    let side = ((Number(target) || 0) - (Number(bar) || 0)) / 2;
    if (side < 0) return null;
    const out: number[] = [];
    for (const p of PLATES) while (side >= p - 1e-9) { out.push(p); side -= p; }
    return { out, rest: Math.round(side * 100) / 100 };
  }, [target, bar]);
  const t = bmr(tdee.sex as "MALE", Number(tdee.weight) || 0, Number(tdee.height) || 0, Number(tdee.age) || 0);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader title="1RM estimado" subtitle="Fórmula de Epley" icon={<Calculator className="h-4 w-4" />} />
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Carga (kg)" htmlFor="c-l"><Input id="c-l" type="number" value={load} onChange={(e) => setLoad(e.target.value)} /></Field>
            <Field label="Repetições" htmlFor="c-r"><Input id="c-r" type="number" value={reps} onChange={(e) => setReps(e.target.value)} /></Field>
          </div>
          <div className="mt-5 font-display text-4xl font-bold text-neon">{formatNumber(oneRm, 1)} kg</div>
          <table className="mt-4 w-full text-sm">
            <tbody className="divide-y divide-white/5">
              {[95, 90, 85, 80, 75, 70, 65].map((p) => (
                <tr key={p}><td className="py-1.5 text-mist">{p}%</td><td className="py-1.5 text-right tabular-nums">{formatNumber((oneRm * p) / 100, 1)} kg</td></tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[11px] text-mist-700">Estimativas são menos precisas acima de 10 repetições. Não faça testes máximos sem supervisão.</p>
        </div>
      </Card>
      <Card>
        <CardHeader title="Calculadora de anilhas" subtitle="Anilhas por lado da barra" icon={<Disc3 className="h-4 w-4" />} />
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Carga total (kg)" htmlFor="p-t"><Input id="p-t" type="number" value={target} onChange={(e) => setTarget(e.target.value)} /></Field>
            <Field label="Barra (kg)" htmlFor="p-b"><Select id="p-b" value={bar} onChange={(e) => setBar(e.target.value)}><option value="20">20 kg (olímpica)</option><option value="15">15 kg</option><option value="10">10 kg</option><option value="0">Sem barra</option></Select></Field>
          </div>
          {plates ? (
            <>
              <div className="mt-6 flex min-h-24 items-center justify-center gap-1">
                <div className="h-3 w-16 rounded-l bg-mist-700" />
                {plates.out.map((p, i) => <div key={i} className="rounded-sm bg-gradient-to-b from-neon to-neon-600" style={{ width: 10 + p / 3, height: 30 + p * 2.6 }} title={`${p} kg`} />)}
                <div className="h-3 w-6 rounded-r bg-mist-700" />
              </div>
              <p className="mt-3 text-center text-sm">{plates.out.length ? plates.out.join(" + ") + " kg por lado" : "Apenas a barra"}</p>
              {plates.rest > 0 && <p className="mt-1 text-center text-xs text-warning">Faltam {plates.rest} kg por lado com as anilhas padrão.</p>}
            </>
          ) : <p className="mt-6 text-sm text-danger">A carga total deve ser maior que o peso da barra.</p>}
        </div>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader title="Gasto energético estimado" subtitle="Mifflin-St Jeor × fator de atividade" icon={<Flame className="h-4 w-4" />} />
        <div className="grid gap-5 p-5 md:grid-cols-[1fr_280px]">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Field label="Sexo" htmlFor="t-s"><Select id="t-s" value={tdee.sex} onChange={(e) => setTdee({ ...tdee, sex: e.target.value })}><option value="MALE">Masculino</option><option value="FEMALE">Feminino</option><option value="UNDISCLOSED">Não informar</option></Select></Field>
            <Field label="Peso (kg)" htmlFor="t-w"><Input id="t-w" type="number" value={tdee.weight} onChange={(e) => setTdee({ ...tdee, weight: e.target.value })} /></Field>
            <Field label="Altura (cm)" htmlFor="t-h"><Input id="t-h" type="number" value={tdee.height} onChange={(e) => setTdee({ ...tdee, height: e.target.value })} /></Field>
            <Field label="Idade" htmlFor="t-a"><Input id="t-a" type="number" value={tdee.age} onChange={(e) => setTdee({ ...tdee, age: e.target.value })} /></Field>
            <Field label="Treinos/sem" htmlFor="t-d"><Input id="t-d" type="number" min={0} max={7} value={tdee.days} onChange={(e) => setTdee({ ...tdee, days: e.target.value })} /></Field>
          </div>
          <div className="rounded-2xl border border-white/5 bg-ink-900/60 p-4">
            <div className="flex justify-between text-sm"><span className="text-mist">Basal</span><span className="font-semibold">{formatNumber(t)} kcal</span></div>
            <div className="mt-2 flex justify-between text-sm"><span className="text-mist">Com atividade</span><span className="font-display text-xl font-bold text-neon">{formatNumber(t * activityFactor(Number(tdee.days) || 0))} kcal</span></div>
            <p className="mt-3 flex gap-1.5 text-[11px] text-mist-700"><Percent className="h-3 w-3 shrink-0" /> Estimativa populacional com margem de erro. Não é prescrição.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
