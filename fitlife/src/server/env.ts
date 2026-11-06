import "server-only";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET precisa ter pelo menos 32 caracteres"),
  STORAGE_DIR: z.string().default("./storage"),
  ANTHROPIC_API_KEY: z.string().optional().default(""),
  FITAI_MODEL: z.string().default("claude-opus-5-5"),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  MAIL_FROM: z.string().default("FitLife <no-reply@fitlife.app>"),
  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
  STRIPE_PRICE_PRO: z.string().optional().default(""),
  STRIPE_PRICE_ELITE: z.string().optional().default(""),
});

// Na Vercel, usa o domínio de produção automaticamente quando APP_URL não foi definido.
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const parsed = schema.safeParse({
  ...process.env,
  APP_URL: process.env.APP_URL || (vercelUrl ? `https://${vercelUrl}` : undefined),
  // O disco da Vercel é somente leitura (exceto /tmp): uploads ficam temporários até configurar armazenamento de objetos.
  STORAGE_DIR: process.env.STORAGE_DIR || (process.env.VERCEL ? "/tmp/fitlife-storage" : undefined),
});
if (!parsed.success) {
  // Falha cedo e de forma explícita: configuração inválida não deve subir silenciosamente.
  console.error("❌ Variáveis de ambiente inválidas:", parsed.error.flatten().fieldErrors);
  throw new Error("Configuração de ambiente inválida. Veja .env.example.");
}

export const env = parsed.data;

export const features = {
  ai: env.ANTHROPIC_API_KEY.length > 0,
  smtp: env.SMTP_HOST.length > 0,
  payments: env.STRIPE_SECRET_KEY.length > 0 && env.STRIPE_WEBHOOK_SECRET.length > 0,
};
