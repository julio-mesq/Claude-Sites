import "server-only";
import Stripe from "stripe";
import type { Plan, SubscriptionStatus } from "@prisma/client";
import { db } from "../db";
import { env, features } from "../env";
import { Errors } from "../errors";
import { audit } from "../audit";
import { logger } from "../logger";
import { notify } from "./notifications";

export const PLANS = [
  { id: "FREE" as const, name: "FitLife Free", priceMonthly: 0, highlight: false, features: ["Dashboard essencial", "Registro de treinos e histórico", "Diário alimentar", "Até 6 hábitos", "Fit AI: 10 mensagens/dia"] },
  { id: "PRO" as const, name: "FitLife Pro", priceMonthly: 29.9, highlight: true, features: ["Tudo do Free", "Relatórios e estatísticas avançadas", "Fit AI: 100 mensagens/dia", "Até 50 treinos e 25 hábitos", "500 MB para fotos de evolução"] },
  { id: "ELITE" as const, name: "FitLife Elite", priceMonthly: 59.9, highlight: false, features: ["Tudo do Pro", "Fit AI: 400 mensagens/dia", "Treinos e hábitos praticamente ilimitados", "5 GB para fotos de evolução", "Acesso antecipado a novos recursos"] },
];

let stripe: Stripe | null = null;
function client() {
  if (!features.payments) throw Errors.unavailable("Pagamentos ainda não configurados nesta instalação.");
  stripe ??= new Stripe(env.STRIPE_SECRET_KEY);
  return stripe;
}

export async function getPlan(userId: string): Promise<Plan> {
  const sub = await db.subscription.findUnique({ where: { userId } });
  if (!sub) return "FREE";
  const active = sub.status === "ACTIVE" || sub.status === "TRIALING";
  const inPeriod = !sub.currentPeriodEnd || sub.currentPeriodEnd > new Date();
  return active && inPeriod ? sub.plan : "FREE";
}

export async function getBilling(userId: string) {
  const [sub, payments] = await Promise.all([
    db.subscription.findUnique({ where: { userId } }),
    db.payment.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  return { subscription: sub, effectivePlan: await getPlan(userId), payments, paymentsEnabled: features.payments };
}

function priceFor(plan: "PRO" | "ELITE") {
  const price = plan === "PRO" ? env.STRIPE_PRICE_PRO : env.STRIPE_PRICE_ELITE;
  if (!price) throw Errors.unavailable(`Preço do plano ${plan} não configurado (STRIPE_PRICE_${plan}).`);
  return price;
}

export async function createCheckout(userId: string, plan: "PRO" | "ELITE") {
  const s = client();
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, include: { subscription: true } });
  let customerId = user.subscription?.providerCustomerId ?? null;
  if (!customerId) {
    const customer = await s.customers.create({ email: user.email, name: user.name, metadata: { userId } });
    customerId = customer.id;
    await db.subscription.upsert({ where: { userId }, create: { userId, provider: "stripe", providerCustomerId: customerId }, update: { provider: "stripe", providerCustomerId: customerId } });
  }
  const session = await s.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceFor(plan), quantity: 1 }],
    success_url: `${env.APP_URL}/app/settings/billing?checkout=success`,
    cancel_url: `${env.APP_URL}/app/settings/billing?checkout=canceled`,
    client_reference_id: userId,
    metadata: { userId, plan },
    subscription_data: { metadata: { userId, plan } },
    allow_promotion_codes: true,
  });
  await audit("billing.checkout_created", { actorId: userId, meta: { plan } });
  return { url: session.url };
}

export async function createPortal(userId: string) {
  const s = client();
  const sub = await db.subscription.findUnique({ where: { userId } });
  if (!sub?.providerCustomerId) throw Errors.badRequest("Nenhuma assinatura paga encontrada.");
  const portal = await s.billingPortal.sessions.create({ customer: sub.providerCustomerId, return_url: `${env.APP_URL}/app/settings/billing` });
  return { url: portal.url };
}

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "ACTIVE",
  trialing: "TRIALING",
  past_due: "PAST_DUE",
  unpaid: "PAST_DUE",
  canceled: "CANCELED",
  incomplete: "INCOMPLETE",
  incomplete_expired: "CANCELED",
  paused: "PAST_DUE",
};

function planFromPrice(priceId?: string | null): Plan {
  if (priceId && priceId === env.STRIPE_PRICE_ELITE) return "ELITE";
  if (priceId && priceId === env.STRIPE_PRICE_PRO) return "PRO";
  return "FREE";
}

async function syncSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const local = await db.subscription.findFirst({ where: { OR: [{ providerSubscriptionId: sub.id }, { providerCustomerId: customerId }] } });
  const userId = local?.userId ?? (sub.metadata?.userId as string | undefined);
  if (!userId) {
    logger.warn("billing.webhook_unknown_customer", { customerId });
    return;
  }
  const item = sub.items.data[0];
  const periodEnd = (item as unknown as { current_period_end?: number })?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end;
  const plan = planFromPrice(item?.price.id);
  const status = STATUS_MAP[sub.status] ?? "INCOMPLETE";
  await db.subscription.upsert({
    where: { userId },
    create: { userId, plan, status, provider: "stripe", providerCustomerId: customerId, providerSubscriptionId: sub.id, currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null, cancelAtPeriodEnd: sub.cancel_at_period_end },
    update: { plan: status === "CANCELED" ? "FREE" : plan, status, providerCustomerId: customerId, providerSubscriptionId: sub.id, currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null, cancelAtPeriodEnd: sub.cancel_at_period_end },
  });
  await audit("billing.subscription_synced", { actorId: userId, meta: { plan, status } });
}

/** Processa webhook com verificação de assinatura e idempotência por id de evento. */
export async function handleStripeWebhook(rawBody: string, signature: string | null) {
  const s = client();
  if (!signature) throw Errors.badRequest("Assinatura ausente.");
  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw Errors.badRequest("Assinatura do webhook inválida.");
  }
  const seen = await db.webhookEvent.findUnique({ where: { id: event.id } });
  if (seen) return { duplicate: true };

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    case "invoice.paid":
    case "invoice.payment_failed": {
      const inv = event.data.object as Stripe.Invoice;
      const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
      const local = customerId ? await db.subscription.findUnique({ where: { providerCustomerId: customerId } }) : null;
      if (local && inv.id) {
        const ok = event.type === "invoice.paid";
        await db.payment.upsert({
          where: { providerPaymentId: inv.id },
          create: { userId: local.userId, provider: "stripe", providerPaymentId: inv.id, amountCents: ok ? inv.amount_paid : inv.amount_due, currency: inv.currency, status: ok ? "SUCCEEDED" : "FAILED", plan: local.plan },
          update: { status: ok ? "SUCCEEDED" : "FAILED" },
        });
        if (!ok) await notify(local.userId, { type: "billing", title: "Falha no pagamento", body: "Não conseguimos processar sua assinatura. Atualize sua forma de pagamento.", href: "/app/settings/billing" });
      }
      break;
    }
    default:
      logger.debug("billing.webhook_ignored", { type: event.type });
  }
  await db.webhookEvent.create({ data: { id: event.id, provider: "stripe", type: event.type } });
  return { duplicate: false };
}
