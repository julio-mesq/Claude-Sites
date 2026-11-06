"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Building2, Dumbbell, Flame, Heart, Home, Mountain, Shuffle, Sparkles, Target, TrendingDown, TrendingUp, Wind, Zap } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Chip } from "@/components/ui/misc";
import { Logo } from "@/components/layout/logo";
import { onboardingSchema } from "@/lib/validations/profile";
import { ACTIVITY_PREFS, DIET_PREFS, DIET_RESTRICTIONS, EQUIPMENT_OPTIONS, GOAL_LABEL, LEVEL_LABEL, SEX_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

type State = {
  birthDate: string;
  sex: string;
  heightCm: string;
  weightKg: string;
  goal: string;
  experience: string;
  trainingDaysPerWeek: number;
  location: string;
  equipment: string[];
  sessionMinutes: number;
  dietaryPreferences: string[];
  dietaryRestrictions: string[];
  activityPreferences: string[];
  hasHealthConditions: boolean;
  healthNotes: string;
};

const DEFAULT: State = { birthDate: "", sex: "UNDISCLOSED", heightCm: "", weightKg: "", goal: "", experience: "", trainingDaysPerWeek: 3, location: "", equipment: [], sessionMinutes: 45, dietaryPreferences: [], dietaryRestrictions: [], activityPreferences: [], hasHealthConditions: false, healthNotes: "" };

const GOAL_ICONS: Record<string, typeof Target> = { GAIN_MUSCLE: Dumbbell, LOSE_FAT: TrendingDown, CONDITIONING: Wind, STRENGTH: Zap, HEALTH: Heart, MAINTAIN: Target, MOBILITY: Sparkles };
const LOCATIONS = [
  { v: "GYM", l: "Academia", i: Building2 },
  { v: "HOME", l: "Casa", i: Home },
  { v: "OUTDOOR", l: "Ao ar livre", i: Mountain },
  { v: "MIXED", l: "Misto", i: Shuffle },
];
const STEPS = ["Sobre você", "Objetivo", "Experiência", "Local e equipamentos", "Alimentação", "Atividades e saúde"];

function toggle(list: string[], v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export function OnboardingWizard({ firstName, initial, editing }: { firstName: string; initial?: Partial<State>; editing: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [s, setS] = useState<State>({ ...DEFAULT, ...initial, sex: initial?.sex || "UNDISCLOSED" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ calorieTarget: number; proteinTarget: number; carbsTarget: number; fatTarget: number } | null>(null);
  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));

  function validateStep(): boolean {
    const e: Record<string, string> = {};
    if (step === 0) {
      const r = onboardingSchema.pick({ birthDate: true, heightCm: true, weightKg: true }).safeParse(s);
      if (!r.success) for (const i of r.error.issues) e[i.path[0] as string] ??= i.message;
      if (!s.birthDate) e.birthDate = "Informe sua data de nascimento.";
    }
    if (step === 1 && !s.goal) e.goal = "Escolha um objetivo.";
    if (step === 2 && !s.experience) e.experience = "Escolha seu nível.";
    if (step === 3 && !s.location) e.location = "Escolha onde você treina.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    const parsed = onboardingSchema.safeParse({ ...s, healthNotes: s.healthNotes || null });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Revise os dados.");
      return;
    }
    setLoading(true);
    try {
      const r = await api<{ targets: typeof result }>("/onboarding", { method: "POST", body: parsed.data });
      setResult(r.targets);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Não foi possível salvar.");
    } finally {
      setLoading(false);
    }
  }

  function next() {
    if (!validateStep()) return;
    if (step < STEPS.length - 1) setStep(step + 1);
    else submit();
  }

  if (result)
    return (
      <Shell>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-neon text-ink-950 shadow-glow">
            <Flame className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-bold">{editing ? "Perfil atualizado!" : `Tudo pronto, ${firstName}!`}</h1>
          <p className="mx-auto mt-3 max-w-md text-mist">
            {editing ? "Suas metas estimadas foram recalculadas." : "Criamos seu plano inicial de treinos, hábitos e metas estimadas. Você pode ajustar tudo depois."}
          </p>
          <div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Calorias", `${result.calorieTarget}`, "kcal"],
              ["Proteína", `${result.proteinTarget}`, "g"],
              ["Carbo", `${result.carbsTarget}`, "g"],
              ["Gordura", `${result.fatTarget}`, "g"],
            ].map(([l, v, u]) => (
              <div key={l} className="glass rounded-2xl p-3">
                <div className="text-[11px] text-mist">{l}</div>
                <div className="font-display text-xl font-bold">
                  {v}
                  <span className="text-xs font-normal text-mist"> {u}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-4 max-w-md text-xs text-mist-700">Metas diárias estimadas pela fórmula de Mifflin-St Jeor. Não são prescrição clínica — para um plano individualizado, consulte um nutricionista.</p>
          {s.hasHealthConditions && <p className="mx-auto mt-4 max-w-md rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm text-warning">Você indicou condições de saúde. Recomendamos avaliação médica e de um profissional de educação física antes de iniciar.</p>}
          <Button size="lg" className="mt-8" onClick={() => { router.replace("/app"); router.refresh(); }}>
            Ir para o dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </Shell>
    );

  return (
    <Shell>
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-mist">
          <span>
            Etapa {step + 1} de {STEPS.length} · {STEPS[step]}
          </span>
          <span>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
        </div>
        <div className="mt-2 flex gap-1.5">
          {STEPS.map((_, i) => (
            <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-500", i <= step ? "bg-neon" : "bg-white/8")} />
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
          {step === 0 && (
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Olá, {firstName}! Vamos te conhecer.</h1>
              <p className="mt-2 text-sm text-mist">Esses dados personalizam treinos e metas. Você pode editá-los depois.</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Field label="Data de nascimento" error={errors.birthDate} htmlFor="bd">
                  <Input id="bd" type="date" value={s.birthDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => set("birthDate", e.target.value)} aria-invalid={!!errors.birthDate} />
                </Field>
                <Field label="Sexo (para estimativas)" htmlFor="sex">
                  <Select id="sex" value={s.sex} onChange={(e) => set("sex", e.target.value)}>
                    {Object.entries(SEX_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Altura (cm)" error={errors.heightCm} htmlFor="h">
                  <Input id="h" type="number" inputMode="decimal" placeholder="175" value={s.heightCm} onChange={(e) => set("heightCm", e.target.value)} aria-invalid={!!errors.heightCm} />
                </Field>
                <Field label="Peso (kg)" error={errors.weightKg} htmlFor="w">
                  <Input id="w" type="number" inputMode="decimal" step="0.1" placeholder="72.5" value={s.weightKg} onChange={(e) => set("weightKg", e.target.value)} aria-invalid={!!errors.weightKg} />
                </Field>
              </div>
            </div>
          )}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Qual é o seu principal objetivo?</h1>
              <p className="mt-2 text-sm text-mist">Ele define o volume dos treinos e a estimativa calórica.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {Object.entries(GOAL_LABEL).map(([v, l]) => {
                  const Icon = GOAL_ICONS[v] ?? Target;
                  return (
                    <button key={v} type="button" onClick={() => set("goal", v)} aria-pressed={s.goal === v} className={cn("flex items-center gap-3 rounded-2xl border p-4 text-left transition-all", s.goal === v ? "border-neon/60 bg-neon/10 shadow-glow" : "border-white/8 bg-ink-900/60 hover:border-white/20")}>
                      <span className={cn("grid h-10 w-10 place-items-center rounded-xl", s.goal === v ? "bg-neon text-ink-950" : "bg-white/5 text-mist")}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="font-medium">{l}</span>
                    </button>
                  );
                })}
              </div>
              {errors.goal && <p className="mt-3 text-xs text-danger">{errors.goal}</p>}
            </div>
          )}
          {step === 2 && (
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Sua experiência e disponibilidade</h1>
              <div className="mt-8 space-y-7">
                <div>
                  <div className="mb-3 text-xs font-medium uppercase tracking-wider text-mist">Nível de experiência</div>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(LEVEL_LABEL).map(([v, l]) => (
                      <button key={v} type="button" onClick={() => set("experience", v)} aria-pressed={s.experience === v} className={cn("rounded-xl border px-3 py-3 text-sm font-medium transition-all", s.experience === v ? "border-neon/60 bg-neon/10 text-neon" : "border-white/8 bg-ink-900/60 text-mist")}>
                        {l}
                      </button>
                    ))}
                  </div>
                  {errors.experience && <p className="mt-2 text-xs text-danger">{errors.experience}</p>}
                </div>
                <div>
                  <div className="mb-3 flex justify-between text-xs font-medium uppercase tracking-wider text-mist">
                    <span>Treinos por semana</span>
                    <span className="text-neon">{s.trainingDaysPerWeek}x</span>
                  </div>
                  <input type="range" min={1} max={7} value={s.trainingDaysPerWeek} onChange={(e) => set("trainingDaysPerWeek", Number(e.target.value))} className="w-full accent-[#B6FF3B]" aria-label="Treinos por semana" />
                </div>
                <div>
                  <div className="mb-3 flex justify-between text-xs font-medium uppercase tracking-wider text-mist">
                    <span>Tempo disponível por treino</span>
                    <span className="text-neon">{s.sessionMinutes} min</span>
                  </div>
                  <input type="range" min={15} max={120} step={5} value={s.sessionMinutes} onChange={(e) => set("sessionMinutes", Number(e.target.value))} className="w-full accent-[#B6FF3B]" aria-label="Minutos por treino" />
                </div>
              </div>
            </div>
          )}
          {step === 3 && (
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Onde e com o que você treina?</h1>
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {LOCATIONS.map((l) => (
                  <button key={l.v} type="button" onClick={() => set("location", l.v)} aria-pressed={s.location === l.v} className={cn("flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all", s.location === l.v ? "border-neon/60 bg-neon/10 text-neon" : "border-white/8 bg-ink-900/60 text-mist")}>
                    <l.i className="h-6 w-6" />
                    <span className="text-sm font-medium">{l.l}</span>
                  </button>
                ))}
              </div>
              {errors.location && <p className="mt-2 text-xs text-danger">{errors.location}</p>}
              <div className="mb-3 mt-8 text-xs font-medium uppercase tracking-wider text-mist">Equipamentos disponíveis {s.location === "GYM" && "(academias já incluem os principais)"}</div>
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT_OPTIONS.map((e) => (
                  <Chip key={e} active={s.equipment.includes(e)} onClick={() => set("equipment", toggle(s.equipment, e))}>
                    {e}
                  </Chip>
                ))}
              </div>
            </div>
          )}
          {step === 4 && (
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Sua alimentação</h1>
              <p className="mt-2 text-sm text-mist">Usamos isso para personalizar sugestões gerais. Não é um plano nutricional.</p>
              <div className="mb-3 mt-8 text-xs font-medium uppercase tracking-wider text-mist">Preferências</div>
              <div className="flex flex-wrap gap-2">
                {DIET_PREFS.map((e) => (
                  <Chip key={e} active={s.dietaryPreferences.includes(e)} onClick={() => set("dietaryPreferences", toggle(s.dietaryPreferences, e))}>
                    {e}
                  </Chip>
                ))}
              </div>
              <div className="mb-3 mt-7 text-xs font-medium uppercase tracking-wider text-mist">Restrições ou alergias</div>
              <div className="flex flex-wrap gap-2">
                {DIET_RESTRICTIONS.map((e) => (
                  <Chip key={e} active={s.dietaryRestrictions.includes(e)} onClick={() => set("dietaryRestrictions", toggle(s.dietaryRestrictions, e))}>
                    {e}
                  </Chip>
                ))}
              </div>
            </div>
          )}
          {step === 5 && (
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Atividades e saúde</h1>
              <div className="mb-3 mt-8 text-xs font-medium uppercase tracking-wider text-mist">Atividades que você gosta</div>
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_PREFS.map((e) => (
                  <Chip key={e} active={s.activityPreferences.includes(e)} onClick={() => set("activityPreferences", toggle(s.activityPreferences, e))}>
                    {e}
                  </Chip>
                ))}
              </div>
              <div className="mt-8 rounded-2xl border border-white/8 bg-ink-900/60 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" className="mt-1 h-4 w-4 accent-[#B6FF3B]" checked={s.hasHealthConditions} onChange={(e) => set("hasHealthConditions", e.target.checked)} />
                  <span>
                    <span className="block text-sm font-medium">Tenho condições de saúde, lesões, gestação ou uso medicamentos contínuos</span>
                    <span className="mt-1 block text-xs text-mist">Nesse caso, recomendamos avaliação médica e de um profissional de educação física antes de iniciar.</span>
                  </span>
                </label>
                {s.hasHealthConditions && <Textarea className="mt-3" placeholder="Opcional: descreva brevemente (ex.: dor no joelho direito)" maxLength={500} value={s.healthNotes} onChange={(e) => set("healthNotes", e.target.value)} />}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="mt-10 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => setStep((x) => Math.max(0, x - 1))} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <Button size="lg" onClick={next} loading={loading}>
          {step === STEPS.length - 1 ? (editing ? "Salvar" : "Criar meu plano") : "Continuar"} {step < STEPS.length - 1 && <ArrowRight className="h-4 w-4" />}
          {step === STEPS.length - 1 && <TrendingUp className="h-4 w-4" />}
        </Button>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main id="conteudo" className="relative min-h-dvh overflow-hidden">
      <div className="grid-bg pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-neon/10 blur-[120px]" />
      <div className="relative mx-auto max-w-2xl px-5 py-8">
        <Logo />
        <div className="glass-strong mt-8 rounded-3xl p-6 sm:p-10">{children}</div>
      </div>
    </main>
  );
}
