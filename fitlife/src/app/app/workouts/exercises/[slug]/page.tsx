import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, ListOrdered, Trophy } from "lucide-react";
import { requireUser } from "@/server/auth/guard";
import { getExercise } from "@/server/services/workouts";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui/card";
import { MuscleFigure } from "@/components/fitness/muscle-figure";
import { DIFFICULTY_LABEL, MUSCLE_LABEL } from "@/lib/labels";
import { formatDate, formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Exercício" };

export default async function ExercisePage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const { slug } = await params;
  const data = await getExercise(user.id, slug).catch(() => null);
  if (!data) notFound();
  const { exercise: e, pr, recent } = data;
  return (
    <div>
      <PageHeader eyebrow={MUSCLE_LABEL[e.muscleGroup]} title={e.name} subtitle={e.description} />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Instruções de execução" icon={<ListOrdered className="h-4 w-4" />} />
            <ol className="space-y-3 p-5">
              {e.instructions.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-neon/10 text-xs font-bold text-neon">{i + 1}</span>
                  <span className="text-snow/90">{s}</span>
                </li>
              ))}
            </ol>
          </Card>
          {e.cautions.length > 0 && (
            <Card className="border-warning/20">
              <CardHeader title="Cuidados importantes" icon={<AlertTriangle className="h-4 w-4" />} />
              <ul className="space-y-2 p-5">
                {e.cautions.map((c) => (
                  <li key={c} className="flex gap-2 text-sm text-mist">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" /> {c}
                  </li>
                ))}
              </ul>
              <p className="px-5 pb-5 text-xs text-mist-700">Interrompa o exercício em caso de dor. Na dúvida, procure um profissional de educação física.</p>
            </Card>
          )}
          <Card>
            <CardHeader title="Seu histórico" subtitle="Últimas séries registradas" icon={<Trophy className="h-4 w-4" />} />
            <div className="p-5">
              {recent.length === 0 ? (
                <p className="text-sm text-mist">Você ainda não registrou séries deste exercício.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-mist">
                        <th className="pb-2 font-medium">Data</th>
                        <th className="pb-2 font-medium">Carga</th>
                        <th className="pb-2 font-medium">Reps</th>
                        <th className="pb-2 font-medium">Tempo/Distância</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {recent.map((r, i) => (
                        <tr key={i}>
                          <td className="py-2 text-mist">{formatDate(r.completedAt)}</td>
                          <td className="py-2">{r.loadKg != null ? `${formatNumber(r.loadKg, 1)} kg` : "—"}</td>
                          <td className="py-2">{r.reps ?? "—"}</td>
                          <td className="py-2">{[r.durationSec ? `${Math.round(r.durationSec / 60)} min` : null, r.distanceKm ? `${r.distanceKm} km` : null].filter(Boolean).join(" · ") || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="p-5">
            <div className="rounded-xl bg-ink-950/50 p-4">
              <MuscleFigure primary={e.muscleGroup} secondary={e.secondaryMuscles} />
            </div>
            <p className="mt-2 text-center text-[11px] text-mist-700">Ilustração dos músculos trabalhados</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="neon">{MUSCLE_LABEL[e.muscleGroup]}</Badge>
              {e.secondaryMuscles.map((s) => (
                <Badge key={s}>{MUSCLE_LABEL[s]}</Badge>
              ))}
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              {[
                ["Equipamento", e.equipment],
                ["Dificuldade", DIFFICULTY_LABEL[e.difficulty]],
                ["Séries", e.defaultSets],
                ["Repetições", e.defaultReps],
                ["Descanso", `${e.defaultRestSec}s`],
              ].map(([l, v]) => (
                <div key={l as string} className="rounded-xl border border-white/5 bg-ink-900/60 p-3">
                  <dt className="text-[11px] text-mist">{l}</dt>
                  <dd className="mt-0.5 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
          {pr && (
            <Card className="border-neon/20 p-5">
              <div className="text-xs text-mist">Recorde pessoal</div>
              <div className="mt-1 font-display text-2xl font-bold text-neon">
                {formatNumber(pr.loadKg, 1)} kg × {pr.reps}
              </div>
              <div className="text-xs text-mist">
                1RM estimado {formatNumber(pr.estimated1Rm, 1)} kg · {formatDate(pr.achievedAt)}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
