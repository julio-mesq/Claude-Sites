import "server-only";
import { db } from "../db";
import { Errors } from "../errors";
import { PLAN_LIMITS } from "../permissions";
import { getPlan } from "../services/billing";
import { dateKey, zonedStartOfDay } from "@/lib/utils";
import { buildUserContext, SYSTEM_PROMPT } from "./context";
import { getProvider, logAiError, providerInfo, type ChatTurn } from "./providers";

export async function aiStatus(userId: string) {
  const plan = await getPlan(userId);
  const used = await db.aiMessage.count({ where: { userId, role: "USER", createdAt: { gte: zonedStartOfDay(dateKey()) } } });
  return { ...providerInfo(), plan, used, limit: PLAN_LIMITS[plan].aiMessagesPerDay };
}

export async function aiHistory(userId: string) {
  const items = await db.aiMessage.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 60 });
  return items.reverse();
}

export async function clearAiHistory(userId: string) {
  await db.aiMessage.deleteMany({ where: { userId } });
}

/** Valida limites, persiste a pergunta e retorna um stream de texto que persiste a resposta ao final. */
export async function askAi(userId: string, message: string): Promise<ReadableStream<Uint8Array>> {
  const status = await aiStatus(userId);
  if (status.used >= status.limit) throw Errors.rateLimited(3600);
  const provider = getProvider();
  const [ctx, previous] = await Promise.all([
    buildUserContext(userId),
    db.aiMessage.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 12 }),
  ]);
  await db.aiMessage.create({ data: { userId, role: "USER", content: message, provider: provider.id } });
  const history: ChatTurn[] = [...previous.reverse().map((m) => ({ role: m.role === "USER" ? ("user" as const) : ("assistant" as const), content: m.content })), { role: "user", content: message }];
  // A API exige começar por "user".
  while (history.length && history[0]!.role !== "user") history.shift();

  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      try {
        for await (const chunk of provider.stream({ system: SYSTEM_PROMPT, context: ctx.text, history, userId })) {
          full += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        logAiError(err);
        const msg = "\n\n_Não foi possível obter resposta do provedor de IA agora. Tente novamente em instantes._";
        full += msg;
        controller.enqueue(encoder.encode(msg));
      } finally {
        if (full.trim()) await db.aiMessage.create({ data: { userId, role: "ASSISTANT", content: full, provider: provider.id } }).catch(logAiError);
        controller.close();
      }
    },
  });
}
