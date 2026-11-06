import {
  CONTENT_ITEMS, FEATURES, GOALS, PRIORITY_LABEL, TECH_QUESTIONS, fontById, paletteById, siteTypeById, styleById, SLIDERS,
} from './catalogs';
import { SCHEMA_VERSION, type Profile, type Project } from './types';
import { formatDate, slugify } from './utils';
import { projectDisplayName } from './validation';
import { buildTheme } from './theme';
import { pendencies } from './rules';

export function exportEnvelope(p: Project, includeNotes: boolean) {
  const project = { ...p, devNotes: includeNotes ? p.devNotes : '' };
  return { app: 'studio-brief', schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), includesPrivateNotes: includeNotes, project };
}

export function downloadText(filename: string, text: string, mime = 'application/json') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportJson(p: Project, includeNotes: boolean) {
  const name = slugify(projectDisplayName(p));
  downloadText(`briefing-${name}.json`, JSON.stringify(exportEnvelope(p, includeNotes), null, 2));
}

const TRI = { yes: 'Sim', no: 'Não', unsure: 'Não sei' } as const;
const HAS = { yes: 'Já possui', partial: 'Possui em parte', no: 'Ainda não possui' } as const;

export const goalLabels = (p: Project) => p.goals.selected.map((id) => GOALS.find((g) => g.id === id)?.label ?? id)
  .concat(p.goals.selected.includes('other') && p.goals.other ? [`(${p.goals.other})`] : []);

export function summaryText(p: Project, profile: Profile, includeNotes = false): string {
  const th = buildTheme(p);
  const L: string[] = [];
  const line = (label: string, v: string | undefined | false) => { if (v) L.push(`${label}: ${v}`); };
  const h = (t: string) => { L.push('', t.toUpperCase()); };
  L.push(`BRIEFING — ${projectDisplayName(p)}`);
  if (profile.name) L.push(`Responsável: ${profile.name}`);
  h('Cliente');
  line('Nome', p.client.name); line('Empresa', p.client.company); line('Segmento', p.client.segment);
  line('Cidade/região', p.client.city); line('WhatsApp', p.client.whatsapp); line('E-mail', p.client.email);
  line('Instagram', p.client.instagram); line('Outras redes', p.client.otherSocial); line('Endereço', p.client.address);
  line('Descrição', p.client.description);
  line('Site atual', p.client.hasSite === 'yes' ? p.client.currentUrl || 'sim (endereço não informado)' : p.client.hasSite === 'no' ? 'não possui' : '');
  h('Objetivos');
  line('Objetivos', goalLabels(p).join('; ')); line('Público-alvo', p.goals.audience); line('Concorrentes', p.goals.competitors);
  line('Diferenciais', p.goals.differentials); line('Ações do visitante', [...p.goals.actions, p.goals.actionsOther].filter(Boolean).join('; '));
  h('Projeto');
  line('Tipo de site', siteTypeById(p.siteType)?.name);
  const st = styleById(p.style.primary);
  line('Estilo principal', st?.name);
  line('Características secundárias', p.style.secondary.map((s) => styleById(s)?.name).join(', '));
  line('Tendências', SLIDERS.map((s) => `${s.left} ↔ ${s.right}: ${p.style.sliders[s.id]}%`).join(' | '));
  line('Paleta', `${paletteById(p.colors.paletteId).name} — principal ${p.colors.primary}, secundária ${p.colors.secondary}, destaque ${p.colors.accent}, fundo ${p.colors.background} (tema ${p.colors.mode === 'dark' ? 'escuro' : 'claro'})`);
  line('Tipografia', `títulos ${fontById(p.typography.heading).name}, textos ${fontById(p.typography.body).name}`);
  h('Páginas');
  p.pages.forEach((pg, i) => L.push(`${i + 1}. ${pg.name}${pg.id === p.homeId ? ' (principal)' : ''} — ${pg.sections.length} seções`));
  h('Funcionalidades');
  for (const id of p.features) {
    const f = FEATURES.find((x) => x.id === id);
    if (f) L.push(`- ${f.name}${p.priorities[id] ? ` [${PRIORITY_LABEL[p.priorities[id]]}]` : ''}`);
  }
  h('Interface');
  line('Cabeçalho', th.headerFixed ? 'fixo' : 'normal'); line('Botões', th.btnRadius > 8 ? 'arredondados' : 'retos');
  line('Animações', { none: 'sem animações', subtle: 'discretas', rich: 'elaboradas' }[th.motion]);
  h('Conteúdo');
  for (const c of CONTENT_ITEMS) if (p.content.has[c.id]) L.push(`- ${c.label}: ${HAS[p.content.has[c.id]]}`);
  p.content.refs.filter((r) => r.url).forEach((r) => L.push(`- Referência: ${r.url}${r.likes.length ? ` (${r.likes.join(', ')})` : ''}`));
  line('A produzir', p.content.toProduce);
  h('Requisitos técnicos');
  for (const q of TECH_QUESTIONS) { const a = p.tech.answers[q.id]; if (a) L.push(`- ${q.q} ${TRI[a]}`); }
  h('Prazo e prioridades');
  line('Lançamento desejado', formatDate(p.timeline.launchDate)); line('Evento/prazo', p.timeline.event);
  line('Orçamento', p.timeline.budgetLater ? 'prefere conversar depois' : p.timeline.budget);
  line('Observações de escopo', p.timeline.scopeNotes);
  const pend = pendencies(p);
  if (pend.length) { h('Pendências'); pend.forEach((x) => L.push(`- ${x.text}`)); }
  if (includeNotes && p.devNotes.trim()) { h('Anotações privadas do desenvolvedor'); L.push(p.devNotes.trim()); }
  return L.join('\n');
}
