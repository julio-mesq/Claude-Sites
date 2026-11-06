import { route } from "@/server/http";
import { handleStripeWebhook } from "@/server/services/billing";
// Webhook externo: autenticidade verificada pela assinatura do Stripe (não usa sessão nem Origin).
export const POST = route({ skipOriginCheck: true }, async ({ req }) => handleStripeWebhook(await req.text(), req.headers.get("stripe-signature")));
