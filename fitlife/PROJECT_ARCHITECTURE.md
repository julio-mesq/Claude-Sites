# FitLife — Arquitetura técnica

## 1. Visão geral

O FitLife é uma aplicação **Next.js 15 (App Router) + TypeScript** com backend em **route handlers REST** e banco **PostgreSQL** via **Prisma ORM**. Frontend e backend vivem no mesmo repositório, mas com fronteiras explícitas:

```
Navegador ──► Páginas (Server Components) ──► Serviços de domínio (src/server/services) ──► Prisma ──► PostgreSQL
    │                                              ▲
    └──► Componentes cliente ──fetch──► API REST /api/v1 (route handlers) ─┘
```

- **Leitura**: páginas server-side chamam os serviços diretamente (sem HTTP interno), o que evita requisições duplicadas e mantém os dados fora do bundle do cliente.
- **Escrita**: componentes cliente chamam a **API REST `/api/v1`**, que valida com Zod, autentica, autoriza, aplica rate limit e delega ao serviço. Depois, o cliente usa `router.refresh()` para atualizar o servidor.
- Todo código de servidor importa `server-only`, impedindo que vaze para o navegador.

## 2. Estrutura de diretórios

```
fitlife/
├─ prisma/
│  ├─ schema.prisma          # Modelo relacional completo (45 tabelas)
│  ├─ migrations/            # Migrações versionadas (prisma migrate)
│  ├─ data/exercises.ts      # Biblioteca base de 65 exercícios
│  └─ seed.ts                # Exercícios, conquistas, missões, receitas, admin inicial
├─ src/
│  ├─ app/
│  │  ├─ (marketing)/        # Landing page, privacidade, termos
│  │  ├─ (auth)/             # Login, cadastro, recuperação/redefinição de senha, verificação de e-mail
│  │  ├─ onboarding/         # Assistente de configuração inicial (6 etapas)
│  │  ├─ app/                # Área autenticada (dashboard e todos os módulos)
│  │  ├─ admin/              # Painel administrativo (MODERATOR+)
│  │  ├─ api/v1/             # API REST (98 arquivos de rota)
│  │  └─ session-expired/    # Limpa cookie inválido (evita loops de redirecionamento)
│  ├─ components/
│  │  ├─ ui/                 # Design system: Button, Input, Card, Modal, Confirm, Progress, Switch...
│  │  ├─ layout/             # Logo, AppShell (sidebar, barra superior, menu inferior mobile)
│  │  ├─ charts/             # Gráficos Recharts e o anel animado do FitLife Pulse
│  │  ├─ fitness/            # Ilustração anatômica SVG (MuscleFigure)
│  │  ├─ marketing/          # Header/footer do site, animação de revelação
│  │  ├─ three/              # Cena 3D do hero (React Three Fiber), carregada sob demanda
│  │  └─ app/                # Componentes compartilhados da área logada
│  ├─ lib/                   # Código isomórfico: utils de data/fuso, cálculos, rótulos, validações Zod, cliente HTTP
│  ├─ server/
│  │  ├─ env.ts              # Variáveis de ambiente validadas (falha cedo)
│  │  ├─ db.ts               # Prisma singleton
│  │  ├─ http.ts             # Wrapper das rotas: auth, papel, CSRF, rate limit, erros, no-store
│  │  ├─ auth/               # Senhas (Argon2id), sessões, tokens de uso único, guardas de página
│  │  ├─ permissions.ts      # Hierarquia de papéis e limites por plano
│  │  ├─ rate-limit.ts       # Rate limit em PostgreSQL (multi-instância)
│  │  ├─ storage.ts          # Armazenamento privado de imagens com verificação de assinatura
│  │  ├─ mail.ts             # SMTP (nodemailer) ou log em desenvolvimento
│  │  ├─ audit.ts / logger.ts# Auditoria em banco e logs JSON com redação de segredos
│  │  ├─ ai/                 # Fit AI: contexto do usuário, provedores (Anthropic / demo local), limites
│  │  └─ services/           # Regras de negócio por domínio
│  └─ middleware.ts          # Barreira rápida de rotas protegidas (validação real no servidor)
└─ tests/
   ├─ unit/                  # Vitest: cálculos, datas, validações, permissões, integração OFF
   ├─ api/                   # Vitest: integração HTTP contra a API real (auth, isolamento, gamificação...)
   └─ e2e/                   # Playwright: jornadas completas desktop e mobile
```

## 3. Banco de dados

Modelo em `prisma/schema.prisma`. Principais grupos:

| Domínio | Tabelas |
|---|---|
| Identidade | `users`, `profiles`, `user_preferences`, `sessions`, `verification_tokens`, `rate_limits` |
| Treino | `exercises`, `workouts`, `workout_exercises`, `workout_sessions`, `workout_sets`, `personal_records` |
| Nutrição | `nutrition_logs` (metas diárias), `food_items`, `meals`, `meal_entries`, `water_logs`, `recipes`, `shopping_list_items` |
| Evolução | `body_measurements`, `progress_photos`, `goals` |
| Rotina | `habits`, `habit_logs`, `calendar_events`, `recovery_logs` |
| Gamificação | `achievements`, `user_achievements`, `xp_events`, `missions`, `mission_progress`, `journey_milestones` |
| Social | `community_posts`, `comments`, `reactions`, `follows`, `blocks`, `reports` |
| Comercial | `subscriptions`, `payments`, `webhook_events` |
| Plataforma | `notifications`, `ai_messages`, `audit_logs`, `app_settings` |

**Decisões:**
- IDs `cuid`, timestamps UTC; datas de calendário (`@db.Date`) usam chaves `AAAA-MM-DD` no fuso do app (`America/Sao_Paulo`, configurável via `NEXT_PUBLIC_APP_TIMEZONE`).
- **Exclusão em cascata** de todos os dados pessoais ao excluir a conta (LGPD). Auditoria e denúncias usam `SetNull` para manter o histórico sem identificar a pessoa.
- Treinos usam **exclusão lógica** (`archivedAt`) para preservar o histórico de sessões.
- Índices compostos nas consultas quentes (`userId + data`, `userId + status`).
- Restrições únicas garantem idempotência: `xp_events(userId, sourceKey)`, `journey_milestones(userId, sourceKey)`, `habit_logs(habitId, date)`, `user_achievements(userId, achievementId)`.
- **Migrações**: `prisma migrate dev` em desenvolvimento, `prisma migrate deploy` em produção (já no `Dockerfile`).

**Isolamento por usuário**: toda consulta de domínio filtra por `userId` da sessão no servidor (ex.: `findFirst({ where: { id, userId } })`), e acessos indevidos retornam 404 (sem revelar existência). Isso é coberto por testes de integração. O RLS do PostgreSQL não foi habilitado porque o Prisma usa uma única conexão de serviço; ele pode ser adicionado como defesa em profundidade com `SET app.user_id` por transação (ver próximas tarefas).

## 4. Autenticação e sessões

- Senhas com **Argon2id** (parâmetros OWASP: m=19 MiB, t=2, p=1). Comparação com tempo equalizado para e-mails inexistentes.
- **Sessões opacas no banco**: token aleatório de 256 bits no cookie `fl_session` (`HttpOnly`, `SameSite=Lax`, `Secure` em produção, 30 dias); o banco guarda apenas o **SHA-256** do token. Revogação imediata e listagem de dispositivos.
- Tokens de verificação de e-mail (24h) e redefinição de senha (30 min) são de **uso único**, armazenados como hash e invalidados ao reemitir.
- Redefinir senha encerra todas as sessões; alterar senha encerra as outras sessões.
- `middleware.ts` faz só a barreira rápida por cookie; **as páginas usam `requireUser`/`requireRole`** e as rotas usam `route({ role })`, validando a sessão no servidor.

## 5. Autorização

Papéis: `USER < PROFESSIONAL < MODERATOR < ADMIN` (`src/server/permissions.ts`). Verificados no servidor em cada rota:
- Moderador: visão geral do admin e moderação de denúncias.
- Administrador: usuários (papel, status, plano de cortesia), exercícios, missões, logs de auditoria e configurações globais.
- Proteções: não é possível alterar o próprio papel/status nem remover o último administrador.

Planos (`PLAN_LIMITS`): limites de mensagens do Fit AI, relatórios avançados (Pro+), número de treinos/hábitos e espaço para fotos.

## 6. Segurança

| Ameaça | Mitigação |
|---|---|
| SQL injection | Prisma parametrizado; SQL bruto apenas com template tags parametrizadas (`$queryRaw\`\``) |
| XSS | React escapa por padrão; nenhuma injeção de HTML bruto; markdown do Fit AI renderizado por um parser próprio que gera apenas elementos React; CSP restritiva |
| CSRF | Cookie `SameSite=Lax` + verificação de `Origin`/`Referer` em todos os métodos mutáveis (webhooks usam assinatura) |
| Força bruta | Rate limit por IP e por e-mail no login, cadastro, recuperação, IA, publicações etc. (persistido no PostgreSQL) |
| Enumeração de contas | Mensagens genéricas no login e na recuperação de senha |
| Uploads maliciosos | Verificação de assinatura binária (JPEG/PNG/WebP), limite de tamanho, nomes aleatórios, armazenamento fora de `/public`, proteção contra path traversal, `nosniff` |
| Clickjacking | `X-Frame-Options: DENY` e `frame-ancestors 'none'` |
| Vazamento de segredos | Logs JSON com redação automática de campos sensíveis; chaves de IA/pagamento só no servidor |
| Spam/abuso social | Remoção de links, filtro de termos de spam, bloqueio de duplicatas, ocultação automática com 3 denúncias, bloqueio entre usuários |
| Manipulação de pontuação | XP só por eventos do servidor, idempotente por `sourceKey`; sessões < 5 min não contam; limite de 2 treinos com XP por dia; hábitos só nos últimos 7 dias |

Cabeçalhos: CSP, HSTS (produção), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `COOP`; `X-Powered-By` removido; respostas da API com `Cache-Control: no-store`.

> **Proxy reverso**: o IP do cliente é lido de `X-Forwarded-For`. Em produção, publique atrás de um proxy confiável (Vercel, Nginx, Cloudflare) que sobrescreva esse cabeçalho.

## 7. LGPD

- Consentimento explícito no cadastro (termos, privacidade e tratamento de dados de saúde), com data registrada.
- **Portabilidade**: exportação completa em JSON (`GET /api/v1/account/export`).
- **Eliminação**: exclusão definitiva com confirmação por senha; remove arquivos de fotos do armazenamento.
- **Gerenciamento de consentimentos**: comunidade, ranking, uso do histórico pelo Fit AI e marketing, todos revogáveis.
- Dados sensíveis (fotos e medidas) são privados por padrão; fotos só são servidas ao dono, sem cache compartilhado, e aparecem desfocadas até serem reveladas.
- Auditoria de ações sensíveis (login, falhas, alterações de senha, exportação, exclusão e ações administrativas).

## 8. Domínios funcionais (serviços)

| Serviço | Responsabilidade |
|---|---|
| `auth` | Cadastro, login, logout, verificação, recuperação, troca de senha, sessões, exclusão |
| `profile` + `planner` | Onboarding, metas nutricionais estimadas (Mifflin-St Jeor), plano inicial de treinos por regras, hábitos padrão, agenda |
| `workouts` | Biblioteca, CRUD de treinos, execução, séries, recordes (1RM Epley), histórico, próximo treino |
| `nutrition` | Diário, água, biblioteca de alimentos, favoritos, refeições salvas, cópia de dia, histórico, receitas, lista de compras |
| `food-db` | Integração opcional com Open Food Facts (sem chave), com origem identificada |
| `progress` | Medidas, comparação, fotos privadas, metas automáticas/manuais |
| `routine` | Hábitos (sequências, heatmap), calendário com lembretes, Smart Recovery, missões |
| `gamification` | XP idempotente, níveis, conquistas, missões, Body Journey |
| `insights` | Dashboard, FitLife Pulse, revisão semanal, sugestão de carga, equilíbrio muscular, relatórios, ranking |
| `community` | Feed, publicações, curtidas, comentários, seguir, bloquear, denúncias, anti-spam |
| `billing` | Planos, checkout e portal Stripe, webhooks com assinatura e idempotência |
| `admin` | Métricas, usuários, moderação, conteúdo, auditoria, configurações globais |
| `privacy` | Exportação de dados |
| `notifications` | Central de notificações e disparo de lembretes |
| `ai/*` | Contexto autorizado, prompt de segurança, provedores e limites por plano |

## 9. Fit AI

- `providers.ts` define a interface `AiProvider` com duas implementações:
  - **Anthropic (Claude)**: ativada quando `ANTHROPIC_API_KEY` existe no servidor. Usa streaming, prompt de sistema com cache e o fallback de recusa do lado do servidor (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`). O modelo é configurável por `FITAI_MODEL` (padrão `claude-opus-5-5`).
  - **Demonstração local**: respostas por regras e pela biblioteca do FitLife, **claramente identificadas na interface como não sendo IA**.
- Contexto: só os dados do próprio usuário, e só se ele autorizou (`aiUseHistory`).
- Segurança: prompt proíbe diagnósticos e prescrições; temas de dor ou sintomas direcionam a profissionais; limite diário de mensagens por plano e rate limit por minuto.

## 10. Pagamentos

- Stripe Checkout (assinatura) e Billing Portal (gerenciar/cancelar).
- Webhook `POST /api/v1/webhooks/stripe` verifica a assinatura (`STRIPE_WEBHOOK_SECRET`), é idempotente (`webhook_events`) e sincroniza status, plano, renovação e pagamentos.
- Sem chaves configuradas, o checkout retorna 503 e a interface informa que não está disponível. **Nenhum pagamento é simulado.**
- Planos de cortesia podem ser concedidos manualmente pelo administrador (registrado em auditoria, sem gerar pagamento).

## 11. Frontend e design

- Tailwind CSS v4 com tokens da marca (`globals.css`): preto profundo `#080A0A`, neon `#B6FF3B` etc. Tipografia Sora (títulos) + Inter (texto), servidas localmente pelo `next/font`.
- Glassmorphism controlado (`.glass`), microinterações e transições com Motion; animações 3D com React Three Fiber **apenas no hero**, carregadas dinamicamente quando visíveis, com WebGL disponível, sem movimento reduzido e com memória suficiente no dispositivo.
- **Movimento reduzido**: respeita a preferência do sistema e uma opção própria nas configurações (`data-reduced-motion`).
- Gráficos Recharts com paleta categórica **validada** (faixa de luminosidade, separação para daltonismo e contraste contra a superfície escura) e tabelas ocultas para leitores de tela.
- Mobile: menu inferior com abas principais e folha "Mais", modais em formato de bottom sheet, alvos de toque ≥ 40px, sem rolagem horizontal (testado).
- Acessibilidade: link "pular para o conteúdo", foco visível, rótulos em todos os campos, `aria-*` em controles personalizados, armadilha de foco em modais.

## 12. Observabilidade e operação

- Logs JSON estruturados (nível, mensagem, metadados com segredos redigidos); alerta de rotas lentas (> 1,5 s).
- `GET /api/v1/health` verifica o banco (usado pelo `HEALTHCHECK` do Docker).
- Auditoria em `audit_logs`, consultável no painel administrativo.
- Backups: use os backups gerenciados do provedor de PostgreSQL ou `pg_dump` agendado. Faça backup também do volume de uploads (`STORAGE_DIR`), ou troque `storage.ts` por S3/R2.
