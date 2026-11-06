import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env, features } from "../env";
import { db } from "../db";
import { logger } from "../logger";
import { MUSCLE_LABEL, GOAL_LABEL } from "@/lib/labels";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export interface AiProvider {
  id: "anthropic" | "local-demo";
  stream(input: { system: string; context: string; history: ChatTurn[]; userId: string }): AsyncIterable<string>;
}

// ───────────── Anthropic (Claude) ─────────────

let anthropic: Anthropic | null = null;

const anthropicProvider: AiProvider = {
  id: "anthropic",
  async *stream({ system, context, history }) {
    anthropic ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    // Fallback de recusa no servidor ("default"): se o modelo recusar por política, a API reencaminha a requisição.
    const stream = anthropic.beta.messages.stream({
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      model: env.FITAI_MODEL,
      output_config: { effort: "low" },
      max_tokens: 4000,
      system: [
        { type: "text", text: system, cache_control: { type: "ephemeral" } },
        { type: "text", text: `Contexto autorizado do usuário (dados do próprio usuário):\n${context}` },
      ],
      messages: history.map((m) => ({ role: m.role, content: m.content })),
    });
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") yield event.delta.text;
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") yield "\n\nNão posso ajudar com esse pedido. Para questões de saúde, procure um profissional qualificado.";
    if (final.stop_reason === "max_tokens") yield "\n\n_(Resposta interrompida por limite de tamanho.)_";
  },
};

// ───────────── Modo demonstração local (sem IA) ─────────────

/**
 * Respostas determinísticas baseadas em regras e no conteúdo da biblioteca do FitLife.
 * NÃO é inteligência artificial e é identificado como tal na interface.
 */
const TOPICS: { test: RegExp; answer: string }[] = [
  {
    test: /(dor|les[aã]o|machuc|tontura|peito|falta de ar|rem[eé]dio|medicamento|diagn[oó]stic|doen[cç]a)/i,
    answer:
      "Esse assunto envolve saúde e **precisa de avaliação profissional**. Se você sente dor, tontura, dor no peito ou falta de ar incomum, interrompa o treino e procure um médico. O FitLife não faz diagnósticos nem indica medicamentos.",
  },
  {
    test: /(prote[ií]na|carbo|gordura|macro|caloria|dieta|comer|aliment)/i,
    answer:
      "**Conceitos gerais de nutrição:**\n- **Proteínas** ajudam na manutenção e construção muscular; boas fontes: ovos, carnes magras, peixes, leguminosas e laticínios.\n- **Carboidratos** são a principal fonte de energia para treinos intensos.\n- **Gorduras** são essenciais para hormônios e absorção de vitaminas.\n\nSuas metas no FitLife são **estimativas** (fórmula de Mifflin-St Jeor). Para um plano individualizado, consulte um nutricionista.",
  },
  {
    test: /([aá]gua|hidrata)/i,
    answer: "Uma referência comum é cerca de **35 ml por kg de peso corporal** por dia, ajustando para calor e treinos. Registre sua água na área de Nutrição: o FitLife acompanha sua meta diária.",
  },
  {
    test: /(sono|dormir|descanso|recupera|cansa)/i,
    answer:
      "**Recuperação importa tanto quanto o treino.**\n- Busque 7–9h de sono.\n- Alterne grupos musculares ou intensidades.\n- Inclua ao menos 1 dia de descanso por semana.\n\nUse o **Smart Recovery** para registrar sono, cansaço e dor muscular e acompanhar sua tendência.",
  },
  {
    test: /(motiva|const[aâ]ncia|consist|pregui[cç]a|desanim|h[aá]bito)/i,
    answer:
      "**Dicas para manter a consistência:**\n- Comece pequeno: 20 minutos ainda contam.\n- Agende os treinos no Calendário como compromissos.\n- Use hábitos diários e acompanhe sua sequência.\n- Entre em uma Missão para ter um objetivo de curto prazo.",
  },
];

async function demoAnswer(userId: string, question: string) {
  for (const t of TOPICS) if (t.test.test(question)) return t.answer;

  // Busca exercícios citados na pergunta.
  const words = question.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  if (words.length) {
    const exercises = await db.exercise.findMany({ where: { isPublished: true, authorId: null }, select: { name: true, slug: true, muscleGroup: true, instructions: true, cautions: true, equipment: true } });
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const hit = exercises.find((e) => words.filter((w) => norm(e.name).includes(w)).length >= Math.min(2, words.length)) ?? exercises.find((e) => words.some((w) => norm(e.name).split(" ").includes(w)));
    if (hit) {
      const alts = exercises.filter((e) => e.muscleGroup === hit.muscleGroup && e.slug !== hit.slug).slice(0, 3);
      return `**${hit.name}** (${MUSCLE_LABEL[hit.muscleGroup]} · ${hit.equipment})\n\n**Execução:**\n${hit.instructions.map((i, n) => `${n + 1}. ${i}`).join("\n")}\n\n${hit.cautions.length ? `**Cuidados:**\n${hit.cautions.map((c) => `- ${c}`).join("\n")}\n\n` : ""}${alts.length ? `**Alternativas:** ${alts.map((a) => a.name).join(", ")}.` : ""}`;
    }
    const group = Object.entries(MUSCLE_LABEL).find(([, label]) => words.some((w) => norm(label).startsWith(w)));
    if (group) {
      const list = exercises.filter((e) => e.muscleGroup === group[0]).slice(0, 6);
      return `Exercícios de **${group[1]}** na biblioteca do FitLife:\n${list.map((e) => `- ${e.name} (${e.equipment})`).join("\n")}\n\nAbra a Biblioteca em Treinos para ver instruções completas.`;
    }
  }

  if (/(treino|rotina|semana|plano|organiz)/i.test(question)) {
    const [profile, count] = await Promise.all([
      db.profile.findUnique({ where: { userId }, select: { goal: true, trainingDaysPerWeek: true } }),
      db.workoutSession.count({ where: { userId, status: "COMPLETED", startedAt: { gte: new Date(Date.now() - 14 * 86400_000) } } }),
    ]);
    return `Pelos seus registros, você concluiu **${count} treino(s) nos últimos 14 dias**${profile?.trainingDaysPerWeek ? `, com meta de ${profile.trainingDaysPerWeek}x por semana` : ""}.${profile?.goal ? ` Seu objetivo atual é **${GOAL_LABEL[profile.goal]}**.` : ""}\n\nSugestões gerais:\n- Distribua os treinos com pelo menos 48h entre estímulos do mesmo grupo muscular.\n- Progrida aos poucos: mais repetições primeiro, depois mais carga.\n- Use o criador de treinos para ajustar séries, repetições e descanso.`;
  }
  return "Posso ajudar com **exercícios** (ex.: \"como fazer agachamento\"), **organização de treinos**, **conceitos de nutrição**, **hidratação**, **recuperação** e **consistência de hábitos**. Tente perguntar sobre um desses temas.";
}

const localProvider: AiProvider = {
  id: "local-demo",
  async *stream({ history, userId }) {
    const last = history.at(-1)?.content ?? "";
    const text = await demoAnswer(userId, last);
    // Entrega em pedaços para manter a mesma experiência de streaming da interface.
    for (const chunk of text.match(/.{1,24}(\s|$)|\S+/gs) ?? [text]) yield chunk;
  },
};

export function getProvider(): AiProvider {
  if (features.ai) return anthropicProvider;
  return localProvider;
}

export function providerInfo() {
  return features.ai
    ? { id: "anthropic" as const, label: "Claude (Anthropic)", model: env.FITAI_MODEL, demo: false }
    : { id: "local-demo" as const, label: "Modo demonstração local", model: null, demo: true };
}

export function logAiError(err: unknown) {
  logger.error("ai.provider_error", { err });
}
