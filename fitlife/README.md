# FITLIFE

**Transforme seu corpo. Evolua sua mente. Supere seus limites.**

Plataforma fitness completa: treinos personalizados com execução guiada, nutrição, evolução física com fotos privadas, calendário, hábitos, gamificação (XP, níveis, conquistas, missões), FitLife Pulse, Body Journey, Smart Recovery, comunidade com moderação, assistente Fit AI, assinaturas e painel administrativo.

- Arquitetura: [`PROJECT_ARCHITECTURE.md`](./PROJECT_ARCHITECTURE.md)
- Progresso, testes e próximos passos: [`PROJECT_PROGRESS.md`](./PROJECT_PROGRESS.md)

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · Motion · React Three Fiber · Recharts · Lucide · PostgreSQL 16 · Prisma 6 · Zod · Argon2id · Anthropic SDK · Stripe · Vitest · Playwright

## Executar localmente

Pré-requisitos: Node.js ≥ 20.11 e PostgreSQL 14+ (ou Docker).

```bash
cd fitlife
```

```bash
cp .env.example .env
```

Edite `.env`: defina `DATABASE_URL` e gere um `AUTH_SECRET` com `openssl rand -base64 48`.

```bash
npm install
```

```bash
npx prisma migrate deploy
```

```bash
npm run db:seed
```

```bash
npm run dev
```

Acesse http://localhost:3000. O seed cria o administrador definido em `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` (padrão `admin@fitlife.local` / `Admin@FitLife2026`). **Altere essa senha imediatamente.**

### Com Docker

```bash
docker compose up --build
```

Em outro terminal, popule o banco:

```bash
docker compose exec app npm run db:seed
```

## Testes

| Comando | O que roda |
|---|---|
| `npm test` | Testes unitários (cálculos, datas/fuso, validações, permissões) |
| `npm run test:api` | Integração HTTP contra um servidor rodando (`TEST_BASE_URL`, padrão `http://localhost:3000`) |
| `npm run test:e2e` | Playwright: sobe `next start` na porta 3100 (requer `npm run build`) e testa jornadas desktop e mobile |
| `npm run check` | Typecheck + lint + unitários |

Os testes de API e E2E criam usuários com e-mail `@fitlife.test` no banco configurado e os removem no início de cada execução de API. Use um banco de desenvolvimento ou de testes.

## Variáveis de ambiente

Veja `.env.example`. Resumo:

| Variável | Obrigatória | Efeito |
|---|---|---|
| `DATABASE_URL` | Sim | PostgreSQL |
| `AUTH_SECRET` | Sim | Segredo da aplicação (≥ 32 caracteres) |
| `APP_URL` | Sim (prod.) | URL pública, usada em links de e-mail e na checagem de origem |
| `STORAGE_DIR` | Não | Pasta privada de uploads (padrão `./storage`) |
| `ANTHROPIC_API_KEY`, `FITAI_MODEL` | Não | Ativa o Fit AI real (Claude). Sem chave: modo demonstração identificado |
| `SMTP_*`, `MAIL_FROM` | Não (recomendado em prod.) | E-mails de confirmação e recuperação. Sem SMTP, os links são registrados no log (apenas desenvolvimento) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ELITE` | Não | Assinaturas reais. Sem elas, o checkout fica indisponível |
| `NUTRITION_PROVIDER=openfoodfacts` | Não | Busca de alimentos no Open Food Facts (base pública, sem chave) |
| `NEXT_PUBLIC_APP_TIMEZONE` | Não | Fuso das datas (padrão `America/Sao_Paulo`) |

## Deploy em produção

1. Provisione PostgreSQL gerenciado (Neon, Supabase, RDS, Cloud SQL...) com backups automáticos.
2. Configure as variáveis de ambiente (incluindo `APP_URL` com HTTPS e SMTP).
3. Rode `npx prisma migrate deploy` e, uma única vez, `npm run db:seed`.
4. Build e start: `npm run build` e `npm start`, ou use o `Dockerfile` (ele já aplica as migrações ao iniciar).
5. Publique atrás de um proxy/CDN com HTTPS que defina `X-Forwarded-For` (usado no rate limit).
6. Uploads: monte um volume persistente em `STORAGE_DIR` ou adapte `src/server/storage.ts` para S3/R2/Supabase Storage. Em plataformas serverless (ex.: Vercel), o disco é efêmero, então use armazenamento de objetos.
7. Stripe: crie os produtos e preços mensais, configure o webhook para `https://SEU_DOMINIO/api/v1/webhooks/stripe` com os eventos `customer.subscription.*`, `invoice.paid` e `invoice.payment_failed`.
8. Revise os textos legais (`/privacy`, `/terms`) com assessoria jurídica e preencha os dados do controlador.

## API

API REST versionada em `/api/v1` (cookies de sessão, JSON, erros no formato `{ error: { code, message, fields? } }`). Os principais grupos são `auth`, `onboarding`, `profile`, `exercises`, `workouts`, `sessions`, `nutrition`, `measurements`, `photos`, `goals`, `habits`, `calendar`, `recovery`, `missions`, `achievements`, `dashboard`, `pulse`, `journey`, `reports`, `ai`, `community`, `billing`, `notifications`, `account` e `admin`. Veja `src/app/api/v1`.
