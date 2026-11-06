"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronLeft, ChevronRight, Info, Minus, Pause, Play, Plus, SkipForward, Square, Timer, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ProgressBar, Ring } from "@/components/ui/progress";
import { useConfirm } from "@/components/ui/confirm";
import { MuscleFigure } from "@/components/fitness/muscle-figure";
import { MUSCLE_LABEL } from "@/lib/labels";
import { cn, formatDuration } from "@/lib/utils";

type PlanItem = { exerciseId: string; name: string; slug: string; group: string; isCardio: boolean; sets: number; reps: string; loadKg: number | null; restSec: number; cautions: string[] };
type SetRow = { id: string; exerciseId: string; exerciseName: string; group: string; setNumber: number; reps: number | null; loadKg: number | null; durationSec: number | null; distanceKm: number | null };
type Suggestion = { lastLoad: number | null; lastReps: number[]; suggestedLoad: number | null; reason: string };

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.4);
  } catch {
    /* áudio indisponível */
  }
  navigator.vibrate?.([200, 100, 200]);
}

export function Player({ session, plan: initialPlan, library, initialSets }: { session: { id: string; name: string; startedAt: string }; plan: PlanItem[]; library: PlanItem[]; initialSets: SetRow[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [plan, setPlan] = useState<PlanItem[]>(initialPlan);
  const [sets, setSets] = useState<SetRow[]>(initialSets);
  const [idx, setIdx] = useState(() => {
    const i = initialPlan.findIndex((p) => initialSets.filter((s) => s.exerciseId === p.exerciseId).length < p.sets);
    return i < 0 ? 0 : i;
  });
  const [now, setNow] = useState(Date.now());
  const [rest, setRest] = useState<{ endsAt: number; total: number; paused?: number } | null>(null);
  const [reps, setReps] = useState("");
  const [load, setLoad] = useState("");
  const [minutes, setMinutes] = useState("");
  const [km, setKm] = useState("");
  const [saving, setSaving] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [picker, setPicker] = useState(plan.length === 0);
  const [suggestions, setSuggestions] = useState<Record<string, Suggestion>>({});
  const beeped = useRef(false);

  const current = plan[idx];
  const next = plan[idx + 1];
  const doneFor = useCallback((exId: string) => sets.filter((s) => s.exerciseId === exId).length, [sets]);
  const totalPlanned = plan.reduce((a, p) => a + p.sets, 0);
  const totalDone = plan.reduce((a, p) => a + Math.min(p.sets, doneFor(p.exerciseId)), 0);
  const elapsed = Math.floor((now - new Date(session.startedAt).getTime()) / 1000);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  // Mantém a tela ligada durante o treino quando suportado.
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => undefined);
    return () => void lock?.release().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (plan.length === 0) return;
    api<Record<string, Suggestion>>("/suggestions", { method: "POST", body: { items: plan.filter((p) => !p.isCardio).map((p) => ({ exerciseId: p.exerciseId, reps: p.reps, muscleGroup: p.group, loadKg: p.loadKg })) } })
      .then(setSuggestions)
      .catch(() => undefined);
  }, [plan]);

  // Preenche os campos ao trocar de exercício.
  useEffect(() => {
    if (!current) return;
    const last = [...sets].reverse().find((s) => s.exerciseId === current.exerciseId);
    const sug = suggestions[current.exerciseId];
    const topReps = current.reps.split("-").at(-1)?.replace(/\D/g, "") ?? "";
    setReps(last?.reps != null ? String(last.reps) : current.reps.match(/s|min/i) ? "" : topReps);
    setLoad(last?.loadKg != null ? String(last.loadKg) : sug?.suggestedLoad != null ? String(sug.suggestedLoad) : current.loadKg != null ? String(current.loadKg) : "");
    const timed = current.reps.match(/(\d+)\s*min/i);
    setMinutes(current.isCardio && timed ? timed[1]! : "");
    setKm("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, current?.exerciseId, suggestions]);

  const restLeft = rest ? Math.max(0, Math.ceil(((rest.paused ?? rest.endsAt) - (rest.paused ? 0 : now)) / 1000)) : 0;
  const restRemaining = rest ? (rest.paused ? Math.ceil(rest.paused / 1000) : restLeft) : 0;
  useEffect(() => {
    if (rest && !rest.paused && restLeft === 0 && !beeped.current) {
      beeped.current = true;
      beep();
      toast.success("Descanso concluído. Próxima série!");
      setRest(null);
    }
  }, [rest, restLeft]);

  const setDoneCount = current ? doneFor(current.exerciseId) : 0;
  const exerciseComplete = current ? setDoneCount >= current.sets : false;

  async function logSet() {
    if (!current) return;
    const body = current.isCardio
      ? { exerciseId: current.exerciseId, setNumber: setDoneCount + 1, durationSec: minutes ? Math.round(Number(minutes) * 60) : null, distanceKm: km ? Number(km) : null, reps: null }
      : { exerciseId: current.exerciseId, setNumber: setDoneCount + 1, reps: reps === "" ? null : Number(reps), loadKg: load === "" ? null : Number(load), durationSec: current.reps.match(/s$/i) && reps ? Number(reps) : null };
    if (!current.isCardio && body.reps == null) return toast.error("Informe as repetições (ou segundos) realizadas.");
    if (current.isCardio && body.durationSec == null && body.distanceKm == null) return toast.error("Informe o tempo ou a distância.");
    setSaving(true);
    try {
      const s = await api<{ id: string }>(`/sessions/${session.id}/sets`, { method: "POST", body });
      setSets((l) => [...l, { id: s.id, exerciseId: current.exerciseId, exerciseName: current.name, group: current.group, setNumber: body.setNumber, reps: body.reps ?? null, loadKg: "loadKg" in body ? (body.loadKg ?? null) : null, durationSec: body.durationSec ?? null, distanceKm: "distanceKm" in body ? (body.distanceKm ?? null) : null }]);
      const finishedExercise = setDoneCount + 1 >= current.sets;
      if (finishedExercise && idx < plan.length - 1) {
        toast.success(`${current.name} concluído!`);
        setIdx(idx + 1);
      }
      const isLastOverall = finishedExercise && idx === plan.length - 1;
      if (current.restSec > 0 && !isLastOverall) {
        beeped.current = false;
        setRest({ endsAt: Date.now() + current.restSec * 1000, total: current.restSec });
      }
      if (isLastOverall) {
        toast.success("Todas as séries planejadas foram concluídas!");
        setFinishOpen(true);
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao registrar série.");
    } finally {
      setSaving(false);
    }
  }

  async function undo() {
    const last = sets.at(-1);
    if (!last) return;
    try {
      await api(`/sessions/${session.id}/sets/${last.id}`, { method: "DELETE" });
      setSets((l) => l.slice(0, -1));
      const i = plan.findIndex((p) => p.exerciseId === last.exerciseId);
      if (i >= 0) setIdx(i);
      setRest(null);
      toast("Última série removida.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro.");
    }
  }

  async function abandon() {
    if (!(await confirm({ title: "Encerrar sem concluir?", description: sets.length ? "As séries registradas serão mantidas no histórico como treino interrompido, sem XP." : "Nenhuma série foi registrada.", confirmLabel: "Encerrar", danger: true }))) return;
    await api(`/sessions/${session.id}/finish`, { method: "POST", body: { status: "ABANDONED" } });
    router.replace("/app/workouts");
    router.refresh();
  }

  const sug = current ? suggestions[current.exerciseId] : undefined;
  const stepLoad = (d: number) => setLoad((v) => String(Math.max(0, Math.round(((Number(v) || 0) + d) * 10) / 10)));
  const stepReps = (d: number) => setReps((v) => String(Math.max(0, (Number(v) || 0) + d)));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-mist">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-75" />
              <span className="relative h-2 w-2 rounded-full bg-neon" />
            </span>
            Em andamento
          </div>
          <h1 className="truncate font-display text-2xl font-bold">{session.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="glass rounded-xl px-3 py-2 text-right">
            <div className="text-[10px] uppercase tracking-wider text-mist">Tempo</div>
            <div className="font-display text-lg font-bold tabular-nums" aria-live="off">
              {formatDuration(elapsed)}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={abandon} aria-label="Encerrar treino">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {plan.length > 0 && (
        <div className="mb-5">
          <div className="mb-1.5 flex justify-between text-xs text-mist">
            <span>Progresso geral</span>
            <span>
              {totalDone}/{totalPlanned} séries
            </span>
          </div>
          <ProgressBar value={totalDone} max={totalPlanned || 1} label="Progresso do treino" />
        </div>
      )}

      <AnimatePresence>
        {rest && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-strong mb-5 flex flex-col items-center gap-4 rounded-3xl border-neon/30 p-6 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-5">
              <Ring value={(restRemaining / rest.total) * 100} size={96} stroke={8} label={`Descanso: ${restRemaining} segundos`}>
                <span className="font-display text-2xl font-bold tabular-nums">{restRemaining}</span>
              </Ring>
              <div>
                <div className="text-xs uppercase tracking-wider text-mist">Descanso</div>
                <div className="font-display text-xl font-bold">Recupere o fôlego</div>
                {current && !exerciseComplete && <div className="text-sm text-mist">Próxima: série {setDoneCount + 1} de {current.name}</div>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setRest((r) => (r ? { ...r, endsAt: (r.paused ? r.endsAt : r.endsAt) + 15000, total: r.total + 15, paused: r.paused ? r.paused + 15000 : undefined } : r))}>
                +15s
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRest((r) => (r ? (r.paused ? { ...r, endsAt: Date.now() + r.paused, paused: undefined } : { ...r, paused: r.endsAt - Date.now() }) : r))}
                aria-label={rest.paused ? "Retomar descanso" : "Pausar descanso"}
              >
                {rest.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button size="sm" onClick={() => setRest(null)}>
                <SkipForward className="h-4 w-4" /> Pular descanso
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {current ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <Card className="relative overflow-hidden p-5 sm:p-7">
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-neon/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge tone="neon">
                    Exercício {idx + 1} de {plan.length}
                  </Badge>
                  <h2 className="mt-3 font-display text-3xl font-bold">{current.name}</h2>
                  <p className="mt-1 text-sm text-mist">
                    {MUSCLE_LABEL[current.group]} · meta {current.sets}×{current.reps}
                    {current.restSec ? ` · ${current.restSec}s descanso` : ""}
                  </p>
                </div>
                <Link href={`/app/workouts/exercises/${current.slug}`} target="_blank" className="rounded-lg p-2 text-mist hover:bg-white/5 hover:text-snow" aria-label="Ver instruções do exercício">
                  <Info className="h-5 w-5" />
                </Link>
              </div>

              <div className="mt-6 flex gap-2" aria-label="Séries">
                {Array.from({ length: Math.max(current.sets, setDoneCount) }).map((_, i) => (
                  <div key={i} className={cn("grid h-10 flex-1 place-items-center rounded-xl border text-sm font-semibold transition-all", i < setDoneCount ? "border-neon bg-neon text-ink-950" : i === setDoneCount ? "border-neon/60 bg-neon/10 text-neon" : "border-white/8 text-mist-700")}>
                    {i < setDoneCount ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                ))}
              </div>

              {sug && !current.isCardio && (
                <div className="mt-5 rounded-xl border border-info/20 bg-info/5 p-3 text-sm">
                  <span className="font-medium text-info">Sugestão:</span> <span className="text-mist">{sug.suggestedLoad != null ? `${sug.suggestedLoad} kg. ` : ""}{sug.reason}</span>
                  {sug.lastLoad != null && <div className="mt-1 text-xs text-mist-700">Última vez: {sug.lastLoad} kg · reps {sug.lastReps.join(", ")}</div>}
                </div>
              )}

              {exerciseComplete ? (
                <div className="mt-6 rounded-2xl border border-neon/30 bg-neon/5 p-4 text-center">
                  <div className="font-semibold text-neon">Exercício concluído</div>
                  <div className="mt-3 flex justify-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setPlan((p) => p.map((x, i) => (i === idx ? { ...x, sets: x.sets + 1 } : x)))}>
                      <Plus className="h-4 w-4" /> Série extra
                    </Button>
                    {idx < plan.length - 1 ? (
                      <Button size="sm" onClick={() => setIdx(idx + 1)}>
                        Próximo exercício <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => setFinishOpen(true)}>
                        Finalizar treino
                      </Button>
                    )}
                  </div>
                </div>
              ) : current.isCardio ? (
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-xs uppercase tracking-wider text-mist">Tempo (min)</span>
                    <Input type="number" inputMode="decimal" min={0} value={minutes} onChange={(e) => setMinutes(e.target.value)} className="h-14 text-center font-display text-2xl" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs uppercase tracking-wider text-mist">Distância (km)</span>
                    <Input type="number" inputMode="decimal" min={0} step={0.1} value={km} onChange={(e) => setKm(e.target.value)} className="h-14 text-center font-display text-2xl" placeholder="—" />
                  </label>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div>
                    <span className="mb-1.5 block text-xs uppercase tracking-wider text-mist">Carga (kg)</span>
                    <div className="flex items-center gap-1.5">
                      <Button variant="secondary" size="icon" onClick={() => stepLoad(-2.5)} aria-label="Diminuir carga">
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input type="number" inputMode="decimal" min={0} step={0.5} value={load} onChange={(e) => setLoad(e.target.value)} className="h-14 text-center font-display text-2xl" aria-label="Carga em kg" placeholder="—" />
                      <Button variant="secondary" size="icon" onClick={() => stepLoad(2.5)} aria-label="Aumentar carga">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <span className="mb-1.5 block text-xs uppercase tracking-wider text-mist">{current.reps.match(/s$/i) ? "Segundos" : "Repetições"}</span>
                    <div className="flex items-center gap-1.5">
                      <Button variant="secondary" size="icon" onClick={() => stepReps(-1)} aria-label="Diminuir repetições">
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input type="number" inputMode="numeric" min={0} value={reps} onChange={(e) => setReps(e.target.value)} className="h-14 text-center font-display text-2xl" aria-label="Repetições realizadas" />
                      <Button variant="secondary" size="icon" onClick={() => stepReps(1)} aria-label="Aumentar repetições">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {!exerciseComplete && (
                <Button size="lg" className="mt-5 h-14 w-full text-base" onClick={logSet} loading={saving}>
                  <Check className="h-5 w-5" /> Concluir série {setDoneCount + 1}
                </Button>
              )}

              <div className="mt-4 flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </Button>
                <Button variant="ghost" size="sm" onClick={undo} disabled={sets.length === 0}>
                  <Undo2 className="h-4 w-4" /> Desfazer série
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIdx(Math.min(plan.length - 1, idx + 1))} disabled={idx >= plan.length - 1}>
                  Pular <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              {current.cautions.length > 0 && <p className="mt-4 border-t border-white/5 pt-4 text-xs text-mist-700">⚠ {current.cautions.join(" ")}</p>}
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="p-4">
              <MuscleFigure primary={current.group as never} className="mx-auto h-28 w-auto" />
            </Card>
            {next && (
              <Card className="p-4">
                <div className="text-xs uppercase tracking-wider text-mist">Próximo exercício</div>
                <div className="mt-1 font-semibold">{next.name}</div>
                <div className="text-xs text-mist">
                  {next.sets}×{next.reps} · {MUSCLE_LABEL[next.group]}
                </div>
              </Card>
            )}
            <Card className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-mist">Roteiro</span>
                {library.length > 0 && (
                  <button onClick={() => setPicker(true)} className="text-xs text-neon hover:underline">
                    + Exercício
                  </button>
                )}
              </div>
              <ol className="space-y-1">
                {plan.map((p, i) => {
                  const d = doneFor(p.exerciseId);
                  return (
                    <li key={`${p.exerciseId}-${i}`}>
                      <button onClick={() => setIdx(i)} className={cn("flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm", i === idx ? "bg-neon/10 text-snow" : "text-mist hover:bg-white/5")}>
                        <span className="truncate">{p.name}</span>
                        <span className={cn("shrink-0 text-xs tabular-nums", d >= p.sets && "text-neon")}>
                          {d}/{p.sets}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </Card>
            <Button variant="outline" className="w-full" onClick={() => setFinishOpen(true)} disabled={sets.length === 0}>
              <Square className="h-4 w-4" /> Finalizar treino
            </Button>
          </div>
        </div>
      ) : (
        <Card className="p-10 text-center">
          <Timer className="mx-auto h-10 w-10 text-neon" />
          <h2 className="mt-4 text-xl font-semibold">Treino livre</h2>
          <p className="mt-1 text-sm text-mist">Adicione os exercícios que você vai fazer.</p>
          <Button className="mt-5" onClick={() => setPicker(true)}>
            <Plus className="h-4 w-4" /> Adicionar exercício
          </Button>
        </Card>
      )}

      <FreePicker
        open={picker && library.length > 0}
        onClose={() => setPicker(false)}
        library={library}
        onPick={(p) => {
          setPlan((l) => [...l, p]);
          setIdx(plan.length);
          setPicker(false);
        }}
      />
      <FinishModal open={finishOpen} onClose={() => setFinishOpen(false)} sessionId={session.id} setsCount={sets.length} />
    </div>
  );
}

function FreePicker({ open, onClose, library, onPick }: { open: boolean; onClose: () => void; library: PlanItem[]; onPick: (p: PlanItem) => void }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => library.filter((l) => l.name.toLowerCase().includes(q.toLowerCase())).slice(0, 60), [library, q]);
  return (
    <Modal open={open} onClose={onClose} title="Adicionar exercício" size="lg">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" aria-label="Buscar exercício" />
      <ul className="mt-3 max-h-[50vh] divide-y divide-white/5 overflow-y-auto">
        {list.map((l) => (
          <li key={l.exerciseId}>
            <button onClick={() => onPick(l)} className="flex w-full justify-between px-1 py-3 text-left text-sm hover:bg-white/[0.03]">
              <span>{l.name}</span>
              <span className="text-xs text-mist">{MUSCLE_LABEL[l.group]}</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

function FinishModal({ open, onClose, sessionId, setsCount }: { open: boolean; onClose: () => void; sessionId: string; setsCount: number }) {
  const router = useRouter();
  const [effort, setEffort] = useState(7);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  async function finish() {
    setLoading(true);
    try {
      const r = await api<{ xp: number; newRecords: { exercise: string; loadKg: number; reps: number }[]; durationSec: number }>(`/sessions/${sessionId}/finish`, { method: "POST", body: { status: "COMPLETED", perceivedEffort: effort, notes: notes || null } });
      if (r.xp > 0) toast.success(`Treino concluído! +${r.xp} XP`);
      else toast.success("Treino concluído!", { description: r.durationSec < 300 ? "Sessões com menos de 5 minutos não somam XP." : "Limite diário de XP por treinos atingido." });
      r.newRecords.forEach((rec) => toast(`🏆 Novo recorde: ${rec.exercise}`, { description: `${rec.loadKg} kg × ${rec.reps}` }));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao finalizar.");
      setLoading(false);
    }
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Finalizar treino"
      description={`${setsCount} série(s) registradas.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Continuar treinando
          </Button>
          <Button onClick={finish} loading={loading}>
            Salvar treino
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <div className="mb-2 flex justify-between text-xs font-medium uppercase tracking-wider text-mist">
            <span>Esforço percebido</span>
            <span className="text-neon">{effort}/10</span>
          </div>
          <input type="range" min={1} max={10} value={effort} onChange={(e) => setEffort(Number(e.target.value))} className="w-full accent-[#B6FF3B]" aria-label="Esforço percebido de 1 a 10" />
          <div className="mt-1 flex justify-between text-[10px] text-mist-700">
            <span>Muito leve</span>
            <span>Máximo</span>
          </div>
        </div>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="Como foi o treino? (opcional)" aria-label="Observações" />
      </div>
    </Modal>
  );
}
