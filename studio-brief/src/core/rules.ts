import {
  FEATURES, FONT_PAIRS, PAGE_CATALOG, PALETTES, SECTIONS, featureById, fontById, pageDefByKey,
  paletteById, siteTypeById, styleById,
} from './catalogs';
import type { Project, SiteTypeId, StepId, StyleId } from './types';
import { STEP_ORDER } from './types';
import { checkContrast } from './contrast';
import { buildTheme } from './theme';
import { uid } from './utils';

export const STEP_META: Record<StepId, { title: string; short: string; question: string }> = {
  client: { title: 'Conhecendo o cliente', short: 'Cliente', question: 'Vamos começar pelo seu negócio' },
  goals: { title: 'Objetivo do site', short: 'Objetivo', question: 'O que você deseja conquistar com seu novo site?' },
  siteType: { title: 'Tipo de site', short: 'Tipo', question: 'Que tipo de site faz mais sentido para você?' },
  style: { title: 'Estilo visual', short: 'Estilo', question: 'Qual dessas identidades visuais combina mais com sua marca?' },
  colors: { title: 'Cores', short: 'Cores', question: 'Quais cores representam sua marca?' },
  typography: { title: 'Tipografia', short: 'Fontes', question: 'Como as palavras do seu site devem soar?' },
  pages: { title: 'Estrutura e páginas', short: 'Páginas', question: 'Quais páginas seu site deverá ter?' },
  features: { title: 'Funcionalidades', short: 'Recursos', question: 'O que o visitante poderá fazer dentro do seu site?' },
  behavior: { title: 'Aparência e comportamento', short: 'Interface', question: 'Como o site deve se comportar e parecer?' },
  content: { title: 'Conteúdo e identidade', short: 'Conteúdo', question: 'O que você já tem para o site?' },
  tech: { title: 'Requisitos técnicos', short: 'Técnico', question: 'Algumas perguntas simples sobre a parte técnica' },
  timeline: { title: 'Prazo, investimento e prioridades', short: 'Prazo', question: 'Quando e com que prioridades?' },
};

export interface Screen { title: string; short: string; steps: StepId[] }
export const SCREENS: Screen[] = [
  { title: 'Cliente e objetivo', short: 'Cliente', steps: ['client', 'goals'] },
  { title: 'Tipo e estilo', short: 'Estilo', steps: ['siteType', 'style'] },
  { title: 'Cores e fontes', short: 'Cores', steps: ['colors', 'typography'] },
  { title: 'Páginas e recursos', short: 'Páginas', steps: ['pages', 'features'] },
  { title: 'Interface e conteúdo', short: 'Interface', steps: ['behavior', 'content'] },
  { title: 'Técnico e prazo', short: 'Prazo', steps: ['tech', 'timeline'] },
];
export const screenOf = (s: StepId) => Math.max(0, SCREENS.findIndex((x) => x.steps.includes(s)));

export function isLanding(p: Project) { return p.siteType === 'landing'; }

/* ---------- páginas ---------- */
export function makePage(key: string, name?: string, sections?: string[]) {
  const def = pageDefByKey(key);
  return { id: uid(), key, name: name ?? def?.name ?? 'Nova página', sections: sections ?? def?.sections ?? ['hero'] };
}

export function defaultPagesFor(type: SiteTypeId) {
  const t = siteTypeById(type)!;
  if (type === 'landing') return [makePage('home', 'Página única', t.homeSections)];
  return t.defaultPages.map((k) => makePage(k, undefined, k === 'home' ? t.homeSections : undefined));
}

export function availablePages(p: Project) {
  return PAGE_CATALOG.filter((d) => !d.types || !p.siteType || d.types.includes(p.siteType));
}

export function homePage(p: Project) {
  return p.pages.find((x) => x.id === p.homeId) ?? p.pages[0] ?? null;
}

export function applySiteType(p: Project, type: SiteTypeId): Project {
  const prev = p.siteType ? defaultPagesFor(p.siteType).map((x) => x.key).join() : '';
  const untouched = p.pages.length === 0 || p.pages.map((x) => x.key).join() === prev;
  const next: Project = { ...p, siteType: type };
  if (untouched) {
    next.pages = defaultPagesFor(type);
    next.homeId = next.pages[0].id;
  }
  return next;
}

/* ---------- recomendações (sempre confirmadas pelo usuário) ---------- */
export interface Recommendation { title: string; lines: string[]; apply: (p: Project) => Project }

const STYLE_BY_SEGMENT: [RegExp, StyleId][] = [
  [/advoc|contab|consult|financ|segur|engenh|clinic|médic|medic|odont/i, 'corporate'],
  [/restaur|café|cafe|padar|doce|conf|buffet|pet|creche|escola|infantil/i, 'warm'],
  [/arquitet|fot[oó]|design|agência|agencia|arte/i, 'editorial'],
  [/tecnolog|software|app|sistema|dados|startup/i, 'tech'],
  [/moda|beleza|estética|estetica|joia|perfum|casamento|hotel/i, 'elegant'],
  [/músic|musica|evento|festa|entreten|crie|criativ/i, 'creative'],
];
const PALETTE_BY_STYLE: Record<StyleId, string> = {
  minimal: 'mono', elegant: 'neutral', corporate: 'corporate-blue', modern: 'nature',
  creative: 'earth', warm: 'earth', editorial: 'mono', tech: 'corporate-blue',
};
const PAIR_BY_STYLE: Record<StyleId, string> = {
  minimal: 'clean', elegant: 'editorial', corporate: 'authority', modern: 'friendly',
  creative: 'expressive', warm: 'warm', editorial: 'literary', tech: 'technical',
};
const TYPE_BY_GOAL: [string, SiteTypeId][] = [
  ['sell', 'store'], ['orders', 'menu'], ['booking', 'booking'], ['courses', 'education'],
  ['events', 'events'], ['portfolio', 'portfolio'], ['content', 'blog'], ['leads', 'landing'],
  ['services', 'institutional'], ['promote', 'institutional'],
];

export function recommendedStyle(p: Project): StyleId {
  for (const [re, id] of STYLE_BY_SEGMENT) if (re.test(p.client.segment + ' ' + p.client.description)) return id;
  return 'minimal';
}

export function recommend(p: Project, step: StepId): Recommendation | null {
  switch (step) {
    case 'goals': {
      const t = siteTypeById(p.siteType);
      if (!t || !t.goals.length) return null;
      return {
        title: 'Objetivos coerentes com o tipo de site escolhido',
        lines: t.goals.map((g) => g),
        apply: (q) => ({ ...q, goals: { ...q.goals, selected: Array.from(new Set([...q.goals.selected, ...t.goals])) } }),
      };
    }
    case 'siteType': {
      const g = TYPE_BY_GOAL.find(([goal]) => p.goals.selected.includes(goal));
      const id = g ? g[1] : 'institutional';
      const t = siteTypeById(id)!;
      return { title: `${t.name}`, lines: [t.blurb, g ? 'Indicado pelos objetivos que você marcou.' : 'Um ponto de partida seguro para a maioria dos negócios.'], apply: (q) => applySiteType(q, id) };
    }
    case 'style': {
      const id = recommendedStyle(p);
      const s = styleById(id)!;
      return { title: s.name, lines: [s.blurb, 'Sugerido pelo segmento e pela descrição do negócio.'], apply: (q) => ({ ...q, style: { ...q.style, primary: id } }) };
    }
    case 'colors': {
      const pal = paletteById(PALETTE_BY_STYLE[p.style.primary ?? recommendedStyle(p)]);
      return {
        title: pal.name, lines: [`Principal ${pal.primary}`, `Secundária ${pal.secondary}`, `Fundo ${pal.light}`],
        apply: (q) => ({ ...q, colors: { paletteId: pal.id, primary: pal.primary, secondary: pal.secondary, accent: pal.accent, background: q.colors.mode === 'dark' ? pal.dark : pal.light, mode: q.colors.mode } }),
      };
    }
    case 'typography': {
      const pair = FONT_PAIRS.find((x) => x.id === PAIR_BY_STYLE[p.style.primary ?? recommendedStyle(p)])!;
      return {
        title: pair.name, lines: [`Títulos: ${fontById(pair.heading).name}`, `Textos: ${fontById(pair.body).name}`],
        apply: (q) => ({ ...q, typography: { ...q.typography, pairId: pair.id, heading: pair.heading, body: pair.body } }),
      };
    }
    case 'pages': {
      if (!p.siteType) return null;
      const pages = defaultPagesFor(p.siteType);
      return { title: 'Estrutura padrão para este tipo de site', lines: pages.map((x) => x.name), apply: (q) => ({ ...q, pages, homeId: pages[0].id }) };
    }
    case 'features': {
      const t = siteTypeById(p.siteType);
      if (!t) return null;
      return {
        title: 'Recursos mais comuns para este tipo de site',
        lines: t.features.map((id) => featureById(id)?.name ?? id),
        apply: (q) => ({ ...q, features: Array.from(new Set([...q.features, ...t.features])) }),
      };
    }
    case 'behavior': {
      return {
        title: 'Um conjunto equilibrado e acessível',
        lines: ['Cabeçalho fixo', 'Menu tradicional', 'Animações discretas', 'Menu lateral no celular'],
        apply: (q) => ({ ...q, behavior: { ...q.behavior, header: 'fixed', menu: 'classic', motion: 'subtle', mobileMenu: 'drawer', hover: 'lift', transitions: 'fade' } }),
      };
    }
    case 'tech': {
      return {
        title: 'Itens que costumam fazer sentido em quase todo projeto',
        lines: ['SEO básico', 'Ferramentas de análise', 'Integração com WhatsApp (se houver botão)'],
        apply: (q) => ({ ...q, tech: { ...q.tech, answers: { ...q.tech.answers, seo: q.tech.answers.seo || 'yes', analytics: q.tech.answers.analytics || 'yes', whatsapp: q.tech.answers.whatsapp || (q.features.includes('whatsapp') ? 'yes' : '') } } }),
      };
    }
    case 'timeline': {
      if (!p.features.length) return null;
      return {
        title: 'Prioridades iniciais a partir dos níveis de cada recurso',
        lines: ['Essenciais → Indispensável', 'Opcionais → Desejável', 'Avançados → Segunda versão'],
        apply: (q) => {
          const priorities = { ...q.priorities };
          for (const id of q.features) {
            if (priorities[id]) continue;
            const f = featureById(id);
            priorities[id] = f?.level === 'essential' ? 'must' : f?.level === 'advanced' ? 'later' : 'nice';
          }
          return { ...q, priorities };
        },
      };
    }
    default: return null;
  }
}

/* ---------- coerência entre etapas (sugestões, nunca automáticas) ---------- */
export interface Suggestion { id: string; text: string; action: string; apply: (p: Project) => Project }

const FEATURE_PAGE: { feature: string; page: string; label: string }[] = [
  { feature: 'cart', page: 'cart', label: 'carrinho' },
  { feature: 'payments', page: 'checkout', label: 'pagamento online' },
  { feature: 'booking', page: 'booking', label: 'agendamento online' },
  { feature: 'blog', page: 'blog', label: 'blog' },
  { feature: 'catalog', page: 'products', label: 'catálogo de produtos' },
  { feature: 'faq', page: 'faq', label: 'FAQ' },
  { feature: 'login', page: 'client-area', label: 'login e cadastro' },
  { feature: 'client-panel', page: 'client-area', label: 'painel de clientes' },
  { feature: 'courses', page: 'courses', label: 'cursos' },
];
const DATA_FEATURES = ['contact-form', 'newsletter', 'lead-capture', 'quote', 'login', 'booking'];

export function consistency(p: Project): Suggestion[] {
  const out: Suggestion[] = [];
  if (!p.pages.length) return out;
  const has = (key: string) => p.pages.some((x) => x.key === key);
  if (isLanding(p)) return out;
  const seen = new Set<string>();
  for (const r of FEATURE_PAGE) {
    if (p.features.includes(r.feature) && !has(r.page) && !seen.has(r.page)) {
      seen.add(r.page);
      const def = pageDefByKey(r.page)!;
      out.push({
        id: `page-${r.page}`, text: `Você marcou ${r.label}, mas ainda não há a página “${def.name}”.`,
        action: `Adicionar “${def.name}”`, apply: (q) => ({ ...q, pages: [...q.pages, makePage(r.page)] }),
      });
    }
  }
  if (p.features.some((f) => DATA_FEATURES.includes(f)) && !has('privacy')) {
    out.push({
      id: 'page-privacy', text: 'O site vai coletar dados pessoais. A LGPD recomenda uma política de privacidade.',
      action: 'Adicionar “Política de privacidade”', apply: (q) => ({ ...q, pages: [...q.pages, makePage('privacy')] }),
    });
  }
  return out;
}

/* ---------- pendências e decisões em aberto ---------- */
export interface Pending { id: string; text: string; step: StepId }

export function pendencies(p: Project): Pending[] {
  const out: Pending[] = [];
  const add = (id: string, text: string, step: StepId) => out.push({ id, text, step });
  if (!p.client.name.trim()) add('c-name', 'Nome do cliente não informado', 'client');
  if (!p.client.company.trim()) add('c-company', 'Nome da empresa ou marca não informado', 'client');
  if (!p.client.whatsapp.trim() && !p.client.email.trim()) add('c-contact', 'Nenhum contato (WhatsApp ou e-mail) informado', 'client');
  if (!p.goals.selected.length) add('g', 'Objetivos do site ainda não definidos', 'goals');
  if (!p.siteType) add('t', 'Tipo de site em aberto', 'siteType');
  if (!p.style.primary) add('s', 'Direção visual em aberto', 'style');
  const th = buildTheme(p);
  const failing = checkContrast({ primary: th.primary, secondary: th.secondary, background: th.bg, ink: th.ink, onPrimary: th.onPrimary }).filter((c) => !c.pass);
  if (failing.length) add('contrast', `Contraste insuficiente nas cores escolhidas (${failing.length} ${failing.length === 1 ? 'combinação' : 'combinações'})`, 'colors');
  if (!p.pages.length) add('p', 'Estrutura de páginas não definida', 'pages');
  if (!p.features.length) add('f', 'Nenhuma funcionalidade selecionada', 'features');
  for (const s of consistency(p)) add(s.id, s.text, 'pages');
  for (const id of p.features) {
    const f = featureById(id);
    if (f?.integration && !p.tech.answers.external && !p.tech.answers.payments) add(`int-${id}`, `“${f.name}” depende de integração externa ainda não detalhada`, 'tech');
    if (f && !p.priorities[id]) add(`prio-${id}`, `Prioridade de “${f.name}” não definida`, 'timeline');
  }
  if (p.features.includes('whatsapp-orders') && !p.client.whatsapp.trim()) add('wa', 'Pedidos pelo WhatsApp exigem um número informado', 'client');
  for (const [step, flag] of Object.entries(p.flags)) {
    if (flag === 'unknown') add(`unk-${step}`, `“${STEP_META[step as StepId].title}”: cliente ainda não sabe`, step as StepId);
    if (flag === 'recommend') add(`rec-${step}`, `“${STEP_META[step as StepId].title}”: recomendação solicitada, aguardando confirmação`, step as StepId);
  }
  const unsure = Object.entries(p.tech.answers).filter(([, v]) => v === 'unsure').length;
  if (unsure) add('tech-unsure', `${unsure} ${unsure === 1 ? 'pergunta técnica' : 'perguntas técnicas'} respondidas como “não sei”`, 'tech');
  if (!p.timeline.launchDate && !p.timeline.event) add('date', 'Data de lançamento não informada', 'timeline');
  if (!p.timeline.contentOwner) add('owner', 'Responsável pelo fornecimento de conteúdo em aberto', 'timeline');
  return out;
}

/** Progresso 0–1: etapas visitadas com resposta, puladas ou marcadas. */
export function progress(p: Project): number {
  const done = STEP_ORDER.filter((s) => p.visited.includes(s) || p.flags[s]).length;
  return done / STEP_ORDER.length;
}

/** Itens do catálogo de recursos relevantes para o tipo atual. */
export function relevantFeatures(p: Project, relevant: boolean) {
  return FEATURES.filter((f) => (!p.siteType || f.types.includes(p.siteType)) === relevant);
}

export const sectionName = (k: string) => SECTIONS[k] ?? k;
export { PALETTES };
