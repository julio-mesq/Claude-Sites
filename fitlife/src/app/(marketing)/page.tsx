import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  CalendarDays,
  Check,
  ChevronDown,
  Dumbbell,
  Flame,
  HeartPulse,
  LineChart,
  Lock,
  Medal,
  Moon,
  Salad,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";
import { HeroVisual } from "@/components/three/hero-visual";
import { Reveal } from "@/components/marketing/reveal";
import { buttonClass } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { ProgressBar, Ring } from "@/components/ui/progress";
import { PLANS } from "@/server/services/billing";
import { db } from "@/server/db";

export const revalidate = 3600;

async function libraryFacts() {
  try {
    const [exercises, achievements, missions] = await Promise.all([db.exercise.count({ where: { isPublished: true, authorId: null } }), db.achievement.count(), db.mission.count({ where: { isActive: true } })]);
    return { exercises, achievements, missions };
  } catch {
    return null;
  }
}

const BENEFITS = [
  { icon: Dumbbell, title: "Treino inteligente", text: "Plano inicial gerado a partir do seu objetivo, nível e equipamentos. Execução guiada com cronômetro, descanso e registro de cargas." },
  { icon: Salad, title: "Nutrição sob controle", text: "Diário alimentar com metas estimadas de calorias e macros, água, favoritos, receitas e lista de compras." },
  { icon: LineChart, title: "Evolução visível", text: "Medidas, fotos privadas, comparações entre datas e gráficos alimentados pelos seus próprios registros." },
  { icon: Trophy, title: "Gamificação justa", text: "XP, níveis, conquistas e missões concedidos por eventos reais do sistema — sem atalhos para manipular pontos." },
  { icon: Bot, title: "Fit AI", text: "Assistente de orientação fitness que considera seus objetivos e histórico, com limites claros de segurança." },
  { icon: ShieldCheck, title: "Privacidade por padrão", text: "Fotos e dados corporais privados, exportação dos seus dados e exclusão de conta a qualquer momento (LGPD)." },
];

const FAQ = [
  { q: "O FitLife é gratuito?", a: "Sim. O plano Free inclui dashboard, registro de treinos, histórico, diário alimentar, hábitos e o Fit AI com limite diário. Os planos Pro e Elite ampliam limites e liberam relatórios avançados." },
  { q: "O FitLife substitui um personal trainer ou nutricionista?", a: "Não. O FitLife organiza sua rotina e oferece orientação geral. Metas nutricionais são estimativas e o Fit AI não faz diagnósticos. Em caso de condições de saúde, procure um profissional." },
  { q: "Como o Fit AI usa meus dados?", a: "Somente se você autorizar nas configurações, o assistente considera seus objetivos, treinos e metas para personalizar respostas. Dados de outros usuários nunca são usados." },
  { q: "Minhas fotos de evolução ficam públicas?", a: "Nunca por padrão. As fotos são armazenadas de forma privada e só podem ser vistas por você, com a sessão autenticada." },
  { q: "Preciso de academia?", a: "Não. No onboarding você informa onde treina e quais equipamentos tem. A biblioteca inclui exercícios com peso corporal, elásticos e halteres." },
  { q: "Posso exportar ou excluir meus dados?", a: "Sim. Em Configurações → Privacidade você baixa todos os seus dados em JSON ou exclui definitivamente a conta." },
];

// Depoimentos ilustrativos: o produto ainda não possui clientes publicados.
const EXAMPLE_TESTIMONIALS = [
  { name: "Exemplo: perfil iniciante", text: "Ter o treino do dia pronto e o cronômetro de descanso na tela tira toda a desculpa para não começar." },
  { name: "Exemplo: perfil intermediário", text: "A sugestão de carga baseada na última sessão me ajuda a progredir sem ficar adivinhando." },
  { name: "Exemplo: perfil focado em hábitos", text: "O Pulse me mostra exatamente onde estou falhando: geralmente hidratação. Simples e direto." },
];

export default async function LandingPage() {
  const facts = await libraryFacts();
  return (
    <div className="noise relative overflow-x-clip">
      {/* ─────────── HERO ─────────── */}
      <section className="relative min-h-[100svh] pt-16">
        <div className="grid-bg pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-neon/10 blur-[120px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 pb-16 pt-10 sm:px-6 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[1.05fr_1fr] lg:pt-0">
          <div className="relative z-10">
            <Reveal>
              <Badge tone="neon" className="mb-6 px-3 py-1 text-xs">
                <Sparkles className="h-3.5 w-3.5" /> Treino · Nutrição · Evolução · IA
              </Badge>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="font-display text-[2.6rem] font-extrabold leading-[1.02] sm:text-6xl lg:text-7xl">
                SEU PRÓXIMO NÍVEL <span className="text-gradient">COMEÇA AGORA.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-mist sm:text-lg">
                Uma nova maneira de treinar, evoluir e transformar sua rotina. Inteligência, tecnologia e performance em uma única plataforma.
              </p>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className={buttonClass("primary", "lg", "group")}>
                  Começar gratuitamente <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a href="#plataforma" className={buttonClass("outline", "lg")}>
                  Conhecer a plataforma
                </a>
              </div>
            </Reveal>
            <Reveal delay={0.25}>
              <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-white/5 pt-6">
                {[
                  [facts ? `${facts.exercises}+` : "60+", "exercícios guiados"],
                  [facts ? String(facts.achievements) : "12", "conquistas reais"],
                  [facts ? String(facts.missions) : "8", "missões ativas"],
                ].map(([v, l]) => (
                  <div key={l}>
                    <dt className="sr-only">{l}</dt>
                    <dd className="font-display text-2xl font-bold text-snow">{v}</dd>
                    <dd className="mt-1 text-xs text-mist">{l}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
          <div className="relative h-[420px] sm:h-[520px] lg:h-[640px]">
            <HeroVisual />
            <div className="glass absolute bottom-10 left-0 hidden w-56 rounded-2xl p-4 sm:block lg:-left-6" style={{ animation: "var(--animate-float)" }}>
              <div className="flex items-center gap-2 text-xs text-mist">
                <HeartPulse className="h-4 w-4 text-neon" /> FitLife Pulse
              </div>
              <div className="mt-2 flex items-end gap-2">
                <span className="font-display text-3xl font-bold">82</span>
                <span className="mb-1 text-xs text-neon">Em ritmo forte</span>
              </div>
              <ProgressBar value={82} className="mt-3" label="Exemplo de índice de consistência" />
              <p className="mt-2 text-[10px] text-mist-700">Ilustração</p>
            </div>
            <div className="glass absolute right-0 top-12 hidden w-52 rounded-2xl p-4 sm:block" style={{ animation: "var(--animate-float)", animationDelay: "-3s" }}>
              <div className="flex items-center gap-2 text-xs text-mist">
                <Flame className="h-4 w-4 text-warning" /> Sequência
              </div>
              <div className="mt-1 font-display text-3xl font-bold">
                12 <span className="text-sm font-medium text-mist">dias</span>
              </div>
              <div className="mt-3 flex gap-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <span key={i} className="h-6 flex-1 rounded-md bg-neon/80" style={{ opacity: 0.35 + i * 0.1 }} />
                ))}
              </div>
              <p className="mt-2 text-[10px] text-mist-700">Ilustração</p>
            </div>
          </div>
        </div>
        <a href="#recursos" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-mist hover:text-neon lg:block" aria-label="Rolar para recursos">
          <ChevronDown className="h-6 w-6 animate-bounce" />
        </a>
      </section>

      {/* ─────────── BENEFÍCIOS ─────────── */}
      <section id="recursos" className="relative scroll-mt-20 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Por que FitLife</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-5xl">Tudo que sua evolução precisa. Nada que atrapalhe.</h2>
            <p className="mt-4 text-mist">Treinos, alimentação, hábitos, descanso e progresso conectados — cada dado alimenta a próxima decisão.</p>
          </Reveal>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b, i) => (
              <Reveal key={b.title} delay={i * 0.05}>
                <div className="glass group h-full rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-neon/25">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-neon/10 text-neon transition-all group-hover:bg-neon group-hover:text-ink-950 group-hover:shadow-glow">
                    <b.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist">{b.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── PRÉVIA DO DASHBOARD ─────────── */}
      <section id="plataforma" className="relative scroll-mt-20 py-24">
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-neon/8 blur-[140px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">A plataforma</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-5xl">Um painel que mostra o que importa hoje.</h2>
            <p className="mt-4 text-mist">Próximo treino, metas do dia, consistência e evolução em uma única tela — no computador ou no celular.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="glass-strong relative mt-12 overflow-hidden rounded-3xl p-3 sm:p-5">
              <div className="mb-4 flex items-center justify-between px-2">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-danger/70" />
                  <span className="h-3 w-3 rounded-full bg-warning/70" />
                  <span className="h-3 w-3 rounded-full bg-neon/70" />
                </div>
                <Badge>Prévia ilustrativa · dados de exemplo</Badge>
              </div>
              <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr]">
                <div className="rounded-2xl border border-white/5 bg-ink-900/70 p-5">
                  <div className="text-xs text-mist">Próximo treino</div>
                  <div className="mt-1 font-display text-xl font-bold">Superiores A</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone="neon">
                      <Timer className="h-3 w-3" /> 50 min
                    </Badge>
                    <Badge>6 exercícios</Badge>
                    <Badge>Peito · Costas · Ombros</Badge>
                  </div>
                  <div className="mt-5 flex h-28 items-end gap-2">
                    {[40, 65, 50, 80, 72, 90, 60, 85].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-neon-600/30 to-neon" style={{ height: `${h}%`, opacity: 0.5 + i * 0.06 }} />
                    ))}
                  </div>
                  <div className="mt-2 text-[11px] text-mist">Treinos por semana</div>
                </div>
                <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-ink-900/70 p-5">
                  <Ring value={74} size={140} stroke={12} label="Exemplo: 74% da meta calórica">
                    <div>
                      <div className="font-display text-2xl font-bold">1.850</div>
                      <div className="text-[11px] text-mist">de 2.500 kcal</div>
                    </div>
                  </Ring>
                  <div className="mt-4 grid w-full grid-cols-3 gap-2 text-center text-[11px]">
                    <div>
                      <div className="font-semibold text-neon">132g</div>
                      <div className="text-mist">Proteína</div>
                    </div>
                    <div>
                      <div className="font-semibold text-info">190g</div>
                      <div className="text-mist">Carbo</div>
                    </div>
                    <div>
                      <div className="font-semibold text-warning">58g</div>
                      <div className="text-mist">Gordura</div>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3">
                  {[
                    { icon: Activity, l: "Treinos no mês", v: "14" },
                    { icon: Flame, l: "Sequência ativa", v: "9 dias" },
                    { icon: Target, l: "Metas concluídas", v: "3/5" },
                  ].map((s) => (
                    <div key={s.l} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-ink-900/70 p-4">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-neon/10 text-neon">
                        <s.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-[11px] text-mist">{s.l}</div>
                        <div className="font-display text-lg font-bold">{s.v}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────── FEATURES ALTERNADAS ─────────── */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl space-y-24 px-4 sm:px-6">
          {[
            {
              eyebrow: "Treinamento inteligente",
              title: "Do plano à última série, tudo guiado.",
              points: ["Plano inicial adaptado ao seu objetivo, nível e equipamentos", "Criador de treinos com reordenação, séries, repetições, carga e descanso", "Modo execução com cronômetro, descanso automático e registro real de cargas", "Sugestão de carga por dupla progressão e recordes pessoais automáticos"],
              icon: Dumbbell,
              visual: (
                <div className="space-y-3">
                  {[
                    ["Supino reto com halteres", "4 × 8-12", "Sugestão: 26 kg", true],
                    ["Remada unilateral", "4 × 10", "Mantenha 24 kg", false],
                    ["Elevação lateral", "3 × 12-15", "Sem histórico", false],
                  ].map(([n, s, sug, active]) => (
                    <div key={n as string} className={`flex items-center justify-between rounded-xl border p-4 ${active ? "border-neon/40 bg-neon/5" : "border-white/5 bg-ink-900/70"}`}>
                      <div>
                        <div className="text-sm font-semibold">{n}</div>
                        <div className="text-xs text-mist">{s}</div>
                      </div>
                      <Badge tone={active ? "neon" : "neutral"}>{sug}</Badge>
                    </div>
                  ))}
                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-ink-900/70 p-4">
                    <div className="text-sm text-mist">Descanso</div>
                    <div className="font-display text-3xl font-bold tabular-nums text-neon">01:15</div>
                  </div>
                </div>
              ),
            },
            {
              eyebrow: "Nutrição personalizada",
              title: "Coma com intenção, não com culpa.",
              points: ["Metas de calorias e macros estimadas a partir do seu perfil (não são prescrição)", "Diário por refeição com busca, favoritos e refeições personalizadas", "Registro de água com meta diária e histórico", "Receitas e lista de compras integradas"],
              icon: Salad,
              visual: (
                <div className="space-y-4">
                  {[
                    ["Proteína", 132, 160, "neon"],
                    ["Carboidratos", 190, 260, "info"],
                    ["Gorduras", 58, 75, "warning"],
                    ["Água", 2.1, 3, "violet"],
                  ].map(([l, v, m, t]) => (
                    <div key={l as string}>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span>{l}</span>
                        <span className="text-mist">
                          {v} / {m}
                          {l === "Água" ? " L" : " g"}
                        </span>
                      </div>
                      <ProgressBar value={v as number} max={m as number} tone={t as "neon"} />
                    </div>
                  ))}
                  <p className="text-[11px] text-mist-700">Valores de exemplo para ilustração.</p>
                </div>
              ),
            },
            {
              eyebrow: "Acompanhamento da evolução",
              title: "Veja sua transformação acontecer.",
              points: ["Peso, circunferências e % de gordura com o método informado", "Comparador de avaliações e de fotos privadas", "Body Journey: linha do tempo com seus marcos reais", "Mapa de equilíbrio muscular dos últimos 30 dias"],
              icon: BarChart3,
              visual: (
                <div>
                  <div className="relative h-44">
                    <svg viewBox="0 0 300 120" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
                      <defs>
                        <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0" stopColor="#B6FF3B" stopOpacity=".35" />
                          <stop offset="1" stopColor="#B6FF3B" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M0 30 C40 35 60 45 90 50 S150 62 180 70 S240 80 300 92 L300 120 L0 120Z" fill="url(#lg)" />
                      <path d="M0 30 C40 35 60 45 90 50 S150 62 180 70 S240 80 300 92" fill="none" stroke="#B6FF3B" strokeWidth="2.5" />
                    </svg>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    {[
                      ["Cintura", "-4 cm"],
                      ["Peso", "-3,2 kg"],
                      ["Braço", "+1 cm"],
                    ].map(([l, v]) => (
                      <div key={l} className="rounded-xl border border-white/5 bg-ink-900/70 p-3">
                        <div className="text-[11px] text-mist">{l}</div>
                        <div className="font-display font-bold text-neon">{v}</div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] text-mist-700">Gráfico ilustrativo.</p>
                </div>
              ),
            },
          ].map((f, i) => (
            <div key={f.title} className={`grid items-center gap-10 lg:grid-cols-2 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
              <Reveal>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-neon">
                  <f.icon className="h-4 w-4" /> {f.eyebrow}
                </p>
                <h3 className="mt-3 text-3xl font-bold sm:text-4xl">{f.title}</h3>
                <ul className="mt-6 space-y-3">
                  {f.points.map((p) => (
                    <li key={p} className="flex gap-3 text-mist">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-neon" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={0.1}>
                <div className="glass rounded-3xl p-6">{f.visual}</div>
              </Reveal>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────── FIT AI + DIFERENCIAIS ─────────── */}
      <section id="fit-ai" className="scroll-mt-20 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="glass-strong relative overflow-hidden rounded-3xl p-6 sm:p-12">
            <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-neon/15 blur-[100px]" />
            <div className="relative grid gap-10 lg:grid-cols-2">
              <Reveal>
                <Badge tone="neon">
                  <Bot className="h-3.5 w-3.5" /> FIT AI
                </Badge>
                <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Seu personal trainer digital, com responsabilidade.</h2>
                <p className="mt-4 text-mist">
                  Pergunte sobre técnica, alternativas de exercícios, organização da semana ou conceitos de nutrição. Com sua autorização, o Fit AI considera seus objetivos e seu histórico para responder.
                </p>
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/5 p-4 text-sm text-mist">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  O Fit AI não diagnostica doenças, não prescreve medicamentos e não substitui médicos, nutricionistas ou profissionais de educação física.
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <div className="space-y-3 rounded-2xl border border-white/5 bg-ink-950/60 p-5">
                  <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-neon px-4 py-2.5 text-sm text-ink-950">Qual alternativa ao supino se eu treino em casa só com halteres?</div>
                  <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-white/5 bg-ink-800 px-4 py-3 text-sm text-snow/90">
                    Boa opção: <strong>supino com halteres no chão</strong> (floor press). Ele limita a amplitude e protege os ombros. Faça 4×8-12 e progrida primeiro nas repetições…
                  </div>
                  <p className="text-center text-[11px] text-mist-700">Conversa ilustrativa</p>
                </div>
              </Reveal>
            </div>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: HeartPulse, t: "FitLife Pulse", d: "Indicador animado da sua consistência em treinos, hábitos, alimentação e hidratação." },
              { icon: Target, t: "Mission Mode", d: "Missões com prazo e recompensa, acompanhadas automaticamente pelos seus registros." },
              { icon: Medal, t: "Body Journey", d: "Linha do tempo com seus marcos: primeiro treino, recordes, metas e sequências." },
              { icon: Moon, t: "Smart Recovery", d: "Sono, cansaço e dor percebida com sugestões gerais para respeitar o descanso." },
            ].map((f, i) => (
              <Reveal key={f.t} delay={i * 0.05}>
                <div className="glass h-full rounded-2xl p-5">
                  <f.icon className="h-6 w-6 text-neon" />
                  <h3 className="mt-4 font-semibold">{f.t}</h3>
                  <p className="mt-1.5 text-sm text-mist">{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── DESAFIOS ─────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Desafios e conquistas</p>
            <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold sm:text-4xl">Cada treino conta. Literalmente.</h2>
          </Reveal>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {["Primeiro Passo", "Consistência", "Evolução", "Disciplina", "Maratonista", "Caçador de Recordes", "Hidratado", "Hábito Formado"].map((a, i) => (
              <Reveal key={a} delay={i * 0.03}>
                <div className="glass flex items-center gap-2.5 rounded-full py-2 pl-2 pr-4">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-neon to-neon-600 text-ink-950">
                    <Zap className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium">{a}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── DEPOIMENTOS (EXEMPLOS) ─────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Como o FitLife pode se encaixar na sua rotina</h2>
            <p className="mt-2 text-sm text-mist">Depoimentos demonstrativos — exemplos ilustrativos, não são clientes reais.</p>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {EXAMPLE_TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.06}>
                <figure className="glass h-full rounded-2xl p-6">
                  <blockquote className="text-sm leading-relaxed text-snow/90">“{t.text}”</blockquote>
                  <figcaption className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-mist">{t.name}</span>
                    <Badge>Exemplo</Badge>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── PLANOS ─────────── */}
      <section id="planos" className="scroll-mt-20 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neon">Planos e preços</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-5xl">Comece grátis. Evolua quando quiser.</h2>
          </Reveal>
          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            {PLANS.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.06}>
                <div className={`relative flex h-full flex-col rounded-3xl p-7 ${p.highlight ? "glass-strong border-neon/40 shadow-glow" : "glass"}`}>
                  {p.highlight && (
                    <Badge tone="neon" className="absolute -top-3 left-7 bg-ink-900">
                      Mais popular
                    </Badge>
                  )}
                  <h3 className="font-display text-lg font-bold">{p.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-extrabold">{p.priceMonthly === 0 ? "Grátis" : `R$ ${p.priceMonthly.toFixed(2).replace(".", ",")}`}</span>
                    {p.priceMonthly > 0 && <span className="text-sm text-mist">/mês</span>}
                  </div>
                  <ul className="mt-6 flex-1 space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2.5 text-sm text-mist">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-neon" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className={buttonClass(p.highlight ? "primary" : "outline", "md", "mt-8 w-full")}>
                    {p.id === "FREE" ? "Criar conta grátis" : `Começar com ${p.name.replace("FitLife ", "")}`}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-mist-700">Planos pagos são contratados dentro da plataforma, após criar sua conta. Cancele quando quiser.</p>
        </div>
      </section>

      {/* ─────────── FAQ ─────────── */}
      <section id="faq" className="scroll-mt-20 py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Reveal className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Perguntas frequentes</h2>
          </Reveal>
          <div className="mt-10 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="glass group rounded-2xl p-5 open:border-neon/20">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {f.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-mist transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-mist">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── CTA FINAL ─────────── */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-neon/30 bg-gradient-to-br from-neon/15 via-ink-900 to-ink-950 p-8 text-center sm:p-16">
            <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
            <div className="relative">
              <CalendarDays className="mx-auto h-10 w-10 text-neon" />
              <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-bold sm:text-5xl">Seu corpo. Sua evolução. Seu próximo nível.</h2>
              <p className="mx-auto mt-4 max-w-xl text-mist">Crie sua conta em menos de um minuto e receba seu plano inicial personalizado.</p>
              <Link href="/register" className={buttonClass("primary", "lg", "mt-8")}>
                Começar agora <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
