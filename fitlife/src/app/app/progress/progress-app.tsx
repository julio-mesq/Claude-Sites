"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ArrowRight, Camera, Columns2, Eye, EyeOff, Lock, Plus, Ruler, Scale, Target, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Badge, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Segmented } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { ProgressBar } from "@/components/ui/progress";
import { useConfirm } from "@/components/ui/confirm";
import { MultiLine, TrendArea } from "@/components/charts/charts";
import { MuscleFigure } from "@/components/fitness/muscle-figure";
import { goalSchema, measurementSchema } from "@/lib/validations/tracking";
import { MUSCLE_LABEL } from "@/lib/labels";
import { bmi } from "@/lib/fitness-math";
import { cn, dateKey, formatDate, formatNumber } from "@/lib/utils";

type M = { id: string; measuredAt: string; weightKg: number | null; heightCm: number | null; bodyFatPct: number | null; bodyFatMethod: string | null; chestCm: number | null; waistCm: number | null; hipsCm: number | null; armCm: number | null; thighCm: number | null; calfCm: number | null; neckCm: number | null; notes: string | null };
type P = { id: string; pose: string; takenAt: string; notes: string | null };
type G = { id: string; title: string; metric: string; unit: string; startValue: number; targetValue: number; currentValue: number; deadline: string | null; status: string; pct: number };
type Balance = { data: { group: string; sets: number; intensity: number }[]; neglected: string[]; totalSets: number; days: number };

const FIELDS: [keyof M, string, string][] = [
  ["weightKg", "Peso", "kg"],
  ["bodyFatPct", "% gordura", "%"],
  ["chestCm", "Peito", "cm"],
  ["waistCm", "Cintura", "cm"],
  ["hipsCm", "Quadril", "cm"],
  ["armCm", "Braço", "cm"],
  ["thighCm", "Coxa", "cm"],
  ["calfCm", "Panturrilha", "cm"],
  ["neckCm", "Pescoço", "cm"],
];

export function ProgressApp({ measurements, photos, goals, balance }: { measurements: M[]; photos: P[]; goals: G[]; balance: Balance }) {
  const [tab, setTab] = useState<"overview" | "measures" | "photos" | "goals">("overview");
  const [newOpen, setNewOpen] = useState(false);
  return (
    <div>
      <PageHeader
        eyebrow="Evolução física"
        title="Sua transformação"
        subtitle="Medidas, fotos privadas e metas — tudo a partir dos seus registros."
        action={
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" /> Nova avaliação
          </Button>
        }
      />
      <div className="mb-6 overflow-x-auto">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "overview", label: "Visão geral" },
            { value: "measures", label: "Medidas" },
            { value: "photos", label: "Fotos" },
            { value: "goals", label: "Metas" },
          ]}
        />
      </div>
      {tab === "overview" && <Overview measurements={measurements} balance={balance} goals={goals} onNew={() => setNewOpen(true)} />}
      {tab === "measures" && <Measures measurements={measurements} />}
      {tab === "photos" && <Photos photos={photos} />}
      {tab === "goals" && <Goals goals={goals} />}
      <NewMeasurement open={newOpen} onClose={() => setNewOpen(false)} last={measurements.at(-1)} />
    </div>
  );
}

function Overview({ measurements, balance, goals, onNew }: { measurements: M[]; balance: Balance; goals: G[]; onNew: () => void }) {
  const weights = measurements.filter((m) => m.weightKg != null).map((m) => ({ date: dateKey(new Date(m.measuredAt)), value: m.weightKg! }));
  const last = measurements.at(-1);
  const first = measurements[0];
  const lastHeight = [...measurements].reverse().find((m) => m.heightCm)?.heightCm;
  const lastWeight = weights.at(-1)?.value;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Peso atual", lastWeight != null ? formatNumber(lastWeight, 1) : "—", "kg", weights.length >= 2 ? weights.at(-1)!.value - weights[0]!.value : null],
          ["Cintura", last?.waistCm != null ? formatNumber(last.waistCm, 1) : "—", "cm", first?.waistCm != null && last?.waistCm != null && first.id !== last.id ? last.waistCm - first.waistCm : null],
          ["IMC", lastWeight && lastHeight ? formatNumber(bmi(lastWeight, lastHeight), 1) : "—", "", null],
          ["Avaliações", String(measurements.length), "", null],
        ].map(([l, v, u, d]) => (
          <Card key={l as string} className="p-4">
            <div className="text-xs text-mist">{l}</div>
            <div className="mt-2 font-display text-2xl font-bold">
              {v} <span className="text-sm font-normal text-mist">{u}</span>
            </div>
            {d != null && d !== 0 && <div className="mt-1 text-xs text-neon">{(d as number) > 0 ? "+" : ""}{formatNumber(d as number, 1)} {u} desde o início</div>}
            {l === "IMC" && <div className="mt-1 text-[10px] text-mist-700">Indicador populacional; não avalia composição corporal.</div>}
          </Card>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Evolução do peso" icon={<Scale className="h-4 w-4" />} />
          <div className="p-4">{weights.length >= 2 ? <TrendArea data={weights} unit="kg" label="Peso" height={260} /> : <EmptyState icon={<Scale className="h-6 w-6" />} title="Registre mais avaliações" description="Com dois registros você verá sua linha de tendência." action={<Button size="sm" onClick={onNew}>Nova avaliação</Button>} />}</div>
        </Card>
        <Card>
          <CardHeader title="Equilíbrio muscular" subtitle={`Séries por grupo · últimos ${balance.days} dias`} icon={<Columns2 className="h-4 w-4" />} />
          <div className="p-5">
            {balance.totalSets === 0 ? (
              <EmptyState title="Sem séries registradas" description="Seu mapa muscular aparece conforme você treina." />
            ) : (
              <>
                <MuscleFigure intensity={Object.fromEntries(balance.data.map((d) => [d.group, d.intensity]))} />
                <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  {balance.data.filter((d) => d.group !== "CARDIO" && d.group !== "MOBILITY").map((d) => (
                    <li key={d.group} className="flex justify-between">
                      <span className="text-mist">{MUSCLE_LABEL[d.group]}</span>
                      <span className="tabular-nums">{d.sets}</span>
                    </li>
                  ))}
                </ul>
                {balance.neglected.length > 0 && <p className="mt-4 rounded-xl border border-warning/20 bg-warning/5 p-3 text-xs text-warning">Grupos sem estímulo no período: {balance.neglected.map((g) => MUSCLE_LABEL[g]).join(", ")}.</p>}
              </>
            )}
          </div>
        </Card>
      </div>
      {goals.length > 0 && (
        <Card>
          <CardHeader title="Metas" icon={<Target className="h-4 w-4" />} />
          <div className="grid gap-4 p-5 md:grid-cols-2">
            {goals.slice(0, 4).map((g) => (
              <div key={g.id}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>{g.title}</span>
                  <span className="text-xs text-mist">{Math.round(g.pct)}%</span>
                </div>
                <ProgressBar value={g.pct} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Measures({ measurements }: { measurements: M[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [a, setA] = useState(measurements[0]?.id ?? "");
  const [b, setB] = useState(measurements.at(-1)?.id ?? "");
  const ma = measurements.find((m) => m.id === a);
  const mb = measurements.find((m) => m.id === b);
  const series = useMemo(() => measurements.map((m) => ({ date: dateKey(new Date(m.measuredAt)), waist: m.waistCm, chest: m.chestCm, arm: m.armCm, hips: m.hipsCm })), [measurements]);
  if (measurements.length === 0) return <Card><EmptyState icon={<Ruler className="h-6 w-6" />} title="Nenhuma avaliação" description="Registre peso e circunferências para acompanhar sua evolução." /></Card>;
  const opt = (m: M) => `${formatDate(new Date(m.measuredAt), { day: "2-digit", month: "short", year: "numeric" })}${m.weightKg ? ` · ${m.weightKg} kg` : ""}`;
  return (
    <div className="space-y-5">
      {measurements.length >= 2 && (
        <Card>
          <CardHeader title="Comparar avaliações" icon={<Columns2 className="h-4 w-4" />} />
          <div className="p-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <Field label="De" htmlFor="ca">
                <Select id="ca" value={a} onChange={(e) => setA(e.target.value)}>
                  {measurements.map((m) => <option key={m.id} value={m.id}>{opt(m)}</option>)}
                </Select>
              </Field>
              <ArrowRight className="mx-auto mb-3 hidden h-5 w-5 text-mist sm:block" />
              <Field label="Para" htmlFor="cb">
                <Select id="cb" value={b} onChange={(e) => setB(e.target.value)}>
                  {measurements.map((m) => <option key={m.id} value={m.id}>{opt(m)}</option>)}
                </Select>
              </Field>
            </div>
            {ma && mb && (
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {FIELDS.map(([k, l, u]) => {
                  const va = ma[k] as number | null;
                  const vb = mb[k] as number | null;
                  const d = va != null && vb != null ? Math.round((vb - va) * 10) / 10 : null;
                  return (
                    <div key={k} className="rounded-xl border border-white/5 bg-ink-900/60 p-3">
                      <div className="text-[11px] text-mist">{l}</div>
                      <div className="mt-1 text-sm tabular-nums">
                        {va ?? "—"} → <span className="font-semibold">{vb ?? "—"}</span> {u}
                      </div>
                      {d != null && <div className={cn("text-xs font-medium tabular-nums", d === 0 ? "text-mist" : "text-neon")}>{d > 0 ? "+" : ""}{d} {u}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}
      {series.length >= 2 && (
        <Card>
          <CardHeader title="Circunferências" subtitle="cm" icon={<Ruler className="h-4 w-4" />} />
          <div className="p-4">
            <MultiLine caption="Circunferências ao longo do tempo" data={series} unit="cm" height={280} series={[{ key: "waist", label: "Cintura" }, { key: "chest", label: "Peito" }, { key: "arm", label: "Braço" }, { key: "hips", label: "Quadril" }].filter((s) => series.some((x) => (x as Record<string, unknown>)[s.key] != null))} />
          </div>
        </Card>
      )}
      <Card>
        <CardHeader title="Histórico de medidas" />
        <div className="overflow-x-auto p-5">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs text-mist">
                <th className="pb-2 font-medium">Data</th>
                {FIELDS.map(([k, l]) => <th key={k} className="pb-2 font-medium">{l}</th>)}
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[...measurements].reverse().map((m) => (
                <tr key={m.id}>
                  <td className="py-2.5 text-mist">{formatDate(new Date(m.measuredAt), { day: "2-digit", month: "short", year: "2-digit" })}</td>
                  {FIELDS.map(([k]) => <td key={k} className="py-2.5 tabular-nums">{(m[k] as number | null) ?? "—"}</td>)}
                  <td className="py-2.5 text-right">
                    <button
                      className="p-1 text-mist hover:text-danger"
                      aria-label="Excluir avaliação"
                      onClick={async () => {
                        if (!(await confirm({ title: "Excluir avaliação?", confirmLabel: "Excluir", danger: true }))) return;
                        await api(`/measurements/${m.id}`, { method: "DELETE" });
                        router.refresh();
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {measurements.some((m) => m.bodyFatPct != null) && <p className="mt-3 text-[11px] text-mist-700">% de gordura registrado com o método informado por você. O FitLife não estima composição corporal.</p>}
        </div>
      </Card>
    </div>
  );
}

function NewMeasurement({ open, onClose, last }: { open: boolean; onClose: () => void; last?: M }) {
  const router = useRouter();
  const [f, setF] = useState<Record<string, string>>({ measuredAt: dateKey() });
  const [err, setErr] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  async function save() {
    const payload: Record<string, unknown> = { measuredAt: `${f.measuredAt}T12:00:00`, notes: f.notes || null, bodyFatMethod: f.bodyFatMethod || null };
    for (const [k] of [...FIELDS, ["heightCm"]] as [string][]) payload[k] = f[k] ? Number(f[k]) : null;
    const p = measurementSchema.safeParse(payload);
    if (!p.success) {
      const e: Record<string, string> = {};
      for (const i of p.error.issues) e[(i.path[0] as string) ?? "_"] ??= i.message;
      return setErr(e);
    }
    setErr({});
    setLoading(true);
    try {
      await api("/measurements", { method: "POST", body: p.data });
      toast.success("Avaliação registrada.");
      setF({ measuredAt: dateKey() });
      onClose();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <Modal open={open} onClose={onClose} title="Nova avaliação" description="Preencha apenas o que você mediu." size="lg" footer={<Button onClick={save} loading={loading}>Salvar avaliação</Button>}>
      <div className="space-y-4">
        {err._ && <p className="text-sm text-danger">{err._}</p>}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Data" htmlFor="m-date" error={err.measuredAt}>
            <Input id="m-date" type="date" max={dateKey()} value={f.measuredAt} onChange={(e) => setF({ ...f, measuredAt: e.target.value })} />
          </Field>
          <Field label="Altura (cm)" htmlFor="m-h">
            <Input id="m-h" type="number" inputMode="decimal" value={f.heightCm ?? ""} placeholder={last?.heightCm ? String(last.heightCm) : ""} onChange={(e) => setF({ ...f, heightCm: e.target.value })} />
          </Field>
          {FIELDS.map(([k, l, u]) => (
            <Field key={k} label={`${l} (${u})`} htmlFor={`m-${k}`} error={err[k]}>
              <Input id={`m-${k}`} type="number" inputMode="decimal" step="0.1" value={f[k] ?? ""} placeholder={last?.[k] != null ? String(last[k]) : ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
            </Field>
          ))}
        </div>
        {f.bodyFatPct && (
          <Field label="Método da medição de gordura" htmlFor="m-method" error={err.bodyFatMethod}>
            <Select id="m-method" value={f.bodyFatMethod ?? ""} onChange={(e) => setF({ ...f, bodyFatMethod: e.target.value })}>
              <option value="">Selecione</option>
              {["Bioimpedância", "Adipômetro (dobras cutâneas)", "DEXA", "Pesagem hidrostática", "Outro"].map((o) => <option key={o}>{o}</option>)}
            </Select>
          </Field>
        )}
        <Field label="Observações" htmlFor="m-notes">
          <Textarea id="m-notes" value={f.notes ?? ""} onChange={(e) => setF({ ...f, notes: e.target.value })} maxLength={500} />
        </Field>
      </div>
    </Modal>
  );
}

function Photos({ photos }: { photos: P[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const input = useRef<HTMLInputElement>(null);
  const [pose, setPose] = useState("front");
  const [takenAt, setTakenAt] = useState(dateKey());
  const [uploading, setUploading] = useState(false);
  const [compare, setCompare] = useState<[string, string] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [slider, setSlider] = useState(50);
  async function upload(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("pose", pose);
    fd.append("takenAt", `${takenAt}T12:00:00`);
    setUploading(true);
    try {
      await api("/photos", { method: "POST", body: fd });
      toast.success("Foto salva de forma privada.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro no envio.");
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }
  const poseLabel: Record<string, string> = { front: "Frente", side: "Lado", back: "Costas" };
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex items-start gap-3 rounded-xl border border-neon/20 bg-neon/5 p-3 text-sm">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-neon" />
          <span className="text-mist">Suas fotos são privadas: ficam fora da área pública, só são exibidas para você com sessão ativa e nunca são compartilhadas. As miniaturas ficam desfocadas até você revelá-las.</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Ângulo" htmlFor="ph-pose">
            <Select id="ph-pose" value={pose} onChange={(e) => setPose(e.target.value)}>
              {Object.entries(poseLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
          <Field label="Data" htmlFor="ph-date">
            <Input id="ph-date" type="date" max={dateKey()} value={takenAt} onChange={(e) => setTakenAt(e.target.value)} />
          </Field>
          <Button onClick={() => input.current?.click()} loading={uploading}>
            <Upload className="h-4 w-4" /> Enviar foto
          </Button>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} aria-label="Selecionar foto" />
        </div>
      </Card>
      {photos.length === 0 ? (
        <Card><EmptyState icon={<Camera className="h-6 w-6" />} title="Nenhuma foto" description="Fotos no mesmo ângulo e iluminação facilitam a comparação." /></Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={() => setRevealed((r) => !r)}>
              {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {revealed ? "Ocultar fotos" : "Revelar fotos"}
            </Button>
            {photos.length >= 2 && (
              <Button variant="secondary" size="sm" onClick={() => setCompare([photos[photos.length - 1]!.id, photos[0]!.id])}>
                <Columns2 className="h-4 w-4" /> Comparar antes e depois
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((p) => (
              <figure key={p.id} className="glass group relative overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/v1/photos/${p.id}`} alt={`Foto de evolução (${poseLabel[p.pose]}) de ${formatDate(new Date(p.takenAt))}`} className={cn("aspect-[3/4] w-full object-cover transition-all duration-300", !revealed && "scale-110 blur-xl")} loading="lazy" />
                <figcaption className="flex items-center justify-between p-3 text-xs">
                  <span>
                    {formatDate(new Date(p.takenAt), { day: "2-digit", month: "short", year: "2-digit" })} · <span className="text-mist">{poseLabel[p.pose]}</span>
                  </span>
                  <button
                    className="text-mist hover:text-danger"
                    aria-label="Excluir foto"
                    onClick={async () => {
                      if (!(await confirm({ title: "Excluir foto?", description: "O arquivo será removido permanentemente.", confirmLabel: "Excluir", danger: true }))) return;
                      await api(`/photos/${p.id}`, { method: "DELETE" });
                      router.refresh();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        </>
      )}
      <Modal open={!!compare} onClose={() => setCompare(null)} title="Comparador de fotos" description="Arraste o controle para comparar. Visível apenas para você." size="xl">
        {compare && (
          <div>
            <div className="mb-3 grid grid-cols-2 gap-3">
              {[0, 1].map((i) => (
                <Select key={i} value={compare[i]} onChange={(e) => setCompare((c) => (c ? (i === 0 ? [e.target.value, c[1]] : [c[0], e.target.value]) : c))} aria-label={i === 0 ? "Foto antes" : "Foto depois"}>
                  {photos.map((p) => <option key={p.id} value={p.id}>{formatDate(new Date(p.takenAt), { day: "2-digit", month: "short", year: "numeric" })} · {poseLabel[p.pose]}</option>)}
                </Select>
              ))}
            </div>
            <div className="relative mx-auto aspect-[3/4] max-h-[60vh] overflow-hidden rounded-2xl bg-ink-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/v1/photos/${compare[1]}`} alt="Depois" className="absolute inset-0 h-full w-full object-contain" />
              <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/v1/photos/${compare[0]}`} alt="Antes" className="absolute inset-0 h-full w-full object-contain" />
              </div>
              <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-neon" style={{ left: `${slider}%` }} />
              <Badge className="absolute left-3 top-3">Antes</Badge>
              <Badge tone="neon" className="absolute right-3 top-3">Depois</Badge>
            </div>
            <input type="range" min={0} max={100} value={slider} onChange={(e) => setSlider(Number(e.target.value))} className="mt-4 w-full accent-[#B6FF3B]" aria-label="Posição do comparador" />
          </div>
        )}
      </Modal>
    </div>
  );
}

const METRICS = [
  { v: "weight", l: "Peso (automático)", u: "kg" },
  { v: "body_fat", l: "% de gordura (automático)", u: "%" },
  { v: "waist", l: "Cintura (automático)", u: "cm" },
  { v: "workouts", l: "Número de treinos (automático)", u: "treinos" },
  { v: "custom", l: "Personalizada (manual)", u: "" },
];

function Goals({ goals }: { goals: G[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", metric: "weight", unit: "kg", startValue: "", targetValue: "", deadline: "" });
  const [err, setErr] = useState<string | null>(null);
  const [upd, setUpd] = useState<Record<string, string>>({});
  async function create() {
    const p = goalSchema.safeParse({ ...f, deadline: f.deadline || null, startValue: f.metric === "workouts" ? 0 : f.startValue });
    if (!p.success) return setErr(p.error.issues[0]?.message ?? "Revise os campos.");
    try {
      await api("/goals", { method: "POST", body: p.data });
      toast.success("Meta criada.");
      setOpen(false);
      router.refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Erro.");
    }
  }
  return (
    <div id="metas">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Nova meta
        </Button>
      </div>
      {goals.length === 0 ? (
        <Card><EmptyState icon={<Target className="h-6 w-6" />} title="Nenhuma meta" description="Metas automáticas são atualizadas pelos seus registros; personalizadas, por você." /></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {goals.map((g) => (
            <Card key={g.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{g.title}</div>
                  <div className="text-xs text-mist">
                    {g.startValue} → {g.targetValue} {g.unit}
                    {g.deadline && ` · até ${formatDate(new Date(g.deadline))}`}
                  </div>
                </div>
                {g.status === "COMPLETED" ? <Badge tone="neon">Concluída</Badge> : <Badge>{g.metric === "custom" ? "Manual" : "Automática"}</Badge>}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <ProgressBar value={g.pct} className="flex-1" />
                <span className="text-sm tabular-nums">{Math.round(g.pct)}%</span>
              </div>
              <div className="mt-1 text-xs text-mist">Atual: {formatNumber(g.currentValue, 1)} {g.unit}</div>
              <div className="mt-4 flex items-center gap-2">
                {g.metric === "custom" && g.status === "ACTIVE" && (
                  <>
                    <Input type="number" className="h-9 w-28" value={upd[g.id] ?? ""} onChange={(e) => setUpd({ ...upd, [g.id]: e.target.value })} placeholder="Novo valor" aria-label="Novo valor" />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await api(`/goals/${g.id}`, { method: "PATCH", body: { currentValue: Number(upd[g.id]) } });
                          router.refresh();
                        } catch (e) {
                          toast.error(e instanceof ApiError ? e.message : "Erro.");
                        }
                      }}
                    >
                      Atualizar
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto"
                  aria-label={`Excluir meta ${g.title}`}
                  onClick={async () => {
                    if (!(await confirm({ title: "Excluir meta?", confirmLabel: "Excluir", danger: true }))) return;
                    await api(`/goals/${g.id}`, { method: "DELETE" });
                    router.refresh();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Nova meta" footer={<Button onClick={create}>Criar meta</Button>}>
        <div className="space-y-3">
          {err && <p className="text-sm text-danger">{err}</p>}
          <Field label="Título" htmlFor="g-t">
            <Input id="g-t" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Ex.: Chegar a 70 kg" />
          </Field>
          <Field label="Tipo" htmlFor="g-m">
            <Select id="g-m" value={f.metric} onChange={(e) => { const m = METRICS.find((x) => x.v === e.target.value)!; setF({ ...f, metric: m.v, unit: m.u || f.unit }); }}>
              {METRICS.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            {f.metric !== "workouts" && (
              <Field label="Valor inicial" htmlFor="g-s">
                <Input id="g-s" type="number" value={f.startValue} onChange={(e) => setF({ ...f, startValue: e.target.value })} />
              </Field>
            )}
            <Field label="Meta" htmlFor="g-v">
              <Input id="g-v" type="number" value={f.targetValue} onChange={(e) => setF({ ...f, targetValue: e.target.value })} />
            </Field>
            <Field label="Unidade" htmlFor="g-u">
              <Input id="g-u" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} disabled={f.metric !== "custom"} />
            </Field>
          </div>
          <Field label="Prazo (opcional)" htmlFor="g-d">
            <Input id="g-d" type="date" value={f.deadline} min={dateKey()} onChange={(e) => setF({ ...f, deadline: e.target.value })} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
