# FitLife — Progresso do projeto

_Última atualização: 6 de novembro de 2026 (sessão autônoma noturna)_

## Situação geral

Plataforma funcional de ponta a ponta: frontend, backend REST, banco PostgreSQL com migrações, autenticação, regras de negócio, gamificação, Fit AI (modo demonstração identificado, pronto para Claude), testes automatizados, Docker e CI. Todas as telas da área logada usam dados reais persistidos, com estados de carregamento, vazio e erro.

## Funcionalidades concluídas

| # | Área | Situação | Observações |
|---|---|---|---|
| 1 | Landing page | ✅ | Hero com cena 3D procedural (R3F) carregada sob demanda, benefícios, prévia do dashboard (rotulada como ilustrativa), treinos, nutrição, evolução, Fit AI, desafios, depoimentos **identificados como exemplos**, planos, FAQ, CTA e rodapé |
| 2 | Cadastro | ✅ | Nome, e-mail, senha, confirmação, medidor de força, consentimento LGPD |
| 3 | Login / logout | ✅ | Mensagens genéricas, rate limit por IP e e-mail, redirecionamento seguro (`next`) |
| 4 | Recuperação de senha | ✅ | Token de uso único (30 min) por e-mail; encerra todas as sessões |
| — | Confirmação de e-mail | ✅ | Token de 24h; banner de reenvio; exigida para publicar na comunidade |
| — | Sessões | ✅ | Listagem por dispositivo, revogação, alteração de senha encerra as outras |
| — | Exclusão de conta | ✅ | Confirmação por senha + "EXCLUIR"; cascata completa e remoção das fotos |
| 5 | Onboarding | ✅ | 6 etapas com todos os campos pedidos; gera metas estimadas, plano de treinos, hábitos, agenda da semana e medida inicial; alerta para condições de saúde; editável depois (`/onboarding?edit=1`) |
| 6 | Dashboard | ✅ | Saudação, data, notificações, menu de perfil; 6 indicadores; gráficos de peso, histórico semanal, frequência por dia, medidas e metas; cards de próximo treino, nutrição e Pulse; revisão semanal |
| 7 | Treinos | ✅ | Biblioteca com 65 exercícios (10 categorias, filtros), ilustração anatômica, instruções e cuidados; criador com reordenação (botões e arrastar), séries, repetições, carga e descanso; modelos; duplicar; exclusão lógica |
| — | Execução de treino | ✅ | Exercício atual e próximo, séries, carga, repetições, cronômetro, descanso com pausa/+15s/pular, aviso sonoro e vibração, progresso geral, desfazer, série extra, treino livre, wake lock, esforço percebido |
| — | Histórico e recordes | ✅ | Resumo por sessão, recordes por 1RM estimado (Epley) |
| 8 | Fit AI | ✅* | Chat com streaming, sugestões, limites por plano, histórico, contexto autorizado. *Sem `ANTHROPIC_API_KEY` funciona em **modo demonstração local, claramente identificado** |
| 9 | Nutrição | ✅ | Diário por refeição (5 tipos), registro manual, biblioteca própria, favoritos, recentes, refeições salvas, repetir ontem, água, metas editáveis/recalculáveis, histórico com gráfico, receitas, lista de compras |
| 10–11 | Evolução e medidas | ✅ | Peso, altura, 7 circunferências, % de gordura com método obrigatório, observações; comparador entre datas; gráficos; IMC com ressalva; fotos privadas (desfocadas até revelar) com comparador antes/depois deslizante |
| — | Metas | ✅ | Automáticas (peso, % gordura, cintura, nº de treinos) e manuais, prazo, conclusão com XP e marco |
| 12 | Calendário | ✅ | Visões dia/semana/mês, tipos com cores, lembretes, conclusão, vínculo com treinos, sessões concluídas exibidas automaticamente |
| 13 | Hábitos | ✅ | Criação com ícone/cor, diário/semanal, check-in (até 7 dias atrás), sequência atual e recorde, consistência em 30 dias, heatmap |
| 14 | Desafios (Mission Mode) | ✅ | 8 missões semeadas, progresso automático por 7 métricas, recompensa, prazo, abandono, histórico |
| 15 | Conquistas | ✅ | 12 conquistas concedidas por eventos reais; nível e XP; histórico de recompensas; ranking semanal opt-in; compartilhar na comunidade |
| 16 | Comunidade | ✅ | Opt-in; feed (todos/seguindo), publicações públicas ou para seguidores, curtidas, comentários, seguir, perfil com visibilidade configurável, conquistas verificadas, denúncias, bloqueio, anti-spam, ocultação automática |
| 17 | Perfil | ✅ | Avatar (upload validado), nome, @usuário, bio, dados físicos e preferências |
| 18 | Configurações | ✅ | Movimento reduzido, metas, lembretes, privacidade, consentimentos, exportação de dados, exclusão, senha, sessões, bloqueados |
| 19 | Notificações | ✅ | Central com não lidas, marcação, paginação; lembretes do calendário disparados automaticamente |
| 20 | Painel administrativo | ✅ | Métricas e gráfico de cadastros, usuários (papel/status/plano de cortesia, paginação e busca), moderação, exercícios, missões, logs de auditoria, configurações globais (cadastro, comunidade, banner), tudo verificado no servidor |
| — | Planos e assinaturas | ✅* | Free/Pro/Elite com limites reais; checkout, portal e webhooks Stripe com assinatura e idempotência. *Exige credenciais Stripe; sem elas, indisponível (nada é simulado) |
| — | FitLife Pulse | ✅ | Índice 0–100 com 5 componentes ponderados, anel animado, últimos 14 dias, foco de melhoria; aviso de que não é indicador de saúde |
| — | Body Journey | ✅ | Linha do tempo por mês com filtros por tipo e marcos idempotentes |
| — | Smart Recovery | ✅ | Sono, cansaço, dor, sensação de recuperação, dia de descanso; médias de 7 dias; sugestões gerais sem veredito de aptidão |
| — | Responsividade | ✅ | Menu inferior + folha "Mais" no mobile, modais como bottom sheet; sem rolagem horizontal (teste automatizado) |
| — | LGPD | ✅ | Política de privacidade, termos, consentimento registrado, portabilidade, eliminação e preferências |

### Funcionalidades originais adicionais (diferenciais)

1. **Sugestão de carga por dupla progressão**: no modo execução, sugere aumentar a carga quando todas as séries atingiram o topo da faixa de repetições.
2. **Treino rápido**: gera uma sessão para o tempo e foco escolhidos, respeitando nível e equipamentos.
3. **Mapa de equilíbrio muscular**: volume por grupo muscular em 30/90 dias sobre a ilustração anatômica, alertando grupos sem estímulo.
4. **Revisão semanal**: comparação automática com a semana anterior e destaques.
5. **Calculadoras**: 1RM com tabela de percentuais, calculadora de anilhas por lado e gasto energético estimado.
6. **Repetir ontem e refeições salvas**: reduzem o atrito do diário alimentar.
7. **Relatórios avançados (Pro)**: volume e minutos semanais, esforço percebido, top recordes.

## Dependem de credenciais externas

| Recurso | Variáveis | Comportamento sem credencial |
|---|---|---|
| Fit AI com Claude | `ANTHROPIC_API_KEY` (opcional `FITAI_MODEL`) | Modo demonstração local por regras, identificado na interface |
| E-mails (confirmação/recuperação) | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Em desenvolvimento, o link vai para o log do servidor; em produção é registrado como erro |
| Pagamentos | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ELITE` | Checkout retorna 503; planos podem ser concedidos manualmente pelo admin |
| Base nutricional externa | `NUTRITION_PROVIDER=openfoodfacts` | Apenas alimentos do próprio usuário. A integração foi implementada e testada com respostas simuladas, **mas não ao vivo**, pois o host estava bloqueado no ambiente de desenvolvimento |

## Testes executados

| Suíte | Ferramenta | Resultado |
|---|---|---|
| Unitários (33) | Vitest | ✅ todos passando |
| Integração da API (34) | Vitest + HTTP real + PostgreSQL | ✅ todos passando (dev e build de produção) |
| E2E (5) | Playwright (Chromium; desktop 1440px e Pixel 7) | ✅ todos passando contra `next build` + `next start` |
| Typecheck | `tsc --noEmit` | ✅ sem erros |
| Lint | `next lint` | ✅ sem avisos |
| Build | `next build` | ✅ |

Coberto pelos testes: cadastro, login, logout, recuperação e redefinição de senha (uso único, expiração), confirmação de e-mail, troca de senha e sessões, exclusão de conta e exportação (LGPD), CSRF, rate limit, cabeçalhos de segurança, cookie HttpOnly/SameSite, onboarding, criação/edição/reordenação/exclusão de treinos, isolamento entre usuários, registro de séries, recordes, histórico, sessões curtas sem XP, nutrição (macros, água, biblioteca), metas automáticas, idempotência de XP de hábitos, missões, Pulse/dashboard com dados reais e vazios, permissões de usuário/moderador/admin, bloqueio por plano, webhook sem assinatura, comunidade (opt-in, filtro de links e spam, denúncias, bloqueio, visibilidade de perfil), Fit AI (modo demo e limite diário), responsividade mobile.

Inspeção visual feita com Playwright em: landing (desktop e mobile), login, onboarding, dashboard (desktop e mobile), treinos, execução, resumo, nutrição, evolução, calendário, hábitos, recuperação, Fit AI, Pulse, missões, conquistas, jornada, comunidade, notificações, relatórios, ferramentas, perfil, configurações, assinatura e admin.

## Erros encontrados e corrigidos durante o desenvolvimento

1. **Conversão de fuso invertida no SQL** (`timestamp AT TIME ZONE 'America/Sao_Paulo'` tratava UTC como horário local). Corrigido para `AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'`, afetando sequências e cadastros por dia.
2. **Função passada de Server para Client Component** (formatador de eixo do gráfico), o que gerava erro no dashboard. Trocado por formato nomeado.
3. **Barras do gráfico em posição errada** com o `shape` customizado; substituído por `radius` nativo + `Cell`.
4. **Calendário exibindo horário no fuso do navegador** em vez do fuso do app.
5. **Divergências de hidratação** (data no cabeçalho e coordenadas do anel do Pulse com precisão de ponto flutuante diferente entre servidor e cliente).
6. **Manipulação de pontuação**: sessões de segundos concediam a conquista "Primeiro Passo". Sessões com menos de 5 minutos não contam mais para XP, conquistas e missões.
7. **Preferências sem efeito**: o toggle de lembretes passou a ser respeitado; o toggle de e-mails (sem efeito real) foi removido; a visibilidade de perfil ganhou a página de perfil da comunidade que a aplica.
8. **Configurações globais do admin sem efeito**: agora pausam cadastros, suspendem a comunidade e exibem o banner.
9. **Botão "Pular" ambíguo** no descanso, renomeado para "Pular descanso".
10. **Exportação de rotas extras** em `route.ts` (proibida pelo Next.js), movida para o módulo de validações.

## Decisões arquiteturais

- **Next.js monorrepo com camada de serviços isolada** (`src/server/services`) e API REST versionada, em vez de dois deploys separados: menos infraestrutura e a mesma separação de responsabilidades.
- **Sessões opacas no banco** em vez de JWT: revogação imediata, listagem de dispositivos e nenhum segredo no cliente.
- **Rate limit em PostgreSQL**: funciona com várias instâncias sem exigir Redis. A interface permite trocar por Redis no futuro.
- **XP como livro-razão idempotente** (`xp_events` com `sourceKey` único): pontuação só por eventos do servidor e sem duplicação.
- **Metas nutricionais como histórico** (`nutrition_logs` por data): a meta vigente é a mais recente até o dia consultado.
- **Plano inicial por regras, não por IA**: previsível, sem custo e sem fingir inteligência.
- **Fotos em armazenamento local privado** com interface fácil de trocar por S3/R2.
- **Versões fixadas** em linhas estáveis (Next 15.5, Prisma 6, Zod 3, Tailwind 4.1) para reduzir risco.

## Pendências e próximas tarefas prioritárias

1. Configurar credenciais reais (Anthropic, SMTP, Stripe) e validar ponta a ponta em homologação, incluindo o webhook com o Stripe CLI.
2. Testar ao vivo a integração com o Open Food Facts e avaliar uma base nacional (ex.: tabela TACO) com licença adequada.
3. Trocar `storage.ts` por armazenamento de objetos (S3/R2) antes de deploy serverless.
4. **Desafios coletivos**: o campo `missions.isCommunity` existe, mas falta o ranking agregado por missão.
5. Papel **Profissional autorizado**: existe na hierarquia, mas falta o fluxo de acompanhamento de alunos com consentimento.
6. PostgreSQL **Row Level Security** como defesa em profundidade (`SET app.user_id` por transação).
7. Notificações push/e-mail para lembretes (hoje são notificações no app).
8. Mídia demonstrativa real (vídeos/GIFs licenciados) para os exercícios. Hoje há ilustração anatômica dos músculos.
9. Revisão jurídica dos textos legais e preenchimento dos dados do controlador e do DPO.
10. Monitoramento externo (Sentry/OpenTelemetry) e backups agendados no provedor.
11. Internacionalização (estrutura de textos hoje em pt-BR).
