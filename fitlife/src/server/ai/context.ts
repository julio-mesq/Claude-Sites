import "server-only";
import { db } from "../db";
import { GOAL_LABEL, LEVEL_LABEL, LOCATION_LABEL, MUSCLE_LABEL } from "@/lib/labels";
import { ageFrom } from "@/lib/fitness-math";

/** Monta um resumo dos dados do PRÓPRIO usuário, somente se ele autorizou o uso do histórico. */
export async function buildUserContext(userId: string) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, level: true, profile: true, preferences: { select: { aiUseHistory: true, weeklyWorkoutTarget: true } } },
  });
  const firstName = user.name.split(" ")[0]!;
  if (!user.preferences?.aiUseHistory) return { firstName, text: `Nome: ${firstName}. O usuário NÃO autorizou o uso do histórico; responda de forma geral.`, allowed: false };
  const p = user.profile;
  const since = new Date(Date.now() - 30 * 86400_000);
  const [sessions, goals, records, measurements] = await Promise.all([
    db.workoutSession.findMany({ where: { userId, status: "COMPLETED", startedAt: { gte: since } }, orderBy: { startedAt: "desc" }, take: 8, select: { name: true, startedAt: true, durationSec: true, totalVolumeKg: true, perceivedEffort: true } }),
    db.userGoal.findMany({ where: { userId, status: "ACTIVE" }, take: 5 }),
    db.personalRecord.findMany({ where: { userId }, orderBy: { achievedAt: "desc" }, take: 5, include: { exercise: { select: { name: true, muscleGroup: true } } } }),
    db.bodyMeasurement.findMany({ where: { userId, weightKg: { not: null } }, orderBy: { measuredAt: "desc" }, take: 2 }),
  ]);
  const lines = [
    `Nome: ${firstName}. Nível no app: ${user.level}.`,
    p?.birthDate ? `Idade: ${ageFrom(p.birthDate)} anos.` : "",
    p?.goal ? `Objetivo: ${GOAL_LABEL[p.goal]}.` : "",
    p?.experience ? `Experiência: ${LEVEL_LABEL[p.experience]}.` : "",
    p?.trainingDaysPerWeek ? `Frequência desejada: ${p.trainingDaysPerWeek}x/semana, ~${p.sessionMinutes ?? 45} min por sessão, local: ${p.location ? LOCATION_LABEL[p.location] : "não informado"}.` : "",
    p?.equipment?.length ? `Equipamentos: ${p.equipment.join(", ")}.` : "",
    p?.dietaryPreferences?.length ? `Preferências alimentares: ${p.dietaryPreferences.join(", ")}.` : "",
    p?.dietaryRestrictions?.length ? `Restrições alimentares: ${p.dietaryRestrictions.join(", ")}.` : "",
    p?.hasHealthConditions ? "ATENÇÃO: o usuário informou condições de saúde — reforce a necessidade de acompanhamento profissional." : "",
    measurements[0] ? `Peso mais recente: ${measurements[0].weightKg} kg${measurements[1] ? ` (anterior: ${measurements[1].weightKg} kg)` : ""}.` : "",
    `Treinos concluídos nos últimos 30 dias: ${sessions.length}.`,
    ...sessions.slice(0, 5).map((s) => `- ${s.startedAt.toISOString().slice(0, 10)}: ${s.name}, ${Math.round((s.durationSec ?? 0) / 60)} min, volume ${Math.round(s.totalVolumeKg)} kg${s.perceivedEffort ? `, esforço ${s.perceivedEffort}/10` : ""}`),
    goals.length ? `Metas ativas: ${goals.map((g) => `${g.title} (${g.currentValue}/${g.targetValue} ${g.unit})`).join("; ")}.` : "Sem metas ativas.",
    records.length ? `Recordes: ${records.map((r) => `${r.exercise.name} (${MUSCLE_LABEL[r.exercise.muscleGroup]}) ${r.loadKg}kg×${r.reps}`).join("; ")}.` : "",
  ];
  return { firstName, text: lines.filter(Boolean).join("\n"), allowed: true, stats: { sessions30: sessions.length, goal: p?.goal ?? null, weekly: user.preferences.weeklyWorkoutTarget } };
}

export const SYSTEM_PROMPT = `Você é o Fit AI, assistente de orientação fitness da plataforma FitLife. Responda sempre em português do Brasil, com tom motivador, direto e prático.

Você pode: explicar exercícios e técnica de execução, sugerir alternativas de exercícios, ajudar a organizar treinos e rotinas, interpretar o histórico de treino fornecido no contexto, explicar conceitos gerais de nutrição, e ajudar na consistência de hábitos.

Limites obrigatórios:
- Você NÃO diagnostica doenças, NÃO prescreve medicamentos, suplementos em doses clínicas nem dietas terapêuticas, e NÃO substitui médicos, nutricionistas ou profissionais de educação física.
- Diante de dor aguda, lesão, sintomas (tontura, dor no peito, falta de ar incomum), gestação, distúrbios alimentares ou condições clínicas, recomende procurar um profissional de saúde e evite orientar a continuidade do treino.
- Use apenas os dados do usuário presentes no contexto. Nunca invente registros, números ou informações de outras pessoas.
- Valores nutricionais e metas são estimativas gerais; deixe isso claro quando relevante.
- Seja conciso: prefira listas curtas e passos acionáveis. Use markdown simples (negrito e listas).`;
