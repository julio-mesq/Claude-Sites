"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Clock, Copy, Dumbbell, History, MoreVertical, Pencil, Plus, Search, Sparkles, Trash2, Trophy, Zap } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/card";
import { Button, buttonClass } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Chip, Segmented } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm";
import { MuscleFigure } from "@/components/fitness/muscle-figure";
import { StartWorkoutButton } from "@/components/app/start-workout-button";
import { DIFFICULTY_LABEL, MUSCLE_LABEL } from "@/lib/labels";
import { formatDate, formatDuration, formatNumber } from "@/lib/utils";

type Tab = "mine" | "library" | "history" | "records";
type W = { id: string; name: string; description: string | null; focus: string | null; isTemplate: boolean; minutes: number; exercises: { name: string; group: string; sets: number; reps: string }[] };
type H = { id: string; name: string; status: string; startedAt: string; durationSec: number | null; volume: number; sets: number; xp: number; cardioKm: number };
type R = { id: string; exercise: string; slug: string; group: string; loadKg: number; reps: number; e1rm: number; date: string };
type E = { id: string; slug: string; name: string; group: string; secondary: string[]; equipment: string; difficulty: string };

export function WorkoutsHub({ initialTab, workouts, history, records, exercises }: { initialTab: Tab; workouts: W[]; history: H[]; records: R[]; exercises: E[] }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [quick, setQuick] = useState(false);
  return (
    <div>
      <PageHeader
        eyebrow="Treinamento"
        title="Seus treinos"
        subtitle="Crie, execute e acompanhe cada sessão."
        action={
          <>
            <Button variant="secondary" onClick={() => setQuick(true)}>
              <Zap className="h-4 w-4" /> Treino rápido
            </Button>
            <Link href="/app/workouts/new" className={buttonClass("primary")}>
              <Plus className="h-4 w-4" /> Novo treino
            </Link>
          </>
        }
      />
      <div className="mb-6 overflow-x-auto">
        <Segmented
          value={tab}
          onChange={(t) => {
            setTab(t);
            window.history.replaceState(null, "", `?tab=${t}`);
          }}
          options={[
            { value: "mine", label: `Meus treinos (${workouts.length})` },
            { value: "library", label: "Biblioteca" },
            { value: "history", label: "Histórico" },
            { value: "records", label: "Recordes" },
          ]}
        />
      </div>
      {tab === "mine" && <MyWorkouts workouts={workouts} />}
      {tab === "library" && <Library exercises={exercises} />}
      {tab === "history" && <HistoryList history={history} />}
      {tab === "records" && <Records records={records} />}
      <QuickWorkout open={quick} onClose={() => setQuick(false)} />
    </div>
  );
}

function MyWorkouts({ workouts }: { workouts: W[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [menu, setMenu] = useState<string | null>(null);
  if (workouts.length === 0)
    return (
      <Card>
        <EmptyState icon={<Dumbbell className="h-6 w-6" />} title="Nenhum treino ainda" description="Crie um treino do zero ou gere um treino rápido para começar agora." action={<Link href="/app/workouts/new" className={buttonClass("primary", "sm")}>Criar treino</Link>} />
      </Card>
    );
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {workouts.map((w) => {
        const groups = [...new Set(w.exercises.map((e) => e.group))];
        return (
          <Card key={w.id} className="group relative flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-neon/20">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/app/workouts/${w.id}`} className="block truncate font-display text-lg font-bold hover:text-neon">
                  {w.name}
                </Link>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone="neon">
                    <Clock className="h-3 w-3" /> {w.minutes} min
                  </Badge>
                  <Badge>{w.exercises.length} exercícios</Badge>
                  {w.isTemplate && <Badge tone="violet">Modelo</Badge>}
                </div>
              </div>
              <div className="relative">
                <button onClick={() => setMenu(menu === w.id ? null : w.id)} className="rounded-lg p-1.5 text-mist hover:bg-white/5 hover:text-snow" aria-label={`Ações do treino ${w.name}`} aria-expanded={menu === w.id}>
                  <MoreVertical className="h-4 w-4" />
                </button>
                {menu === w.id && (
                  <div className="glass-strong absolute right-0 top-9 z-20 w-44 rounded-xl p-1" onMouseLeave={() => setMenu(null)}>
                    <Link href={`/app/workouts/${w.id}/edit`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-mist hover:bg-white/5 hover:text-snow">
                      <Pencil className="h-4 w-4" /> Editar
                    </Link>
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-mist hover:bg-white/5 hover:text-snow"
                      onClick={async () => {
                        setMenu(null);
                        try {
                          await api(`/workouts/${w.id}/duplicate`, { method: "POST" });
                          toast.success("Treino duplicado.");
                          router.refresh();
                        } catch (e) {
                          toast.error(e instanceof ApiError ? e.message : "Erro ao duplicar.");
                        }
                      }}
                    >
                      <Copy className="h-4 w-4" /> Duplicar
                    </button>
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/10"
                      onClick={async () => {
                        setMenu(null);
                        if (!(await confirm({ title: `Excluir "${w.name}"?`, description: "O histórico de sessões já realizadas será mantido.", confirmLabel: "Excluir", danger: true }))) return;
                        await api(`/workouts/${w.id}`, { method: "DELETE" });
                        toast.success("Treino excluído.");
                        router.refresh();
                      }}
                    >
                      <Trash2 className="h-4 w-4" /> Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 grid flex-1 grid-cols-[1fr_92px] items-center gap-3">
              <ul className="space-y-1.5 text-sm text-mist">
                {w.exercises.slice(0, 4).map((e, i) => (
                  <li key={i} className="truncate">
                    <span className="text-snow/80">{e.name}</span> · {e.sets}×{e.reps}
                  </li>
                ))}
                {w.exercises.length > 4 && <li className="text-xs text-mist-700">+{w.exercises.length - 4} exercícios</li>}
              </ul>
              <MuscleFigure intensity={Object.fromEntries(groups.map((g) => [g, w.exercises.filter((e) => e.group === g).length / w.exercises.length + 0.3]))} />
            </div>
            <StartWorkoutButton workoutId={w.id} className="mt-5 w-full" />
          </Card>
        );
      })}
    </div>
  );
}

function Library({ exercises }: { exercises: E[] }) {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<string>("");
  const [diff, setDiff] = useState<string>("");
  const list = useMemo(() => {
    const n = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    return exercises.filter((e) => (!group || e.group === group) && (!diff || e.difficulty === diff) && (!q || n(e.name).includes(n(q)) || n(e.equipment).includes(n(q))));
  }, [exercises, q, group, diff]);
  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou equipamento" className="pl-10" aria-label="Buscar exercícios" />
        </div>
        <Select value={diff} onChange={(e) => setDiff(e.target.value)} className="sm:w-48" aria-label="Dificuldade">
          <option value="">Todas as dificuldades</option>
          {Object.entries(DIFFICULTY_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </div>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        <Chip active={!group} onClick={() => setGroup("")}>
          Todos
        </Chip>
        {Object.entries(MUSCLE_LABEL).map(([v, l]) => (
          <Chip key={v} active={group === v} onClick={() => setGroup(v)}>
            {l}
          </Chip>
        ))}
      </div>
      {list.length === 0 ? (
        <Card>
          <EmptyState icon={<Search className="h-6 w-6" />} title="Nenhum exercício encontrado" description="Tente outro termo ou remova os filtros." />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((e) => (
            <Link key={e.id} href={`/app/workouts/exercises/${e.slug}`} className="glass group rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:border-neon/25">
              <div className="mb-3 rounded-xl bg-ink-950/50 p-2">
                <MuscleFigure primary={e.group as never} secondary={e.secondary as never[]} className="mx-auto h-24 w-auto" />
              </div>
              <div className="font-semibold group-hover:text-neon">{e.name}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone="neon">{MUSCLE_LABEL[e.group]}</Badge>
                <Badge>{e.equipment}</Badge>
                <Badge>{DIFFICULTY_LABEL[e.difficulty]}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryList({ history }: { history: H[] }) {
  if (history.length === 0)
    return (
      <Card>
        <EmptyState icon={<History className="h-6 w-6" />} title="Histórico vazio" description="Suas sessões concluídas aparecerão aqui com duração, volume e XP." />
      </Card>
    );
  return (
    <Card className="divide-y divide-white/5">
      {history.map((h) => (
        <Link key={h.id} href={`/app/workouts/session/${h.id}`} className="flex flex-col gap-2 p-4 hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-medium">
              {h.name} {h.status === "ABANDONED" && <Badge tone="warning">Interrompido</Badge>}
            </div>
            <div className="mt-0.5 text-xs text-mist">{formatDate(new Date(h.startedAt), { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge>{formatDuration(h.durationSec ?? 0)}</Badge>
            <Badge>{h.sets} séries</Badge>
            {h.volume > 0 && <Badge>{formatNumber(h.volume)} kg volume</Badge>}
            {h.cardioKm > 0 && <Badge>{formatNumber(h.cardioKm, 1)} km</Badge>}
            {h.xp > 0 && <Badge tone="neon">+{h.xp} XP</Badge>}
          </div>
        </Link>
      ))}
    </Card>
  );
}

function Records({ records }: { records: R[] }) {
  if (records.length === 0)
    return (
      <Card>
        <EmptyState icon={<Trophy className="h-6 w-6" />} title="Nenhum recorde ainda" description="Registre carga e repetições nas séries. Detectamos automaticamente seus recordes pelo 1RM estimado (fórmula de Epley)." />
      </Card>
    );
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {records.map((r) => (
        <Link key={r.id} href={`/app/workouts/exercises/${r.slug}`} className="glass flex items-center gap-4 rounded-2xl p-4 hover:border-neon/25">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-neon to-neon-600 text-ink-950">
            <Trophy className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium">{r.exercise}</div>
            <div className="text-sm text-neon">
              {formatNumber(r.loadKg, 1)} kg × {r.reps}
            </div>
            <div className="text-[11px] text-mist">
              1RM est. {formatNumber(r.e1rm, 1)} kg · {formatDate(new Date(r.date))}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function QuickWorkout({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [minutes, setMinutes] = useState(30);
  const [focus, setFocus] = useState("FULL");
  const [equipment, setEquipment] = useState<"available" | "bodyweight">("available");
  const [plan, setPlan] = useState<{ name: string; estimatedMinutes: number; items: { exerciseId: string; name: string; muscleGroup: string; sets: number; reps: string; restSec: number }[] } | null>(null);
  const [loading, setLoading] = useState(false);
  async function generate() {
    setLoading(true);
    try {
      setPlan(await api("/workouts/quick", { method: "POST", body: { minutes, focus, equipment } }));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao gerar treino.");
    } finally {
      setLoading(false);
    }
  }
  async function saveAndStart() {
    if (!plan) return;
    setLoading(true);
    try {
      const w = await api<{ id: string }>("/workouts", { method: "POST", body: { name: plan.name, estimatedMinutes: plan.estimatedMinutes, focus: focus === "FULL" ? null : focus, items: plan.items.map((i) => ({ exerciseId: i.exerciseId, sets: i.sets, reps: i.reps, restSec: i.restSec })) } });
      const s = await api<{ id: string }>("/sessions", { method: "POST", body: { workoutId: w.id } });
      router.push(`/app/workouts/session/${s.id}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao iniciar.");
      setLoading(false);
    }
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Treino rápido"
      description="Geramos uma sessão a partir do tempo e foco escolhidos, usando seu nível e equipamentos."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={generate} loading={loading && !plan}>
            <Sparkles className="h-4 w-4" /> {plan ? "Gerar outro" : "Gerar treino"}
          </Button>
          {plan && (
            <Button onClick={saveAndStart} loading={loading}>
              Salvar e iniciar
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <div className="mb-2 flex justify-between text-xs font-medium uppercase tracking-wider text-mist">
            <span>Tempo</span>
            <span className="text-neon">{minutes} min</span>
          </div>
          <input type="range" min={10} max={90} step={5} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="w-full accent-[#B6FF3B]" aria-label="Duração" />
        </div>
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-mist">Foco</div>
          <div className="flex flex-wrap gap-2">
            <Chip active={focus === "FULL"} onClick={() => setFocus("FULL")}>
              Corpo inteiro
            </Chip>
            {Object.entries(MUSCLE_LABEL).map(([v, l]) => (
              <Chip key={v} active={focus === v} onClick={() => setFocus(v)}>
                {l}
              </Chip>
            ))}
          </div>
        </div>
        <Segmented value={equipment} onChange={setEquipment} options={[{ value: "available", label: "Meus equipamentos" }, { value: "bodyweight", label: "Só peso corporal" }]} />
        {plan && (
          <div className="rounded-2xl border border-neon/20 bg-neon/5 p-4">
            <div className="font-semibold">{plan.name}</div>
            <ol className="mt-3 space-y-2">
              {plan.items.map((i, n) => (
                <li key={i.exerciseId} className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    <span className="mr-2 text-mist-700">{n + 1}.</span>
                    {i.name}
                  </span>
                  <span className="shrink-0 text-xs text-mist">
                    {i.sets}×{i.reps} · {i.restSec}s
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </Modal>
  );
}
