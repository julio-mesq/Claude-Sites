"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Chip, Switch } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { workoutSchema } from "@/lib/validations/fitness";
import { MUSCLE_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

type Ex = { id: string; name: string; group: string; equipment: string; defaultSets: number; defaultReps: string; defaultRestSec: number };
type Item = { key: string; exerciseId: string; name: string; group: string; sets: number; reps: string; loadKg: string; restSec: number; notes: string };
export type BuilderInitial = { id?: string; name: string; description: string; focus: string; isTemplate: boolean; estimatedMinutes: number; items: Omit<Item, "key">[] };

let k = 0;
const key = () => `i${++k}`;

export function WorkoutBuilder({ exercises, initial }: { exercises: Ex[]; initial?: BuilderInitial }) {
  const router = useRouter();
  const [meta, setMeta] = useState({ name: initial?.name ?? "", description: initial?.description ?? "", focus: initial?.focus ?? "", isTemplate: initial?.isTemplate ?? false, estimatedMinutes: initial?.estimatedMinutes ?? 45 });
  const [items, setItems] = useState<Item[]>(initial?.items.map((i) => ({ ...i, key: key() })) ?? []);
  const [picker, setPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [drag, setDrag] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    setItems((list) => {
      const next = [...list];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it!);
      return next;
    });
  };
  const update = (i: number, patch: Partial<Item>) => setItems((l) => l.map((it, n) => (n === i ? { ...it, ...patch } : it)));

  async function save() {
    const payload = {
      ...meta,
      focus: meta.focus || null,
      description: meta.description || null,
      items: items.map((i) => ({ exerciseId: i.exerciseId, sets: i.sets, reps: i.reps.trim(), loadKg: i.loadKg === "" ? null : Number(i.loadKg), restSec: i.restSec, notes: i.notes || null })),
    };
    const parsed = workoutSchema.safeParse(payload);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      for (const iss of parsed.error.issues) e[iss.path.join(".")] ??= iss.message;
      setErrors(e);
      toast.error(parsed.error.issues[0]?.message ?? "Revise o treino.");
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (initial?.id) await api(`/workouts/${initial.id}`, { method: "PUT", body: parsed.data });
      else await api("/workouts", { method: "POST", body: parsed.data });
      toast.success("Treino salvo.");
      router.push("/app/workouts");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? (e.code === "PLAN_REQUIRED" ? `Limite de treinos do seu plano atingido. ${e.message}` : e.message) : "Erro ao salvar.");
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Criador de treinos" title={initial?.id ? "Editar treino" : "Novo treino"} action={<Button onClick={save} loading={saving}>Salvar treino</Button>} />
      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <Card className="h-fit space-y-4 p-5">
          <Field label="Nome" error={errors.name} htmlFor="wn">
            <Input id="wn" value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} placeholder="Ex.: Superiores A" maxLength={80} />
          </Field>
          <Field label="Descrição" htmlFor="wd">
            <Textarea id="wd" value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} maxLength={500} placeholder="Opcional" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Foco" htmlFor="wf">
              <Select id="wf" value={meta.focus} onChange={(e) => setMeta({ ...meta, focus: e.target.value })}>
                <option value="">Variado</option>
                {Object.entries(MUSCLE_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Duração (min)" htmlFor="wm">
              <Input id="wm" type="number" min={5} max={300} value={meta.estimatedMinutes} onChange={(e) => setMeta({ ...meta, estimatedMinutes: Number(e.target.value) })} />
            </Field>
          </div>
          <Switch checked={meta.isTemplate} onChange={(v) => setMeta({ ...meta, isTemplate: v })} label="Salvar como modelo" description="Modelos aparecem em destaque e servem de base para novas versões." />
        </Card>
        <div>
          {items.length === 0 && (
            <Card className="grid place-items-center p-10 text-center">
              <p className="text-sm text-mist">{errors.items ?? "Adicione exercícios da biblioteca para montar seu treino."}</p>
            </Card>
          )}
          <ol className="space-y-3">
            {items.map((it, i) => (
              <li
                key={it.key}
                draggable
                onDragStart={() => setDrag(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (drag !== null) move(drag, i);
                  setDrag(null);
                }}
                className={cn("glass rounded-2xl p-4 transition-opacity", drag === i && "opacity-50")}
              >
                <div className="flex items-start gap-3">
                  <GripVertical className="mt-1 hidden h-5 w-5 shrink-0 cursor-grab text-mist-700 sm:block" aria-hidden />
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-neon/10 text-xs font-bold text-neon">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{it.name}</div>
                        <div className="text-xs text-mist">{MUSCLE_LABEL[it.group]}</div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button onClick={() => move(i, i - 1)} disabled={i === 0} className="rounded-lg p-1.5 text-mist hover:bg-white/5 disabled:opacity-30" aria-label="Mover para cima">
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button onClick={() => move(i, i + 1)} disabled={i === items.length - 1} className="rounded-lg p-1.5 text-mist hover:bg-white/5 disabled:opacity-30" aria-label="Mover para baixo">
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button onClick={() => setItems((l) => l.filter((_, n) => n !== i))} className="rounded-lg p-1.5 text-danger hover:bg-danger/10" aria-label={`Remover ${it.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Field label="Séries" error={errors[`items.${i}.sets`]}>
                        <Input type="number" min={1} max={20} value={it.sets} onChange={(e) => update(i, { sets: Number(e.target.value) })} aria-label="Séries" />
                      </Field>
                      <Field label="Repetições" error={errors[`items.${i}.reps`]}>
                        <Input value={it.reps} onChange={(e) => update(i, { reps: e.target.value })} placeholder="10 ou 8-12" aria-label="Repetições" />
                      </Field>
                      <Field label="Carga (kg)" error={errors[`items.${i}.loadKg`]}>
                        <Input type="number" min={0} step={0.5} value={it.loadKg} onChange={(e) => update(i, { loadKg: e.target.value })} placeholder="—" aria-label="Carga" />
                      </Field>
                      <Field label="Descanso (s)" error={errors[`items.${i}.restSec`]}>
                        <Input type="number" min={0} max={900} step={15} value={it.restSec} onChange={(e) => update(i, { restSec: Number(e.target.value) })} aria-label="Descanso" />
                      </Field>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <Button variant="outline" className="mt-4 w-full border-dashed" onClick={() => setPicker(true)}>
            <Plus className="h-4 w-4" /> Adicionar exercício
          </Button>
        </div>
      </div>
      <Picker
        open={picker}
        onClose={() => setPicker(false)}
        exercises={exercises}
        onPick={(e) => {
          setItems((l) => [...l, { key: key(), exerciseId: e.id, name: e.name, group: e.group, sets: e.defaultSets, reps: e.defaultReps.replace(/\s*cada/, ""), loadKg: "", restSec: e.defaultRestSec, notes: "" }]);
          toast.success(`${e.name} adicionado.`);
        }}
      />
    </div>
  );
}

function Picker({ open, onClose, exercises, onPick }: { open: boolean; onClose: () => void; exercises: Ex[]; onPick: (e: Ex) => void }) {
  const [q, setQ] = useState("");
  const [g, setG] = useState("");
  const list = useMemo(() => {
    const n = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    return exercises.filter((e) => (!g || e.group === g) && (!q || n(e.name).includes(n(q))));
  }, [exercises, q, g]);
  return (
    <Modal open={open} onClose={onClose} title="Adicionar exercício" size="lg" footer={<Button onClick={onClose}>Concluir</Button>}>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar exercício" className="pl-10" aria-label="Buscar exercício" />
      </div>
      <div className="my-3 flex gap-2 overflow-x-auto pb-1">
        <Chip active={!g} onClick={() => setG("")}>
          Todos
        </Chip>
        {Object.entries(MUSCLE_LABEL).map(([v, l]) => (
          <Chip key={v} active={g === v} onClick={() => setG(v)}>
            {l}
          </Chip>
        ))}
      </div>
      <ul className="max-h-[45vh] divide-y divide-white/5 overflow-y-auto">
        {list.map((e) => (
          <li key={e.id}>
            <button onClick={() => onPick(e)} className="flex w-full items-center justify-between gap-3 px-1 py-3 text-left hover:bg-white/[0.03]">
              <span>
                <span className="block text-sm font-medium">{e.name}</span>
                <span className="text-xs text-mist">
                  {MUSCLE_LABEL[e.group]} · {e.equipment}
                </span>
              </span>
              <Plus className="h-4 w-4 text-neon" />
            </button>
          </li>
        ))}
        {list.length === 0 && <li className="py-8 text-center text-sm text-mist">Nenhum exercício encontrado.</li>}
      </ul>
    </Modal>
  );
}
