import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, Clock, Droplets, Dumbbell, Flame, Ruler, Scale, Target, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { requireUser } from "@/server/auth/guard";
import { dashboard, weeklyReview } from "@/server/services/insights";
import { Badge, Card, CardHeader, EmptyState } from "@/components/ui/card";
import { ProgressBar, Ring } from "@/components/ui/progress";
import { Stat } from "@/components/ui/misc";
import { buttonClass } from "@/components/ui/button";
import { Bars, MultiLine, TrendArea } from "@/components/charts/charts";
import { PulseOrb } from "@/components/charts/pulse-orb";
import { StartWorkoutButton } from "@/components/app/start-workout-button";
import { MUSCLE_LABEL } from "@/lib/labels";
import { formatDate, formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

function greeting() {
  const h = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hourCycle: "h23", timeZone: "America/Sao_Paulo" }).format(new Date()));
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireUser();
  const [d, review, sp] = await Promise.all([dashboard(user.id), weeklyReview(user.id), searchParams]);
  const n = d.nutrition;
  const kcalPct = n.targets.calories ? (n.totals.calories / n.targets.calories) * 100 : 0;

  return (
    <div className="space-y-6">
      {sp.denied && <div className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">Você não tem permissão para acessar aquela área.</div>}
      {/* Cabeçalho */}
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-neon/12 blur-[90px]" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-mist first-letter:uppercase">{new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Sao_Paulo" }).format(new Date())}</p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
              {greeting()}, <span className="text-gradient">{d.user.firstName}</span>
            </h1>
            <p className="mt-2 text-sm text-mist">
              {d.stats.weekWorkouts >= d.stats.weeklyTarget ? "Meta semanal batida. Excelente trabalho!" : `Faltam ${d.stats.weeklyTarget - d.stats.weekWorkouts} treino(s) para sua meta da semana.`}
            </p>
          </div>
          <div className="w-full max-w-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-snow">Nível {d.user.level}</span>
              <span className="text-mist">
                {d.user.current}/{d.user.needed} XP
              </span>
            </div>
            <ProgressBar value={d.user.pct} className="mt-2 h-2.5" label="Progresso para o próximo nível" />
          </div>
        </div>
      </section>

      {/* Indicadores */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Indicadores">
        <Stat label="Peso atual" value={d.stats.currentWeight != null ? formatNumber(d.stats.currentWeight, 1) : "—"} unit="kg" icon={<Scale className="h-4 w-4" />} hint={d.stats.weightDelta != null && d.stats.weightDelta !== 0 ? <span className="inline-flex items-center gap-1">{d.stats.weightDelta < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}{d.stats.weightDelta > 0 ? "+" : ""}{formatNumber(d.stats.weightDelta, 1)} kg desde o início</span> : "Registre em Evolução"} />
        <Stat label="Treinos realizados" value={d.stats.totalWorkouts} icon={<Dumbbell className="h-4 w-4" />} hint="Total concluído" />
        <Stat label="Sequência ativa" value={d.stats.streak} unit="dias" icon={<Flame className="h-4 w-4" />} tone="warning" hint="Dias seguidos com registros" />
        <Stat label="Minutos treinados" value={formatNumber(d.stats.totalMinutes)} unit="min" icon={<Clock className="h-4 w-4" />} tone="info" hint={`${d.stats.weekMinutes} min nesta semana`} />
        <Stat label="Metas concluídas" value={`${d.stats.goalsCompleted}/${d.stats.goalsTotal}`} icon={<Target className="h-4 w-4" />} tone="violet" hint={d.stats.goalsTotal ? "Metas recentes" : "Crie metas em Evolução"} />
        <div className="glass rounded-2xl p-4">
          <div className="text-xs font-medium text-mist">Progresso semanal</div>
          <div className="mt-2 flex items-center gap-3">
            <Ring value={(d.stats.weekWorkouts / d.stats.weeklyTarget) * 100} size={56} stroke={6} label={`${d.stats.weekWorkouts} de ${d.stats.weeklyTarget} treinos`}>
              <span className="text-[11px] font-bold">{Math.min(100, Math.round((d.stats.weekWorkouts / d.stats.weeklyTarget) * 100))}%</span>
            </Ring>
            <div>
              <div className="font-display text-xl font-bold">
                {d.stats.weekWorkouts}/{d.stats.weeklyTarget}
              </div>
              <div className="text-xs text-mist">treinos</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {/* Próximo treino */}
        <Card className="relative overflow-hidden lg:col-span-1">
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-neon/10 blur-3xl" />
          <CardHeader title="Próximo treino" icon={<Dumbbell className="h-4 w-4" />} subtitle={d.next?.scheduledFor ? `Agendado: ${formatDate(new Date(d.next.scheduledFor), { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}` : "Sugestão pela sua rotina"} />
          {d.next ? (
            <div className="relative p-5">
              <h2 className="font-display text-2xl font-bold">{d.next.name}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="neon">
                  <Clock className="h-3 w-3" /> ~{d.next.minutes} min
                </Badge>
                <Badge>{d.next.exercises} exercícios</Badge>
              </div>
              <p className="mt-3 text-sm text-mist">{d.next.groups.map((g) => MUSCLE_LABEL[g]).join(" · ")}</p>
              <div className="mt-6 flex gap-2">
                <StartWorkoutButton workoutId={d.next.id} className="flex-1" />
                <Link href={`/app/workouts/${d.next.id}`} className={buttonClass("secondary", "md")}>
                  Detalhes
                </Link>
              </div>
            </div>
          ) : (
            <EmptyState icon={<Dumbbell className="h-6 w-6" />} title="Nenhum treino criado" description="Monte seu primeiro treino ou gere um treino rápido." action={<Link href="/app/workouts/new" className={buttonClass("primary", "sm")}>Criar treino</Link>} />
          )}
        </Card>

        {/* Pulse */}
        <Card className="flex flex-col items-center p-5 text-center">
          <div className="flex w-full items-center justify-between">
            <span className="text-[15px] font-semibold">FitLife Pulse</span>
            <Link href="/app/pulse" className="text-xs text-mist hover:text-neon">
              Detalhes →
            </Link>
          </div>
          <div className="my-2">
            <PulseOrb score={d.pulse.score} label={d.pulse.label} size={190} hasData={d.pulse.hasData} />
          </div>
          <p className="text-xs text-mist">{d.pulse.focus}</p>
          <p className="mt-2 text-[10px] text-mist-700">Índice de consistência dos seus registros. Não é avaliação de saúde.</p>
        </Card>

        {/* Nutrição */}
        <Card>
          <CardHeader title="Nutrição de hoje" icon={<Droplets className="h-4 w-4" />} action={<Link href="/app/nutrition" className="text-xs text-mist hover:text-neon">Diário →</Link>} />
          <div className="p-5">
            {n.targets.calories ? (
              <div className="flex items-center gap-5">
                <Ring value={kcalPct} size={110} stroke={10} label={`${n.totals.calories} de ${n.targets.calories} kcal`}>
                  <div>
                    <div className="font-display text-lg font-bold">{formatNumber(n.totals.calories)}</div>
                    <div className="text-[10px] text-mist">/{formatNumber(n.targets.calories)} kcal</div>
                  </div>
                </Ring>
                <div className="flex-1 space-y-2.5">
                  {[
                    ["Proteínas", n.totals.protein, n.targets.protein, "neon"],
                    ["Carboidratos", n.totals.carbs, n.targets.carbs, "info"],
                    ["Gorduras", n.totals.fat, n.targets.fat, "warning"],
                  ].map(([l, v, t, tone]) => (
                    <div key={l as string}>
                      <div className="mb-1 flex justify-between text-[11px]">
                        <span className="text-mist">{l}</span>
                        <span className="tabular-nums">
                          {formatNumber(v as number)}/{t}g
                        </span>
                      </div>
                      <ProgressBar value={v as number} max={(t as number) || 1} tone={tone as "neon"} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-mist">Complete seu perfil para estimarmos metas diárias.</p>
            )}
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/5 bg-ink-900/60 p-3">
              <Droplets className="h-5 w-5 text-info" />
              <div className="flex-1">
                <div className="flex justify-between text-xs">
                  <span>Água</span>
                  <span className="tabular-nums text-mist">
                    {(n.waterMl / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} / {(n.targets.waterMl / 1000).toLocaleString("pt-BR")} L
                  </span>
                </div>
                <ProgressBar value={n.waterMl} max={n.targets.waterMl} tone="info" className="mt-1.5" />
              </div>
            </div>
            <p className="mt-3 text-[10px] text-mist-700">Metas estimadas, não prescrição clínica.</p>
          </div>
        </Card>
      </section>

      {/* Gráficos */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Evolução do peso" subtitle="kg · registros em Evolução" icon={<Scale className="h-4 w-4" />} />
          <div className="p-4 pt-2">
            {d.charts.weight.length >= 2 ? (
              <TrendArea data={d.charts.weight} unit="kg" label="Peso" />
            ) : (
              <EmptyState icon={<Scale className="h-6 w-6" />} title="Poucos registros de peso" description="Registre seu peso periodicamente para ver a tendência." action={<Link href="/app/progress" className={buttonClass("secondary", "sm")}>Registrar medida</Link>} />
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Histórico de treinos" subtitle="Treinos concluídos por semana (8 semanas)" icon={<Trophy className="h-4 w-4" />} />
          <div className="p-4 pt-2">
            {d.charts.weekly.some((w) => w.workouts > 0) ? (
              <Bars data={d.charts.weekly} xKey="week" yKey="workouts" label="Treinos" xFormat="day-month" highlightLast />
            ) : (
              <EmptyState icon={<Dumbbell className="h-6 w-6" />} title="Nenhum treino concluído ainda" description="Conclua seu primeiro treino para ver o histórico." />
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Frequência semanal" subtitle="Dias da semana em que você mais treina" icon={<CalendarClock className="h-4 w-4" />} />
          <div className="p-4 pt-2">
            {d.charts.weekday.some((w) => w.workouts > 0) ? <Bars data={d.charts.weekday} xKey="day" yKey="workouts" label="Treinos" /> : <EmptyState title="Sem dados de frequência" description="Seu padrão aparece após alguns treinos." />}
          </div>
        </Card>
        <Card>
          <CardHeader title="Evolução de medidas" subtitle="cm" icon={<Ruler className="h-4 w-4" />} />
          <div className="p-4 pt-2">
            {d.charts.measurements.length >= 2 ? (
              <MultiLine
                caption="Evolução de medidas"
                data={d.charts.measurements}
                unit="cm"
                series={[
                  { key: "waist", label: "Cintura" },
                  { key: "chest", label: "Peito" },
                  { key: "arm", label: "Braço" },
                  { key: "hips", label: "Quadril" },
                ].filter((s) => d.charts.measurements.some((m) => (m as Record<string, unknown>)[s.key] != null))}
              />
            ) : (
              <EmptyState icon={<Ruler className="h-6 w-6" />} title="Registre suas circunferências" description="Com duas ou mais avaliações, você verá a evolução aqui." action={<Link href="/app/progress" className={buttonClass("secondary", "sm")}>Nova avaliação</Link>} />
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader title="Progresso das metas" icon={<Target className="h-4 w-4" />} action={<Link href="/app/progress#metas" className="text-xs text-mist hover:text-neon">Gerenciar →</Link>} />
          <div className="space-y-4 p-5">
            {d.charts.goals.length === 0 && <EmptyState title="Nenhuma meta definida" description="Defina metas de peso, medidas ou treinos." action={<Link href="/app/progress#metas" className={buttonClass("secondary", "sm")}>Criar meta</Link>} />}
            {d.charts.goals.map((g) => (
              <div key={g.id}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{g.title}</span>
                  <span className="shrink-0 text-xs text-mist">
                    {g.status === "COMPLETED" ? <Badge tone="neon">Concluída</Badge> : `${formatNumber(g.current, 1)} → ${formatNumber(g.target, 1)} ${g.unit}`}
                  </span>
                </div>
                <ProgressBar value={g.pct} label={g.title} />
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Revisão da semana" subtitle="Comparado à semana anterior" icon={<TrendingUp className="h-4 w-4" />} />
          <div className="p-5">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ["Treinos", review.current.workouts, review.previous.workouts],
                ["Minutos", review.current.minutes, review.previous.minutes],
                ["Hábitos", review.current.habitCheckins, review.previous.habitCheckins],
              ].map(([l, c, p]) => (
                <div key={l as string} className="rounded-xl border border-white/5 bg-ink-900/60 p-3">
                  <div className="text-[11px] text-mist">{l}</div>
                  <div className="font-display text-xl font-bold">{c}</div>
                  <div className="text-[10px] text-mist-700">antes: {p}</div>
                </div>
              ))}
            </div>
            <ul className="mt-4 space-y-2">
              {review.highlights.map((h) => (
                <li key={h} className="flex gap-2 text-sm text-mist">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-neon" /> {h}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </section>
    </div>
  );
}
