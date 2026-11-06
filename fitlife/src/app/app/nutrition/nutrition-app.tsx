"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, ChefHat, ChevronLeft, ChevronRight, Copy, Droplets, Heart, Minus, Plus, RefreshCw, Save, Search, ShoppingCart, Star, Target, Trash2, Utensils } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Badge, Card, CardHeader, EmptyState, PageHeader, Skeleton } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Segmented } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { ProgressBar, Ring } from "@/components/ui/progress";
import { useConfirm } from "@/components/ui/confirm";
import { Bars } from "@/components/charts/charts";
import { MEAL_LABEL } from "@/lib/labels";
import { foodItemSchema, mealEntrySchema, recipeSchema, targetsSchema } from "@/lib/validations/nutrition";
import { addDaysKey, cn, formatDate, formatNumber } from "@/lib/utils";

type Entry = { id: string; name: string; quantity: number; unit: string; calories: number; proteinG: number; carbsG: number; fatG: number };
type Meal = { id: string; type: string; entries: Entry[] };
type Day = { date: string; meals: Meal[]; totals: { calories: number; protein: number; carbs: number; fat: number }; waterMl: number; targets: { calories: number | null; protein: number | null; carbs: number | null; fat: number | null; waterMl: number } };
type Food = { id: string; name: string; brand: string | null; servingQty: number; servingUnit: string; calories: number; proteinG: number; carbsG: number; fatG: number; isFavorite: boolean; userId: string | null; source: string };

const MEALS = ["BREAKFAST", "LUNCH", "SNACK", "DINNER", "SUPPER"] as const;
type Tab = "diary" | "history" | "recipes" | "shopping" | "targets";

export function NutritionApp({ today, initialDay }: { today: string; initialDay: Day }) {
  const [tab, setTab] = useState<Tab>("diary");
  return (
    <div>
      <PageHeader eyebrow="Nutrição" title="Diário alimentar" subtitle="Metas são estimativas gerais, não prescrição nutricional." />
      <div className="mb-6 overflow-x-auto">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "diary", label: "Diário" },
            { value: "history", label: "Histórico" },
            { value: "recipes", label: "Receitas" },
            { value: "shopping", label: "Lista de compras" },
            { value: "targets", label: "Metas" },
          ]}
        />
      </div>
      {tab === "diary" && <Diary today={today} initialDay={initialDay} />}
      {tab === "history" && <History />}
      {tab === "recipes" && <Recipes />}
      {tab === "shopping" && <Shopping />}
      {tab === "targets" && <Targets current={initialDay.targets} />}
    </div>
  );
}

function Diary({ today, initialDay }: { today: string; initialDay: Day }) {
  const confirm = useConfirm();
  const [date, setDate] = useState(today);
  const [day, setDay] = useState<Day | null>(initialDay);
  const [adding, setAdding] = useState<string | null>(null);
  const [tplOpen, setTplOpen] = useState<string | null>(null);
  const load = useCallback(async (d: string) => {
    setDay(null);
    try {
      setDay(await api<Day>(`/nutrition/day?date=${d}`));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao carregar o dia.");
    }
  }, []);
  useEffect(() => {
    if (date !== initialDay.date) load(date);
  }, [date, initialDay.date, load]);
  const refresh = () => load(date);

  async function water(ml: number) {
    try {
      const r = await api<{ waterMl: number }>("/nutrition/water", { method: "POST", body: { date, amountMl: ml } });
      setDay((d) => (d ? { ...d, waterMl: r.waterMl } : d));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro.");
    }
  }

  const t = day?.targets;
  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setDate(addDaysKey(date, -1))} aria-label="Dia anterior">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-40 text-center">
            <div className="font-display font-semibold first-letter:uppercase">{date === today ? "Hoje" : formatDate(date, { weekday: "long" })}</div>
            <div className="text-xs text-mist">{formatDate(date, { day: "2-digit", month: "long", year: "numeric" })}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setDate(addDaysKey(date, 1))} disabled={date >= today} aria-label="Próximo dia">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        {date === today && (
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              const r = await api<{ copied: number }>("/nutrition/copy", { method: "POST", body: { from: addDaysKey(today, -1), to: today } });
              toast[r.copied ? "success" : "info"](r.copied ? `${r.copied} itens copiados de ontem.` : "Nada registrado ontem.");
              refresh();
            }}
          >
            <Copy className="h-4 w-4" /> Repetir ontem
          </Button>
        )}
      </div>

      {!day ? (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center gap-5">
                <Ring value={t?.calories ? (day.totals.calories / t.calories) * 100 : 0} size={130} stroke={11} label="Calorias do dia">
                  <div>
                    <div className="font-display text-2xl font-bold">{formatNumber(day.totals.calories)}</div>
                    <div className="text-[11px] text-mist">{t?.calories ? `de ${formatNumber(t.calories)} kcal` : "kcal"}</div>
                  </div>
                </Ring>
                <div className="flex-1 text-sm">
                  <div className="text-xs text-mist">Restante</div>
                  <div className="font-display text-xl font-bold">{t?.calories ? formatNumber(Math.max(0, t.calories - day.totals.calories)) : "—"}</div>
                  <div className="text-xs text-mist">kcal</div>
                  {t?.calories && <div className="mt-2 text-xs text-neon">{Math.round((day.totals.calories / t.calories) * 100)}% da meta</div>}
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["Proteínas", day.totals.protein, t?.protein, "neon"],
                  ["Carboidratos", day.totals.carbs, t?.carbs, "info"],
                  ["Gorduras", day.totals.fat, t?.fat, "warning"],
                ].map(([l, v, m, tone]) => (
                  <div key={l as string}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{l}</span>
                      <span className="tabular-nums text-mist">
                        {formatNumber(v as number, 1)}
                        {m ? ` / ${m}` : ""} g {m ? `· ${Math.round(((v as number) / (m as number)) * 100)}%` : ""}
                      </span>
                    </div>
                    <ProgressBar value={v as number} max={(m as number) || 1} tone={tone as "neon"} />
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[10px] text-mist-700">Metas estimadas (Mifflin-St Jeor). Ajuste na aba Metas.</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <Droplets className="h-5 w-5 text-info" /> Água
                </div>
                <span className="text-sm tabular-nums text-mist">
                  {(day.waterMl / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} / {(day.targets.waterMl / 1000).toLocaleString("pt-BR")} L
                </span>
              </div>
              <div className="mt-4 flex gap-1" aria-hidden>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className={cn("h-8 flex-1 rounded-md transition-colors", (i + 1) / 10 <= day.waterMl / day.targets.waterMl ? "bg-info" : "bg-white/6")} />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                <Button variant="secondary" size="sm" onClick={() => water(-250)} disabled={day.waterMl === 0} aria-label="Remover 250 ml">
                  <Minus className="h-4 w-4" />
                </Button>
                {[250, 500, 750].map((ml) => (
                  <Button key={ml} variant="secondary" size="sm" onClick={() => water(ml)}>
                    +{ml}ml
                  </Button>
                ))}
              </div>
            </Card>
          </div>
          <div className="space-y-3">
            {MEALS.map((type) => {
              const meal = day.meals.find((m) => m.type === type);
              const kcal = meal?.entries.reduce((a, e) => a + e.calories, 0) ?? 0;
              return (
                <Card key={type}>
                  <div className="flex items-center justify-between gap-2 p-4">
                    <div>
                      <div className="font-semibold">{MEAL_LABEL[type]}</div>
                      <div className="text-xs text-mist">{meal?.entries.length ? `${formatNumber(kcal)} kcal · ${meal.entries.length} item(ns)` : "Nada registrado"}</div>
                    </div>
                    <div className="flex gap-1">
                      {meal?.entries.length ? (
                        <Button variant="ghost" size="sm" onClick={() => setTplOpen(meal.id)} aria-label={`Salvar ${MEAL_LABEL[type]} como refeição personalizada`}>
                          <Save className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <Button variant="secondary" size="sm" onClick={() => setAdding(type)}>
                        <Plus className="h-4 w-4" /> Adicionar
                      </Button>
                    </div>
                  </div>
                  {meal && meal.entries.length > 0 && (
                    <ul className="divide-y divide-white/5 border-t border-white/5">
                      {meal.entries.map((e) => (
                        <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                          <div className="min-w-0">
                            <div className="truncate text-sm">{e.name}</div>
                            <div className="text-[11px] text-mist">
                              {formatNumber(e.quantity, 1)} {e.unit} · P {formatNumber(e.proteinG, 1)} · C {formatNumber(e.carbsG, 1)} · G {formatNumber(e.fatG, 1)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm tabular-nums">{formatNumber(e.calories)} kcal</span>
                            <button
                              className="rounded-lg p-1.5 text-mist hover:bg-danger/10 hover:text-danger"
                              aria-label={`Remover ${e.name}`}
                              onClick={async () => {
                                if (!(await confirm({ title: `Remover ${e.name}?`, confirmLabel: "Remover", danger: true }))) return;
                                await api(`/nutrition/entries/${e.id}`, { method: "DELETE" });
                                refresh();
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
      <AddFood open={!!adding} mealType={adding ?? "BREAKFAST"} date={date} onClose={() => setAdding(null)} onAdded={refresh} />
      <SaveTemplate mealId={tplOpen} onClose={() => setTplOpen(null)} />
    </div>
  );
}

function SaveTemplate({ mealId, onClose }: { mealId: string | null; onClose: () => void }) {
  const [name, setName] = useState("");
  return (
    <Modal
      open={!!mealId}
      onClose={onClose}
      title="Salvar refeição personalizada"
      description="Reutilize esta combinação de alimentos com um clique."
      size="sm"
      footer={
        <Button
          onClick={async () => {
            try {
              await api("/nutrition/templates", { method: "POST", body: { mealId, name } });
              toast.success("Refeição salva.");
              setName("");
              onClose();
            } catch (e) {
              toast.error(e instanceof ApiError ? e.message : "Erro.");
            }
          }}
        >
          Salvar
        </Button>
      }
    >
      <Field label="Nome" htmlFor="tpln">
        <Input id="tpln" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Café da manhã proteico" />
      </Field>
    </Modal>
  );
}

const EMPTY = { name: "", quantity: "100", unit: "g", calories: "", proteinG: "", carbsG: "", fatG: "" };

function AddFood({ open, mealType, date, onClose, onAdded }: { open: boolean; mealType: string; date: string; onClose: () => void; onAdded: () => void }) {
  const [mode, setMode] = useState<"search" | "manual" | "saved">("search");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ items: Food[]; recent: Entry[]; external: (Omit<Food, "id" | "isFavorite" | "userId"> & { externalId: string | null })[]; externalEnabled: boolean } | null>(null);
  const [templates, setTemplates] = useState<{ id: string; name: string | null; entries: Entry[] }[] | null>(null);
  const [base, setBase] = useState<{ id?: string; servingQty: number; calories: number; proteinG: number; carbsG: number; fatG: number } | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saveLib, setSaveLib] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode("search");
    setForm(EMPTY);
    setBase(null);
    setQ("");
  }, [open]);
  useEffect(() => {
    if (!open || mode !== "search") return;
    const t = setTimeout(() => api<typeof results>(`/nutrition/foods?q=${encodeURIComponent(q)}`).then(setResults).catch(() => undefined), 250);
    return () => clearTimeout(t);
  }, [q, open, mode]);
  useEffect(() => {
    if (open && mode === "saved") api<{ items: typeof templates }>("/nutrition/templates").then((r) => setTemplates(r.items)).catch(() => undefined);
  }, [open, mode]);

  // Recalcula macros proporcionalmente à quantidade quando o alimento vem da biblioteca.
  useEffect(() => {
    if (!base) return;
    const f = (Number(form.quantity) || 0) / base.servingQty;
    setForm((p) => ({ ...p, calories: String(Math.round(base.calories * f)), proteinG: String(Math.round(base.proteinG * f * 10) / 10), carbsG: String(Math.round(base.carbsG * f * 10) / 10), fatG: String(Math.round(base.fatG * f * 10) / 10) }));
  }, [form.quantity, base]);

  function pick(f: { id?: string; name: string; servingQty: number; servingUnit: string; calories: number; proteinG: number; carbsG: number; fatG: number }) {
    setBase({ id: f.id, servingQty: f.servingQty, calories: f.calories, proteinG: f.proteinG, carbsG: f.carbsG, fatG: f.fatG });
    setForm({ name: f.name, quantity: String(f.servingQty), unit: f.servingUnit, calories: String(f.calories), proteinG: String(f.proteinG), carbsG: String(f.carbsG), fatG: String(f.fatG) });
    setMode("manual");
  }

  async function submit() {
    const parsed = mealEntrySchema.safeParse({ date, mealType, foodItemId: base?.id ?? null, ...form, saveToLibrary: !base?.id && saveLib });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0] as string, i.message])));
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await api("/nutrition/entries", { method: "POST", body: parsed.data });
      toast.success(`${form.name} adicionado.`);
      onAdded();
      onClose();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao adicionar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Adicionar em ${MEAL_LABEL[mealType]}`} size="lg" footer={mode === "manual" ? <Button onClick={submit} loading={loading}>Adicionar ao diário</Button> : undefined}>
      <Segmented
        size="sm"
        value={mode}
        onChange={(m) => {
          setMode(m);
          if (m === "manual" && !base) setForm(EMPTY);
        }}
        options={[
          { value: "search", label: "Buscar" },
          { value: "manual", label: "Registrar manualmente" },
          { value: "saved", label: "Refeições salvas" },
        ]}
        className="mb-4"
      />
      {mode === "search" && (
        <div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nos seus alimentos" className="pl-10" aria-label="Buscar alimento" autoFocus />
          </div>
          {!results ? (
            <Skeleton className="mt-4 h-40" />
          ) : (
            <div className="mt-4 max-h-[48vh] space-y-4 overflow-y-auto">
              {results.items.length > 0 && (
                <ul className="divide-y divide-white/5">
                  {results.items.map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-2 py-2.5">
                      <button className="min-w-0 flex-1 text-left" onClick={() => pick(f)}>
                        <div className="truncate text-sm font-medium">
                          {f.name} {f.brand && <span className="text-mist">· {f.brand}</span>}
                        </div>
                        <div className="text-[11px] text-mist">
                          {f.servingQty} {f.servingUnit} · {formatNumber(f.calories)} kcal · P {f.proteinG} · C {f.carbsG} · G {f.fatG}
                        </div>
                      </button>
                      {f.userId && (
                        <button
                          className={cn("rounded-lg p-1.5", f.isFavorite ? "text-warning" : "text-mist hover:text-snow")}
                          aria-label={f.isFavorite ? "Remover dos favoritos" : "Favoritar"}
                          onClick={async () => {
                            await api(`/nutrition/foods/${f.id}`, { method: "PATCH" });
                            setResults((r) => (r ? { ...r, items: r.items.map((x) => (x.id === f.id ? { ...x, isFavorite: !x.isFavorite } : x)) } : r));
                          }}
                        >
                          <Star className={cn("h-4 w-4", f.isFavorite && "fill-current")} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {!q && results.recent.length > 0 && (
                <div>
                  <div className="mb-2 text-xs uppercase tracking-wider text-mist">Recentes</div>
                  <ul className="divide-y divide-white/5">
                    {results.recent.map((r) => (
                      <li key={r.id}>
                        <button className="w-full py-2.5 text-left" onClick={() => pick({ name: r.name, servingQty: r.quantity, servingUnit: r.unit, calories: r.calories, proteinG: r.proteinG, carbsG: r.carbsG, fatG: r.fatG })}>
                          <div className="text-sm">{r.name}</div>
                          <div className="text-[11px] text-mist">
                            {r.quantity} {r.unit} · {formatNumber(r.calories)} kcal
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {results.external.length > 0 && (
                <div>
                  <div className="mb-2 text-xs uppercase tracking-wider text-mist">Open Food Facts (base pública — confira com o rótulo)</div>
                  <ul className="divide-y divide-white/5">
                    {results.external.map((f, i) => (
                      <li key={f.externalId ?? i}>
                        <button className="w-full py-2.5 text-left" onClick={() => pick(f)}>
                          <div className="text-sm">
                            {f.name} {f.brand && <span className="text-mist">· {f.brand}</span>}
                          </div>
                          <div className="text-[11px] text-mist">100 g · {f.calories} kcal</div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {results.items.length === 0 && (q || results.recent.length === 0) && results.external.length === 0 && (
                <EmptyState
                  icon={<Utensils className="h-6 w-6" />}
                  title={q ? "Nenhum alimento encontrado" : "Sua biblioteca está vazia"}
                  description={
                    <>
                      Registre manualmente com os valores do rótulo. Marque “salvar na biblioteca” para reutilizar.
                      {!results.externalEnabled && <span className="mt-2 block text-[11px] text-mist-700">Integração com base nutricional externa disponível para configuração (NUTRITION_PROVIDER).</span>}
                    </>
                  }
                  action={
                    <Button size="sm" onClick={() => { setForm({ ...EMPTY, name: q }); setBase(null); setMode("manual"); }}>
                      Registrar manualmente
                    </Button>
                  }
                />
              )}
            </div>
          )}
        </div>
      )}
      {mode === "manual" && (
        <div className="space-y-4">
          <Field label="Alimento" error={errors.name} htmlFor="fn">
            <Input id="fn" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Arroz integral cozido" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantidade" error={errors.quantity} htmlFor="fq">
              <Input id="fq" type="number" inputMode="decimal" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </Field>
            <Field label="Unidade" htmlFor="fu">
              <Select id="fu" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} disabled={!!base}>
                {["g", "ml", "un", "colher", "xícara", "fatia", "porção"].map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["calories", "Calorias (kcal)"],
              ["proteinG", "Proteínas (g)"],
              ["carbsG", "Carboidratos (g)"],
              ["fatG", "Gorduras (g)"],
            ].map(([k, l]) => (
              <Field key={k} label={l} error={errors[k!]} htmlFor={`f-${k}`}>
                <Input id={`f-${k}`} type="number" inputMode="decimal" min={0} step="0.1" value={form[k as keyof typeof form]} onChange={(e) => { setBase(null); setForm({ ...form, [k!]: e.target.value }); }} />
              </Field>
            ))}
          </div>
          {base ? (
            <p className="text-xs text-mist">Valores calculados proporcionalmente à porção de referência ({base.servingQty} {form.unit}).</p>
          ) : (
            <label className="flex items-center gap-2 text-sm text-mist">
              <input type="checkbox" className="h-4 w-4 accent-[#B6FF3B]" checked={saveLib} onChange={(e) => setSaveLib(e.target.checked)} />
              Salvar na minha biblioteca de alimentos
            </label>
          )}
          <p className="text-[11px] text-mist-700">Use os valores do rótulo ou de uma tabela nutricional confiável. O FitLife não inventa valores nutricionais.</p>
        </div>
      )}
      {mode === "saved" && (
        <div>
          {!templates ? (
            <Skeleton className="h-32" />
          ) : templates.length === 0 ? (
            <EmptyState icon={<Heart className="h-6 w-6" />} title="Nenhuma refeição salva" description="No diário, use o botão salvar de uma refeição para reutilizá-la." />
          ) : (
            <ul className="space-y-2">
              {templates.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-ink-900/60 p-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{t.name}</div>
                    <div className="truncate text-xs text-mist">
                      {t.entries.map((e) => e.name).join(", ")} · {formatNumber(t.entries.reduce((a, e) => a + e.calories, 0))} kcal
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={async () => {
                        await api(`/nutrition/templates/${t.id}`, { method: "POST", body: { date, mealType } });
                        toast.success("Refeição adicionada.");
                        onAdded();
                        onClose();
                      }}
                    >
                      Usar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Excluir ${t.name}`}
                      onClick={async () => {
                        await api(`/nutrition/templates/${t.id}`, { method: "DELETE" });
                        setTemplates((l) => l?.filter((x) => x.id !== t.id) ?? null);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
}

function History() {
  const [days, setDays] = useState(14);
  const [data, setData] = useState<{ date: string; calories: number; protein: number; carbs: number; fat: number; waterMl: number }[] | null>(null);
  useEffect(() => {
    setData(null);
    api<{ items: NonNullable<typeof data> }>(`/nutrition/history?days=${days}`).then((r) => setData(r.items)).catch(() => setData([]));
  }, [days]);
  const logged = data?.filter((d) => d.calories > 0) ?? [];
  const avg = (k: "calories" | "protein" | "carbs" | "fat") => (logged.length ? logged.reduce((a, d) => a + d[k], 0) / logged.length : 0);
  return (
    <div className="space-y-4">
      <Segmented size="sm" value={String(days)} onChange={(v) => setDays(Number(v))} options={[{ value: "7", label: "7 dias" }, { value: "14", label: "14 dias" }, { value: "30", label: "30 dias" }]} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Média kcal", avg("calories")],
          ["Proteína média", avg("protein")],
          ["Carbo médio", avg("carbs")],
          ["Gordura média", avg("fat")],
        ].map(([l, v]) => (
          <Card key={l as string} className="p-4">
            <div className="text-xs text-mist">{l}</div>
            <div className="mt-1 font-display text-2xl font-bold">{formatNumber(v as number)}</div>
            <div className="text-[11px] text-mist-700">nos {logged.length} dias registrados</div>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader title="Calorias por dia" subtitle="kcal" />
        <div className="p-4">{!data ? <Skeleton className="h-52" /> : logged.length === 0 ? <EmptyState title="Sem registros no período" /> : <Bars data={data} xKey="date" yKey="calories" label="Calorias" unit="kcal" xFormat="day-month" height={220} />}</div>
      </Card>
    </div>
  );
}

type Recipe = { id: string; title: string; description: string | null; ingredients: string[]; steps: string[]; servings: number; calories: number | null; proteinG: number | null; tags: string[]; userId: string | null };

function Recipes() {
  const [items, setItems] = useState<Recipe[] | null>(null);
  const [open, setOpen] = useState<Recipe | null>(null);
  const [creating, setCreating] = useState(false);
  const load = () => api<{ items: Recipe[] }>("/nutrition/recipes").then((r) => setItems(r.items));
  useEffect(() => {
    load();
  }, []);
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Nova receita
        </Button>
      </div>
      {!items ? (
        <Skeleton className="h-48" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => (
            <button key={r.id} onClick={() => setOpen(r)} className="glass rounded-2xl p-5 text-left transition-all hover:-translate-y-0.5 hover:border-neon/25">
              <ChefHat className="h-6 w-6 text-neon" />
              <div className="mt-3 font-semibold">{r.title}</div>
              <p className="mt-1 line-clamp-2 text-sm text-mist">{r.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {r.tags.slice(0, 3).map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
                {!r.userId && <Badge tone="info">FitLife</Badge>}
              </div>
            </button>
          ))}
        </div>
      )}
      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        title={open?.title ?? ""}
        description={open?.description ?? undefined}
        size="lg"
        footer={
          open && (
            <>
              {open.userId && (
                <Button
                  variant="danger"
                  onClick={async () => {
                    await api(`/nutrition/recipes/${open.id}`, { method: "DELETE" });
                    setOpen(null);
                    load();
                  }}
                >
                  Excluir
                </Button>
              )}
              <Button
                onClick={async () => {
                  const r = await api<{ added: number }>(`/nutrition/recipes/${open.id}`, { method: "POST" });
                  toast.success(`${r.added} ingredientes adicionados à lista de compras.`);
                }}
              >
                <ShoppingCart className="h-4 w-4" /> Adicionar à lista de compras
              </Button>
            </>
          )
        }
      >
        {open && (
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold">Ingredientes · {open.servings} porção(ões)</h3>
              <ul className="space-y-1.5 text-sm text-mist">
                {open.ingredients.map((i) => (
                  <li key={i}>• {i}</li>
                ))}
              </ul>
              {open.calories != null ? <p className="mt-3 text-xs text-mist">{open.calories} kcal por porção (informado pelo autor)</p> : <p className="mt-3 text-[11px] text-mist-700">Valores nutricionais não informados. Registre no diário usando os rótulos dos ingredientes.</p>}
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Modo de preparo</h3>
              <ol className="space-y-2 text-sm text-mist">
                {open.steps.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="font-bold text-neon">{i + 1}.</span> {s}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Modal>
      <RecipeForm open={creating} onClose={() => setCreating(false)} onSaved={load} />
    </div>
  );
}

function RecipeForm({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ title: "", description: "", ingredients: "", steps: "", servings: "1", calories: "", tags: "" });
  const [err, setErr] = useState<string | null>(null);
  async function save() {
    const p = recipeSchema.safeParse({ title: f.title, description: f.description || null, ingredients: f.ingredients.split("\n").map((s) => s.trim()).filter(Boolean), steps: f.steps.split("\n").map((s) => s.trim()).filter(Boolean), servings: f.servings, calories: f.calories === "" ? null : f.calories, tags: f.tags.split(",").map((s) => s.trim()).filter(Boolean) });
    if (!p.success) return setErr(p.error.issues[0]?.message ?? "Revise os campos.");
    try {
      await api("/nutrition/recipes", { method: "POST", body: p.data });
      toast.success("Receita salva.");
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Erro.");
    }
  }
  return (
    <Modal open={open} onClose={onClose} title="Nova receita" size="lg" footer={<Button onClick={save}>Salvar receita</Button>}>
      <div className="space-y-3">
        {err && <p className="text-sm text-danger">{err}</p>}
        <Field label="Título" htmlFor="rt">
          <Input id="rt" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </Field>
        <Field label="Descrição" htmlFor="rd">
          <Input id="rd" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Ingredientes (um por linha)" htmlFor="ri">
            <Textarea id="ri" rows={6} value={f.ingredients} onChange={(e) => setF({ ...f, ingredients: e.target.value })} />
          </Field>
          <Field label="Modo de preparo (um passo por linha)" htmlFor="rs">
            <Textarea id="rs" rows={6} value={f.steps} onChange={(e) => setF({ ...f, steps: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Porções" htmlFor="rp">
            <Input id="rp" type="number" min={1} value={f.servings} onChange={(e) => setF({ ...f, servings: e.target.value })} />
          </Field>
          <Field label="kcal/porção (opcional)" htmlFor="rk">
            <Input id="rk" type="number" min={0} value={f.calories} onChange={(e) => setF({ ...f, calories: e.target.value })} />
          </Field>
          <Field label="Tags (vírgula)" htmlFor="rg">
            <Input id="rg" value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

function Shopping() {
  const [items, setItems] = useState<{ id: string; name: string; quantity: string | null; checked: boolean }[] | null>(null);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const load = () => api<{ items: NonNullable<typeof items> }>("/nutrition/shopping").then((r) => setItems(r.items));
  useEffect(() => {
    load();
  }, []);
  const checked = useMemo(() => items?.filter((i) => i.checked).length ?? 0, [items]);
  return (
    <Card className="mx-auto max-w-2xl p-5">
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          try {
            await api("/nutrition/shopping", { method: "POST", body: { name, quantity: qty || null } });
            setName("");
            setQty("");
            load();
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Erro.");
          }
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Adicionar item" aria-label="Item" />
        <Input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Qtd." className="w-24" aria-label="Quantidade" />
        <Button type="submit" size="icon" aria-label="Adicionar item">
          <Plus className="h-4 w-4" />
        </Button>
      </form>
      {!items ? (
        <Skeleton className="mt-4 h-32" />
      ) : items.length === 0 ? (
        <EmptyState icon={<ShoppingCart className="h-6 w-6" />} title="Lista vazia" description="Adicione itens ou envie ingredientes de uma receita." />
      ) : (
        <ul className="mt-4 divide-y divide-white/5">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 py-2.5">
              <input
                type="checkbox"
                className="h-5 w-5 accent-[#B6FF3B]"
                checked={i.checked}
                aria-label={`Marcar ${i.name}`}
                onChange={async () => {
                  setItems((l) => l?.map((x) => (x.id === i.id ? { ...x, checked: !x.checked } : x)) ?? null);
                  await api(`/nutrition/shopping/${i.id}`, { method: "PATCH" });
                }}
              />
              <span className={cn("flex-1 text-sm", i.checked && "text-mist-700 line-through")}>{i.name}</span>
              {i.quantity && <span className="text-xs text-mist">{i.quantity}</span>}
              <button
                className="p-1 text-mist hover:text-danger"
                aria-label={`Remover ${i.name}`}
                onClick={async () => {
                  await api(`/nutrition/shopping/${i.id}`, { method: "DELETE" });
                  load();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {checked > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-3"
          onClick={async () => {
            await api("/nutrition/shopping", { method: "DELETE" });
            load();
          }}
        >
          Limpar {checked} item(ns) marcados
        </Button>
      )}
    </Card>
  );
}

function Targets({ current }: { current: Day["targets"] }) {
  const [f, setF] = useState({ calorieTarget: String(current.calories ?? ""), proteinTarget: String(current.protein ?? ""), carbsTarget: String(current.carbs ?? ""), fatTarget: String(current.fat ?? "") });
  const [water, setWater] = useState(String(current.waterMl));
  const [loading, setLoading] = useState(false);
  return (
    <Card className="mx-auto max-w-2xl p-6">
      <div className="flex items-center gap-3">
        <Target className="h-6 w-6 text-neon" />
        <div>
          <h2 className="font-semibold">Metas diárias</h2>
          <p className="text-sm text-mist">Estimativas para orientar seu diário. Para um plano individual, consulte um nutricionista.</p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {[
          ["calorieTarget", "Calorias (kcal)"],
          ["proteinTarget", "Proteínas (g)"],
          ["carbsTarget", "Carboidratos (g)"],
          ["fatTarget", "Gorduras (g)"],
        ].map(([k, l]) => (
          <Field key={k} label={l} htmlFor={`t-${k}`}>
            <Input id={`t-${k}`} type="number" min={0} value={f[k as keyof typeof f]} onChange={(e) => setF({ ...f, [k!]: e.target.value })} />
          </Field>
        ))}
        <Field label="Água (ml)" htmlFor="t-water">
          <Input id="t-water" type="number" min={500} max={8000} step={100} value={water} onChange={(e) => setWater(e.target.value)} />
        </Field>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          loading={loading}
          onClick={async () => {
            const p = targetsSchema.safeParse(f);
            if (!p.success) return toast.error(p.error.issues[0]?.message ?? "Valores inválidos.");
            setLoading(true);
            try {
              await api("/nutrition/targets", { method: "PUT", body: p.data });
              await api("/profile/preferences", { method: "PATCH", body: { dailyWaterMl: Number(water) } });
              toast.success("Metas atualizadas.");
            } catch (e) {
              toast.error(e instanceof ApiError ? e.message : "Erro.");
            } finally {
              setLoading(false);
            }
          }}
        >
          Salvar metas
        </Button>
        <Button
          variant="secondary"
          onClick={async () => {
            try {
              const t = await api<{ calorieTarget: number; proteinTarget: number; carbsTarget: number; fatTarget: number }>("/profile/targets", { method: "POST" });
              setF({ calorieTarget: String(t.calorieTarget), proteinTarget: String(t.proteinTarget), carbsTarget: String(t.carbsTarget), fatTarget: String(t.fatTarget) });
              toast.success("Metas recalculadas pelo seu perfil atual.");
            } catch (e) {
              toast.error(e instanceof ApiError ? e.message : "Erro.");
            }
          }}
        >
          <RefreshCw className="h-4 w-4" /> Recalcular pelo perfil
        </Button>
      </div>
      <p className="mt-4 flex items-start gap-2 text-xs text-mist-700">
        <BookOpen className="mt-0.5 h-3.5 w-3.5" /> Cálculo: taxa metabólica basal por Mifflin-St Jeor × fator de atividade, ajustado ao objetivo. Proteína por kg de peso conforme o objetivo.
      </p>
    </Card>
  );
}
